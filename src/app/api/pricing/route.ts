import { NextRequest, NextResponse } from 'next/server';
import { getRegistrarOfficialUrl } from '@/lib/registrar-urls';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// Declare KV Namespace and D1 Database bindings for TypeScript
// These are type declarations; the actual bindings are done in wrangler.toml
declare const PRICING_CACHE: any;
declare const PRICING_DB: any;

// Map to store pending requests for deduplication
const pendingRequests = new Map<string, Promise<any>>();

// Data source priority configuration
const DATA_SOURCE_CONFIG = {
  // D1数据库优先级设置 - 强制优先使用D1
  D1_PRIORITY: true,
  // D1数据新鲜度阈值（小时）- 延长到72小时
  D1_FRESHNESS_THRESHOLD_HOURS: 72,
  // 是否启用智能切换 - 保持启用但优先D1
  ENABLE_SMART_FALLBACK: true,
  // API超时时间（毫秒）
  API_TIMEOUT_MS: 8000,
  // D1查询超时时间（毫秒）
  D1_TIMEOUT_MS: 5000
};

// Function to validate pricing data structure
function validatePricingData(data: any): boolean {
  // Basic validation: check if it's an array and has expected properties
  return Array.isArray(data) && data.every(item =>
    typeof item === 'object' &&
    item !== null &&
    (typeof item.new === 'number' || item.new === null) && // registrationPrice
    (typeof item.renew === 'number' || item.renew === null) && // renewalPrice
    (typeof item.transfer === 'number' || item.transfer === null) && // transferPrice
    typeof item.currency === 'string'
  );
}

// Function to fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error: any) {
      console.error(`Fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
      if (attempt === maxRetries || error.name === 'AbortError') { // Don't retry on AbortError (timeout)
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
    }
  }
  throw new Error('Fetch with retry failed after multiple attempts.'); // Should not be reached
}

// Enhanced function to fetch pricing data from Nazhumi API with better error handling
async function fetchNazhumiPricing(domain: string, order: string = 'new'): Promise<{data: any[] | null, metadata: any}> {
  const NAZHUMI_API_BASE = 'https://www.nazhumi.com/api/v1';
  const url = `${NAZHUMI_API_BASE}?domain=${encodeURIComponent(domain)}&order=${order}`;
  const startTime = Date.now();

  console.log(`🌐 Fetching from Nazhumi API: ${url}`);

  try {
    // 使用配置的超时时间
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DATA_SOURCE_CONFIG.API_TIMEOUT_MS);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError: any) {
      console.error(`Failed to parse JSON from Nazhumi API for ${domain}:`, jsonError.message);
      return {
        data: null,
        metadata: {
          source: 'nazhumi',
          responseTime,
          error: 'INVALID_JSON_RESPONSE'
        }
      };
    }

    // Nazhumi API returns { code: 100, data: { domain, order, count, price: [...] } }
    if (data.code === 100 && data.data && data.data.price && validatePricingData(data.data.price)) {
      console.log(`✅ Nazhumi API success for ${domain}: ${data.data.price.length} records (${responseTime}ms)`);
      return {
        data: data.data.price,
        metadata: {
          source: 'nazhumi',
          responseTime,
          recordCount: data.data.price.length,
          apiCode: data.code,
          isFresh: true
        }
      };
    } else if (validatePricingData(data)) {
      console.log(`✅ Nazhumi API success (direct format) for ${domain}: ${data.length} records (${responseTime}ms)`);
      return {
        data: data,
        metadata: {
          source: 'nazhumi',
          responseTime,
          recordCount: data.length,
          isFresh: true
        }
      };
    } else {
      console.warn(`Nazhumi API returned unexpected data format for ${domain}:`, data);
      return {
        data: null,
        metadata: {
          source: 'nazhumi',
          responseTime,
          error: 'UNEXPECTED_DATA_FORMAT',
          apiResponse: data
        }
      };
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Nazhumi API error for ${domain} (${responseTime}ms):`, error.message);

    return {
      data: null,
      metadata: {
        source: 'nazhumi',
        responseTime,
        error: error.name === 'AbortError' ? 'API_TIMEOUT' : error.message,
        isTimeout: error.name === 'AbortError'
      }
    };
  }
}



// Enhanced function to fetch pricing data from D1 database with health checks
async function fetchD1Pricing(domain: string, order: string, PRICING_DB: any): Promise<{data: any[] | null, metadata: any}> {
  if (!PRICING_DB) {
    console.log('D1 database not available');
    return { data: null, metadata: { error: 'D1_NOT_AVAILABLE', source: 'd1' } };
  }

  const startTime = Date.now();

  try {
    console.log(`🗄️ Querying D1 database for ${domain}`);

    // 创建带超时的Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('D1_QUERY_TIMEOUT')), DATA_SOURCE_CONFIG.D1_TIMEOUT_MS);
    });

    const queryPromise = (async () => {
      const query = `
        SELECT
          tld, registrar, registrar_name, registrar_url,
          registration_price, renewal_price, transfer_price,
          currency, currency_name, currency_type,
          has_promo, promo_code, updated_time, crawled_at
        FROM pricing_data
        WHERE tld = ? AND is_active = 1
        ORDER BY
          CASE
            WHEN ? = 'new' THEN registration_price
            WHEN ? = 'renew' THEN renewal_price
            WHEN ? = 'transfer' THEN transfer_price
            ELSE registration_price
          END ASC
      `;

      const result = await PRICING_DB.prepare(query)
        .bind(domain, order, order, order)
        .all();

      return result;
    })();

    const result = await Promise.race([queryPromise, timeoutPromise]) as any;
    const queryTime = Date.now() - startTime;

    if (result.results && result.results.length > 0) {
      console.log(`✅ Found ${result.results.length} records in D1 for ${domain} (${queryTime}ms)`);

      // 检查数据新鲜度
      const latestRecord = result.results[0];
      const crawledAt = new Date(latestRecord.crawled_at);
      const hoursOld = (Date.now() - crawledAt.getTime()) / (1000 * 60 * 60);
      const isFresh = hoursOld <= DATA_SOURCE_CONFIG.D1_FRESHNESS_THRESHOLD_HOURS;

      return {
        data: result.results,
        metadata: {
          source: 'd1',
          queryTime,
          recordCount: result.results.length,
          dataAge: hoursOld,
          isFresh,
          lastCrawled: latestRecord.crawled_at
        }
      };
    } else {
      console.log(`📭 No D1 data found for ${domain} (${queryTime}ms)`);
      return {
        data: null,
        metadata: {
          source: 'd1',
          queryTime,
          recordCount: 0,
          error: 'NO_DATA_FOUND'
        }
      };
    }
  } catch (error: any) {
    const queryTime = Date.now() - startTime;
    console.error(`❌ D1 query error for ${domain} (${queryTime}ms):`, error.message);

    return {
      data: null,
      metadata: {
        source: 'd1',
        queryTime,
        error: error.message,
        isTimeout: error.message === 'D1_QUERY_TIMEOUT'
      }
    };
  }
}

// Transform D1 data to our format
function transformD1Data(d1Data: any[], domain: string) {
  if (!Array.isArray(d1Data) || d1Data.length === 0) {
    return [];
  }

  return d1Data.map((item: any) => ({
    registrar: item.registrar_name || item.registrar || 'Unknown',
    registrarCode: item.registrar,
    registrarUrl: getRegistrarOfficialUrl(item.registrar, item.registrar_url),
    registrationPrice: typeof item.registration_price === 'number' ? item.registration_price : null,
    renewalPrice: typeof item.renewal_price === 'number' ? item.renewal_price : null,
    transferPrice: typeof item.transfer_price === 'number' ? item.transfer_price : null,
    currency: item.currency?.toUpperCase() || 'USD',
    currencyName: item.currency_name,
    currencyType: item.currency_type,
    hasPromo: Boolean(item.has_promo),
    promoCode: item.promo_code,
    updatedTime: item.updated_time,
    crawledAt: item.crawled_at,
    features: [], // Will be added later
    rating: 4.0,
    source: 'ubuntu_sync' // Mark as synced data
  }));
}

// Transform Nazhumi data to our format
function transformNazhumiData(nazhumiData: any[], suffix: string) {
  if (!Array.isArray(nazhumiData) || nazhumiData.length === 0) {
    return [];
  }

  return nazhumiData.map((item: any) => ({
    registrar: item.registrarname || item.registrar || 'Unknown',
    registrarCode: item.registrar,
    registrarUrl: item.registrarweb,
    registrationPrice: typeof item.new === 'number' ? item.new : null,
    renewalPrice: typeof item.renew === 'number' ? item.renew : null,
    transferPrice: typeof item.transfer === 'number' ? item.transfer : null,
    currency: item.currency?.toUpperCase() || 'USD',
    currencyName: item.currencyname,
    currencyType: item.currencytype,
    hasPromo: item.promocode && (item.promocode.new || item.promocode.renew || item.promocode.transfer),
    updatedTime: item.updatedtime,
    features: [], // Nazhumi doesn't provide features, we'll add generic ones
    rating: 4.0, // Default rating since Nazhumi doesn't provide this
    source: 'nazhumi_realtime' // Mark as real-time data
  }));
}

// Helper function to get registrar URL
function getRegistrarUrl(registrarCode: string): string {
  const urlMap: { [key: string]: string } = {
    'cosmotown': 'https://www.cosmotown.com/',
    'spaceship': 'https://www.spaceship.com/',
    'truehost': 'https://truehost.com/',
    'dreamhost': 'https://www.dreamhost.com/',
    'volcengine': 'https://www.volcengine.com/',
    'huawei': 'https://www.huaweicloud.com/',
    'baidu': 'https://cloud.baidu.com/',
    'cloudflare': 'https://www.cloudflare.com/',
    'namecheap': 'https://www.namecheap.com/',
    'porkbun': 'https://porkbun.com/',
    'ovh': 'https://www.ovhcloud.com/',
    'westcn': 'https://www.west.cn/',
    'westxyz': 'https://www.west.xyz/',
    '22cn': 'https://www.22.cn/',
    '363hk': 'https://www.363.hk/',
    'quyu': 'https://www.quyu.net/',
    'zzy': 'https://www.zzy.cn/',
    'sav': 'https://www.sav.com/',
    'juming': 'https://www.juming.com/',
    'regery': 'https://www.regery.com/'
  };
  return urlMap[registrarCode] || `https://${registrarCode}.com`;
}

// Helper function to get currency name
function getCurrencyName(currency: string): string {
  const currencyMap: { [key: string]: string } = {
    'USD': 'US Dollar',
    'CNY': '人民币',
    'EUR': '欧元'
  };
  return currencyMap[currency] || currency;
}

function addRegistrarFeatures(registrarCode: string): string[] {
  const featureMap: { [key: string]: string[] } = {
    'aliyun': ['阿里云生态', '中文客服', '国内备案支持', 'DNS管理'],
    'tencent': ['腾讯云集成', '企业微信支持', '云服务折扣', '技术支持'],
    'baidu': ['百度智能云', 'AI服务集成', '搜索引擎优化', '云计算支持'],
    'huawei': ['华为云生态', '企业级服务', '安全可靠', '技术支持'],
    'volcengine': ['火山引擎云', '字节跳动生态', '全球CDN', '智能分析'],
    'godaddy': ['24/7客服', '网站建设工具', '邮箱服务', '全球化服务'],
    'namecheap': ['免费隐私保护', '邮件转发', 'DNS管理', '性价比高'],
    'cloudflare': ['无加价定价', '免费隐私保护', '安全防护', '全球CDN'],
    'porkbun': ['免费SSL证书', '免费隐私保护', '现代界面', '竞争价格'],
    'dreamhost': ['一键安装WordPress', '免费SSL', '无限流量', '97日退款'],
    'ovh': ['欧洲数据中心', 'GDPR兼容', '多语言支持', '技术支持'],
    'cosmotown': ['新加坡公司', '优惠价格', '简单管理', '快速注册'],
    'spaceship': ['现代界面', '一站式服务', '优秀支持', '竞争价格'],
    'truehost': ['非洲专业', '本地化服务', '稳定可靠', '技术支持'],
    'westcn': ['中文服务', '国内专线', '备案支持', 'DNS加速'],
    'westxyz': ['新顶级域名', '创新标识', '简洁好记', '品牌升级'],
    '22cn': ['中文域名专家', '国内服务器', '备案支持', '本土化服务'],
    '363hk': ['香港公司', '亚太地区', '无需备案', '简单快捷'],
    'quyu': ['中文界面', '本土化服务', '价格透明', '快速响应'],
    'zzy': ['专业域名', '性价比高', '简单管理', '快速部署'],
    'sav': ['简单注册', '优惠价格', '可靠服务', '全球支持'],
    'juming': ['中文域名', '本土化', '专业服务', '快速备案'],
    'regery': ['新兴注册商', '竞争价格', '现代技术', '用户友好']
  };
  return featureMap[registrarCode] || ['域名管理', '客户支持', 'DNS解析', '安全保护'];
}

// Enhanced pricing data based on nazhumi.com website (20 registrars for .com)
const enhancedPricing = {
  'com': [
    { registrar: 'Cosmotown', registrarCode: 'cosmotown', registrationPrice: 7.89, renewalPrice: 9.99, transferPrice: 9.99, currency: 'USD' },
    { registrar: 'Spaceship', registrarCode: 'spaceship', registrationPrice: 8.48, renewalPrice: 9.98, transferPrice: 9.48, currency: 'USD' },
    { registrar: 'Truehost', registrarCode: 'truehost', registrationPrice: 8.50, renewalPrice: 11.45, transferPrice: 11.45, currency: 'USD' },
    { registrar: 'DreamHost', registrarCode: 'dreamhost', registrationPrice: 8.99, renewalPrice: 19.99, transferPrice: 9.99, currency: 'USD' },
    { registrar: '火山引擎', registrarCode: 'volcengine', registrationPrice: 70, renewalPrice: 89, transferPrice: 89, currency: 'CNY' },
    { registrar: '华为云', registrarCode: 'huawei', registrationPrice: 72, renewalPrice: 90, transferPrice: 85, currency: 'CNY' },
    { registrar: 'Quyu', registrarCode: 'quyu', registrationPrice: 75, renewalPrice: 95, transferPrice: 80, currency: 'CNY' },
    { registrar: 'ZZY', registrarCode: 'zzy', registrationPrice: 75, renewalPrice: 92, transferPrice: 78, currency: 'CNY' },
    { registrar: 'Sav', registrarCode: 'sav', registrationPrice: 10.39, renewalPrice: 13.99, transferPrice: 10.99, currency: 'USD' },
    { registrar: 'Cloudflare', registrarCode: 'cloudflare', registrationPrice: 10.44, renewalPrice: 10.44, transferPrice: 10.44, currency: 'USD' },
    { registrar: '363.hk', registrarCode: '363hk', registrationPrice: 77, renewalPrice: 95, transferPrice: 82, currency: 'CNY' },
    { registrar: 'West.cn', registrarCode: 'westcn', registrationPrice: 77, renewalPrice: 96, transferPrice: 83, currency: 'CNY' },
    { registrar: 'West.xyz', registrarCode: 'westxyz', registrationPrice: 10.62, renewalPrice: 14.25, transferPrice: 11.30, currency: 'USD' },
    { registrar: 'OVHcloud', registrarCode: 'ovh', registrationPrice: 10.29, renewalPrice: 13.50, transferPrice: 10.99, currency: 'EUR' },
    { registrar: 'Porkbun', registrarCode: 'porkbun', registrationPrice: 11.06, renewalPrice: 12.76, transferPrice: 11.06, currency: 'USD' },
    { registrar: '22.cn', registrarCode: '22cn', registrationPrice: 81, renewalPrice: 100, transferPrice: 85, currency: 'CNY' },
    { registrar: '百度智能云', registrarCode: 'baidu', registrationPrice: 81, renewalPrice: 99, transferPrice: 86, currency: 'CNY' },
    { registrar: 'Juming', registrarCode: 'juming', registrationPrice: 81, renewalPrice: 98, transferPrice: 84, currency: 'CNY' },
    { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 11.28, renewalPrice: 15.98, transferPrice: 11.28, currency: 'USD' },
    { registrar: 'Regery', registrarCode: 'regery', registrationPrice: 11.29, renewalPrice: 14.99, transferPrice: 11.99, currency: 'USD' }
  ],
  'net': [
    { registrar: 'Cloudflare', registrarCode: 'cloudflare', registrationPrice: 9.68, renewalPrice: 9.68, transferPrice: 9.68, currency: 'USD' },
    { registrar: 'Porkbun', registrarCode: 'porkbun', registrationPrice: 10.45, renewalPrice: 11.98, transferPrice: 10.45, currency: 'USD' },
    { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD' },
    { registrar: 'DreamHost', registrarCode: 'dreamhost', registrationPrice: 13.99, renewalPrice: 19.99, transferPrice: 13.99, currency: 'USD' },
    { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 14.99, renewalPrice: 19.99, transferPrice: 10.99, currency: 'USD' }
  ],
  'org': [
    { registrar: 'Porkbun', registrarCode: 'porkbun', registrationPrice: 8.67, renewalPrice: 10.12, transferPrice: 8.67, currency: 'USD' },
    { registrar: 'Cloudflare', registrarCode: 'cloudflare', registrationPrice: 10.44, renewalPrice: 10.44, transferPrice: 10.44, currency: 'USD' },
    { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD' },
    { registrar: 'DreamHost', registrarCode: 'dreamhost', registrationPrice: 13.99, renewalPrice: 19.99, transferPrice: 13.99, currency: 'USD' },
    { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 13.99, renewalPrice: 18.99, transferPrice: 9.99, currency: 'USD' }
  ]
};

// Basic fallback data
const basicFallback = [
  { registrar: 'Cloudflare', registrarCode: 'cloudflare', registrationPrice: 8.57, renewalPrice: 8.57, transferPrice: 8.57, currency: 'USD' },
  { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 8.88, renewalPrice: 13.98, transferPrice: 8.98, currency: 'USD' },
  { registrar: 'Porkbun', registrarCode: 'porkbun', registrationPrice: 9.13, renewalPrice: 11.98, transferPrice: 9.13, currency: 'USD' },
  { registrar: 'DreamHost', registrarCode: 'dreamhost', registrationPrice: 10.99, renewalPrice: 19.99, transferPrice: 10.99, currency: 'USD' },
  { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 12.99, renewalPrice: 17.99, transferPrice: 8.99, currency: 'USD' }
];

// Smart data source selection function
async function selectDataSource(domain: string, order: string, PRICING_DB: any): Promise<{source: string, data: any[], metadata: any}> {
  console.log(`🧠 Smart data source selection for ${domain}`);

  let d1Result: any = null; // 保存D1结果供后续紧急备用

  // 1. 优先尝试D1数据库（如果启用）
  if (DATA_SOURCE_CONFIG.D1_PRIORITY && PRICING_DB) {
    console.log(`📊 Trying D1 database first for ${domain}`);
    d1Result = await fetchD1Pricing(domain, order, PRICING_DB);

    if (d1Result.data && d1Result.data.length > 0) {
      // 严格校验D1数据新鲜度和完整性：只有在72小时内且记录数>=5才使用D1数据
      if (d1Result.metadata.isFresh && d1Result.data.length >= 5) {
        console.log(`✅ Using fresh D1 data for ${domain} (${d1Result.data.length} records, ${d1Result.metadata.dataAge.toFixed(1)}h old)`);
        return {
          source: 'd1_fresh',
          data: transformD1Data(d1Result.data, domain),
          metadata: d1Result.metadata
        };
      } else if (d1Result.data.length < 5) {
        console.log(`⚠️ D1 data incomplete for ${domain} (only ${d1Result.data.length} records), falling back to API for more complete data`);
        // D1数据不完整，继续使用API
      } else {
        console.log(`⚠️ D1 data is stale for ${domain} (${d1Result.metadata.dataAge.toFixed(1)}h old, threshold: ${DATA_SOURCE_CONFIG.D1_FRESHNESS_THRESHOLD_HOURS}h), falling back to API`);
        // D1数据过期，继续使用API
      }
    } else {
      console.log(`📭 No D1 data for ${domain}, trying API`);
    }
  }

  // 2. D1数据过期/无数据/不可用，使用nazhumi API
  console.log(`🌐 Fetching from Nazhumi API for ${domain}`);
  const apiResult = await fetchNazhumiPricing(domain, order);

  if (apiResult.data && apiResult.data.length > 0) {
    console.log(`✅ Using Nazhumi API data for ${domain}`);
    return {
      source: 'nazhumi_primary',
      data: transformNazhumiData(apiResult.data, domain),
      metadata: apiResult.metadata
    };
  }

  // 3. API也失败，尝试使用过期的D1数据作为紧急备用
  if (DATA_SOURCE_CONFIG.D1_PRIORITY && PRICING_DB && d1Result?.data && d1Result.data.length > 0) {
    console.log(`🚨 API failed, using stale D1 data as emergency fallback for ${domain} (${d1Result.metadata.dataAge.toFixed(1)}h old)`);
    return {
      source: 'd1_emergency_fallback',
      data: transformD1Data(d1Result.data, domain),
      metadata: { ...d1Result.metadata, emergencyFallback: true, apiError: apiResult.metadata?.error }
    };
  }

  // 4. 兜底数据表（待爬虫完成后实现）
  // TODO: 实现兜底数据表查询
  // const fallbackResult = await fetchFallbackData(domain, order);
  // if (fallbackResult.data && fallbackResult.data.length > 0) {
  //   console.log(`🛡️ Using fallback data table for ${domain}`);
  //   return {
  //     source: 'fallback_table',
  //     data: transformFallbackData(fallbackResult.data, domain),
  //     metadata: fallbackResult.metadata
  //   };
  // }

  // 5. 所有数据源都失败
  console.error(`❌ All data sources failed for ${domain}`);
  throw new Error(`No pricing data available for ${domain} from any source`);
}

// Main GET function for the API route
export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const order = searchParams.get('order') || 'new';
  const forceSource = searchParams.get('source'); // 可选：强制指定数据源

  // 分页参数
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const offset = (page - 1) * pageSize;

  // Access KV and D1 bindings - Cloudflare Pages uses process.env
  const PRICING_CACHE_KV = (process.env as any).PRICING_CACHE || (process.env as any).PRICINGCACHE;
  const PRICING_DB = (process.env as any)['domain-pricing-db'] || (process.env as any).PRICING_DB;

  // Parameterized cache configuration from environment variables
  const CACHE_TTL_SECONDS = parseInt(context?.env?.CACHE_TTL || '3600'); // Default 1 hour
  const STALE_WHILE_REVALIDATE_SECONDS = parseInt(context?.env?.SWR_WINDOW || '300'); // Default 5 minutes

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
  const cacheKey = `pricing:${cleanDomain}:${order}`;
  const requestStartTime = Date.now();

  console.log(`🔍 Fetching pricing for ${cleanDomain} with order: ${order}${forceSource ? ` (forced source: ${forceSource})` : ''}`);

  // Request deduplication
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Deduplicating request for ${cleanDomain}. Waiting for existing fetch.`);
    try {
      const data = await pendingRequests.get(cacheKey);
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({
        error: 'Failed to fetch pricing data (deduplicated request failed)',
        domain: cleanDomain,
        order,
        source: 'error'
      }, { status: 500 });
    }
  }

  // Enhanced fetch and cache function with smart data source selection
  const fetchAndCache = async () => {
    try {
      let result;

      // 如果强制指定数据源
      if (forceSource === 'd1' && PRICING_DB) {
        console.log(`🎯 Force using D1 database for ${cleanDomain}`);
        const d1Result = await fetchD1Pricing(cleanDomain, order, PRICING_DB);
        if (d1Result.data && d1Result.data.length > 0) {
          result = {
            source: 'd1_forced',
            data: transformD1Data(d1Result.data, cleanDomain),
            metadata: d1Result.metadata
          };
        } else {
          throw new Error('D1 database has no data for this domain');
        }
      } else if (forceSource === 'nazhumi') {
        console.log(`🎯 Force using Nazhumi API for ${cleanDomain}`);
        const apiResult = await fetchNazhumiPricing(cleanDomain, order);
        if (apiResult.data && apiResult.data.length > 0) {
          result = {
            source: 'nazhumi_forced',
            data: transformNazhumiData(apiResult.data, cleanDomain),
            metadata: apiResult.metadata
          };
        } else {
          throw new Error('Nazhumi API has no data for this domain');
        }
      } else {
        // 使用智能数据源选择
        result = await selectDataSource(cleanDomain, order, PRICING_DB);
      }

      console.log(`✅ Got ${result.data.length} results from ${result.source} for domain ${cleanDomain}`);
      console.log(`📊 Data source details:`, {
        source: result.source,
        recordCount: result.data.length,
        domain: cleanDomain,
        requestedPageSize: pageSize,
        requestedPage: page
      });

      // Add features to each registrar
      const enrichedData = result.data.map(item => ({
        ...item,
        features: addRegistrarFeatures(item.registrarCode || ''),
        registrarUrl: item.registrarUrl || getRegistrarUrl(item.registrarCode || ''),
        isPopular: ['cosmotown', 'spaceship', 'cloudflare', 'namecheap', 'porkbun', 'dreamhost'].includes(item.registrarCode || ''),
        isPremium: ['huawei', 'baidu', 'volcengine', 'ovh'].includes(item.registrarCode || '')
      }));

      // Sort by the requested order
      enrichedData.sort((a, b) => {
        const aPrice = order === 'new' ? a.registrationPrice :
                      order === 'renew' ? a.renewalPrice : a.transferPrice;
        const bPrice = order === 'new' ? b.registrationPrice :
                      order === 'renew' ? b.renewalPrice : b.transferPrice;
        return (aPrice || Infinity) - (bPrice || Infinity);
      });

      // 分页处理
      const totalRecords = enrichedData.length;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const paginatedData = enrichedData.slice(offset, offset + pageSize);

      const responseData = {
        domain: cleanDomain,
        order,
        source: result.source,
        count: paginatedData.length,
        totalRecords,
        pricing: paginatedData,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        metadata: {
          ...result.metadata,
          requestTime: Date.now() - requestStartTime,
          timestamp: new Date().toISOString()
        }
      };

      // Cache the successful result with different TTL based on source
      if (PRICING_CACHE_KV) {
        const cacheTTL = result.source.includes('d1') ?
          CACHE_TTL_SECONDS * 2 : // D1数据缓存更久
          CACHE_TTL_SECONDS;

        await PRICING_CACHE_KV.put(
          cacheKey,
          JSON.stringify({ data: responseData, timestamp: Date.now() }),
          { expirationTtl: cacheTTL + STALE_WHILE_REVALIDATE_SECONDS }
        );
      }

      return responseData;

    } catch (error: any) {
      console.error(`❌ Error in fetchAndCache for ${cleanDomain}:`, error.message);
      throw error;
    }
  };

  try {
    // 1. Try to get cached data (only if KV is available)
    if (PRICING_CACHE_KV && !forceSource) { // 强制指定数据源时跳过缓存
      const cachedEntry = await PRICING_CACHE_KV.get(cacheKey, { type: 'json' });
      const now = Date.now();

      if (cachedEntry) {
        const cachedTimestamp = cachedEntry.timestamp || 0;
        const data = cachedEntry.data;

        // Check if cache is fresh
        if (now - cachedTimestamp < CACHE_TTL_SECONDS * 1000) {
          console.log(`⚡️ Cache hit (fresh) for ${cleanDomain}`);
          // 添加缓存信息到响应
          data.metadata = {
            ...data.metadata,
            cacheHit: true,
            cacheAge: Math.round((now - cachedTimestamp) / 1000),
            totalRequestTime: Date.now() - requestStartTime
          };
          return NextResponse.json(data);
        }

        // Cache is stale, but within SWR window
        if (now - cachedTimestamp < (CACHE_TTL_SECONDS + STALE_WHILE_REVALIDATE_SECONDS) * 1000) {
          console.log(`⚡️ Cache hit (stale, revalidating) for ${cleanDomain}`);
          // Trigger background revalidation
          if (context?.waitUntil) {
            context.waitUntil(
              (async () => {
                try {
                  const freshData = await fetchAndCache();
                  console.log(`✅ Background revalidation successful for ${cleanDomain}`);
                } catch (revalidationError) {
                  console.error(`❌ Background revalidation failed for ${cleanDomain}:`, revalidationError);
                } finally {
                  pendingRequests.delete(cacheKey);
                }
              })()
            );
          }
          // 添加缓存信息到响应
          data.metadata = {
            ...data.metadata,
            cacheHit: true,
            cacheAge: Math.round((now - cachedTimestamp) / 1000),
            staleWhileRevalidate: true,
            totalRequestTime: Date.now() - requestStartTime
          };
          return NextResponse.json(data);
        }
      }
    }

    // 2. No cache or cache fully expired, fetch fresh data
    console.log(`🔄 Fetching fresh data for ${cleanDomain}${forceSource ? ` (forced: ${forceSource})` : ''}`);

    const promise = fetchAndCache();
    pendingRequests.set(cacheKey, promise);
    const freshData = await promise;
    pendingRequests.delete(cacheKey);

    return NextResponse.json(freshData);

  } catch (error: any) {
    const totalRequestTime = Date.now() - requestStartTime;
    console.error(`❌ Pricing API error for ${cleanDomain} (${totalRequestTime}ms):`, error.message);

    // Enhanced error handling with fallback strategies
    let fallbackAttempted = false;

    // 1. Try to return expired cached data if available
    if (PRICING_CACHE_KV) {
      try {
        const expiredCachedData = await PRICING_CACHE_KV.get(cacheKey, { type: 'json' });
        if (expiredCachedData && expiredCachedData.data) {
          console.log(`⚠️ Using expired cache for ${cleanDomain} due to error`);
          fallbackAttempted = true;
          return NextResponse.json({
            ...expiredCachedData.data,
            metadata: {
              ...expiredCachedData.data.metadata,
              fallbackUsed: 'expired_cache',
              originalError: error.message,
              totalRequestTime
            },
            warning: 'Using cached data due to service unavailability'
          });
        }
      } catch (cacheError: any) {
        console.error(`Failed to retrieve expired cache for ${cleanDomain}:`, cacheError.message);
      }
    }

    // 2. If no cache available, try alternative data source
    if (!fallbackAttempted && !forceSource) {
      try {
        console.log(`🔄 Attempting fallback data source for ${cleanDomain}`);

        // 如果主要错误来自API，尝试D1
        if (error.message.includes('nazhumi') || error.message.includes('API')) {
          const d1Result = await fetchD1Pricing(cleanDomain, order, PRICING_DB);
          if (d1Result.data && d1Result.data.length > 0) {
            console.log(`✅ Using D1 fallback data for ${cleanDomain}`);
            const transformedData = transformD1Data(d1Result.data, cleanDomain);

            return NextResponse.json({
              domain: cleanDomain,
              order,
              source: 'd1_emergency_fallback',
              count: transformedData.length,
              pricing: transformedData,
              metadata: {
                ...d1Result.metadata,
                fallbackUsed: 'd1_emergency',
                originalError: error.message,
                totalRequestTime
              },
              warning: 'Using backup data due to primary service unavailability'
            });
          }
        }
      } catch (fallbackError: any) {
        console.error(`Fallback attempt failed for ${cleanDomain}:`, fallbackError.message);
      }
    }

    // 3. Return comprehensive error response
    return NextResponse.json({
      error: 'Price data temporarily unavailable',
      message: 'Unable to fetch current pricing data. Please try again later.',
      domain: cleanDomain,
      order,
      metadata: {
        error: error.message,
        totalRequestTime,
        fallbackAttempted,
        timestamp: new Date().toISOString()
      },
      suggestions: [
        'Try again in a few minutes',
        'Check if the domain extension is supported',
        `Try with a different source: /api/pricing?domain=${cleanDomain}&source=d1`
      ]
    }, { status: 503 });

  } finally {
    // Ensure pending request is cleared
    pendingRequests.delete(cacheKey);
  }
}
