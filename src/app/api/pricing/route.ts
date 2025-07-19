import { NextRequest, NextResponse } from 'next/server';

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge';

// Declare KV Namespace and D1 Database bindings for TypeScript
// These are type declarations; the actual bindings are done in wrangler.toml
declare const PRICING_CACHE: any;
declare const PRICING_DB: any;

// Map to store pending requests for deduplication
const pendingRequests = new Map<string, Promise<any>>();

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

// Function to fetch pricing data from Nazhumi API
async function fetchNazhumiPricing(domain: string, order: string = 'new'): Promise<any[] | null> {
  const NAZHUMI_API_BASE = 'https://www.nazhumi.com/api/v1'; // Moved here for clarity within this function

  const url = `${NAZHUMI_API_BASE}?domain=${encodeURIComponent(domain)}&order=${order}`;
  console.log(`Fetching from Nazhumi: ${url}`);

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      }
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError: any) {
      console.error(`Failed to parse JSON from Nazhumi API for ${domain}:`, jsonError.message);
      throw new Error('Invalid JSON response from Nazhumi API.');
    }

    // Nazhumi API returns { code: 100, data: { domain, order, count, price: [...] } }
    if (data.code === 100 && data.data && data.data.price && validatePricingData(data.data.price)) {
      return data.data.price;
    } else if (validatePricingData(data)) {
      return data;
    } else {
      console.warn(`Nazhumi API returned unexpected data format for ${domain}:`, data);
      return null; // Or throw a specific error for invalid data format
    }
  } catch (error: any) {
    console.error(`Nazhumi API error for ${domain}:`, error.message);
    // Differentiate between network/timeout errors and API specific errors if possible
    if (error.name === 'AbortError') {
      throw new Error('Nazhumi API request timed out.');
    }
    throw new Error(`Failed to fetch from Nazhumi API: ${error.message}`);
  }
}

// Helper function to get registrar URL if not available
function getRegistrarUrl(registrarCode: string): string {
  const registrarUrls: { [key: string]: string } = {
    'cloudflare': 'https://www.cloudflare.com/',
    'namecheap': 'https://www.namecheap.com/',
    'porkbun': 'https://porkbun.com/',
    'godaddy': 'https://www.godaddy.com/',
    'dreamhost': 'https://www.dreamhost.com/',
    'dynadot': 'https://www.dynadot.com/',
    'gandi': 'https://www.gandi.net/',
    'hover': 'https://www.hover.com/',
    'namesilo': 'https://www.namesilo.com/',
    'enom': 'https://www.enom.com/',
    // Add more as needed
  };

  return registrarUrls[registrarCode] || `https://www.${registrarCode}.com/`;
}

// Function to fetch pricing data from D1 database (Ubuntu sync data)
async function fetchD1Pricing(domain: string, order: string, PRICING_DB: any): Promise<any[] | null> {
  if (!PRICING_DB) {
    console.log('D1 database not available');
    return null;
  }

  try {
    console.log(`🗄️ Querying D1 database for ${domain}`);

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

    if (result.results && result.results.length > 0) {
      console.log(`✅ Found ${result.results.length} records in D1 for ${domain}`);
      return result.results;
    } else {
      console.log(`📭 No D1 data found for ${domain}`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ D1 query error for ${domain}:`, error.message);
    return null;
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
    registrarUrl: item.registrar_url || getRegistrarUrl(item.registrar || ''),
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

// Main GET function for the API route
export async function GET(request: NextRequest, context: any) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const order = searchParams.get('order') || 'new';

  // Access KV and D1 bindings from context.env (may be undefined in development)
  const PRICING_CACHE_KV = context?.env?.PRICING_CACHE as any;
  const PRICING_DB = context?.env?.PRICING_DB as any;

  // Parameterized cache configuration from environment variables
  const CACHE_TTL_SECONDS = parseInt(context?.env?.CACHE_TTL || '3600'); // Default 1 hour
  const STALE_WHILE_REVALIDATE_SECONDS = parseInt(context?.env?.SWR_WINDOW || '300'); // Default 5 minutes

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
  const cacheKey = `pricing:${cleanDomain}:${order}`;

  console.log(`🔍 Fetching pricing for ${cleanDomain} with order: ${order}`);

  // Request deduplication
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Deduplicating request for ${cleanDomain}. Waiting for existing fetch.`);
    try {
      const data = await pendingRequests.get(cacheKey);
      return NextResponse.json(data);
    } catch (error) {
      // If the original request failed, re-throw or handle
      return NextResponse.json({ error: 'Failed to fetch pricing data (deduplicated request failed)', domain, order, source: 'error' }, { status: 500 });
    }
  }

  const fetchAndCache = async () => {
    try {
      // Only try to fetch from Nazhumi API - no fallbacks
      console.log(`🔍 Fetching real-time pricing from Nazhumi API for ${cleanDomain}`);
      const nazhumiData = await fetchNazhumiPricing(cleanDomain, order);

      if (nazhumiData && Array.isArray(nazhumiData) && nazhumiData.length > 0) {
        console.log(`✅ Got ${nazhumiData.length} results from Nazhumi API`);

        const transformedData = transformNazhumiData(nazhumiData, cleanDomain);

        // Add features to each registrar
        const enrichedData = transformedData.map(item => ({
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

        const responseData = {
          domain: cleanDomain,
          order,
          source: 'nazhumi',
          count: enrichedData.length,
          pricing: enrichedData
        };

        // Cache the successful result
        if (PRICING_CACHE_KV) {
          await PRICING_CACHE_KV.put(
            cacheKey,
            JSON.stringify({ data: responseData, timestamp: Date.now() }),
            { expirationTtl: CACHE_TTL_SECONDS + STALE_WHILE_REVALIDATE_SECONDS }
          );
        }

        return responseData;
      }

      // If Nazhumi API fails or returns no data, throw error
      throw new Error('Nazhumi API returned no data or invalid data format');

    } catch (error: any) {
      console.error(`❌ Error fetching from Nazhumi API for ${cleanDomain}:`, error.message);
      throw error; // Re-throw to be caught by the main try-catch
    }
  };

  try {
    // 1. Try to get cached data (only if KV is available)
    if (PRICING_CACHE_KV) {
      const cachedEntry = await PRICING_CACHE_KV.get(cacheKey, { type: 'json' });
      const now = Date.now();

      if (cachedEntry) {
        const cachedTimestamp = cachedEntry.timestamp || 0;
        const data = cachedEntry.data;

        // Check if cache is fresh
        if (now - cachedTimestamp < CACHE_TTL_SECONDS * 1000) {
          console.log(`⚡️ Cache hit (fresh) for ${cleanDomain}`);
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
                  const freshData = await fetchAndCache(); // This will also update the cache
                  console.log(`✅ Background revalidation successful for ${cleanDomain}`);
                } catch (revalidationError) {
                  console.error(`Background revalidation failed for ${cleanDomain}:`, revalidationError);
                } finally {
                  pendingRequests.delete(cacheKey); // Clear pending request after revalidation
                }
              })()
            );
          }
          return NextResponse.json(data); // Return stale data immediately
        }
      }
    }

    // No cache or cache fully expired, try D1 database first
    console.log(`🔄 No cache or cache fully expired for ${cleanDomain}. Checking D1 database.`);

    // 2. Try to get data from D1 database (Ubuntu sync data)
    const d1Data = await fetchD1Pricing(cleanDomain, order, PRICING_DB);
    if (d1Data && d1Data.length > 0) {
      console.log(`✅ Using D1 data for ${cleanDomain}`);
      const transformedD1Data = transformD1Data(d1Data, cleanDomain);

      const responseData = {
        domain: cleanDomain,
        order,
        source: 'ubuntu_sync',
        count: transformedD1Data.length,
        pricing: transformedD1Data,
        lastUpdated: d1Data[0]?.crawled_at || new Date().toISOString(),
        note: 'Data from Ubuntu crawler (updated daily)'
      };

      // Cache the D1 data in KV for faster future access
      if (PRICING_CACHE_KV) {
        await PRICING_CACHE_KV.put(
          cacheKey,
          JSON.stringify({ data: responseData, timestamp: Date.now() }),
          { expirationTtl: CACHE_TTL_SECONDS + STALE_WHILE_REVALIDATE_SECONDS }
        );
      }

      return NextResponse.json(responseData);
    }

    // 3. No D1 data available, fetch from Nazhumi API
    console.log(`🔄 No D1 data for ${cleanDomain}. Fetching from Nazhumi API.`);
    const promise = fetchAndCache();
    pendingRequests.set(cacheKey, promise); // Store the promise for deduplication
    const freshData = await promise;
    pendingRequests.delete(cacheKey); // Clear pending request after successful fetch
    return NextResponse.json(freshData);

  } catch (error: any) {
    console.error(`❌ Pricing API error for ${cleanDomain}:`, error.message);

    // Try to return expired cached data if available
    if (PRICING_CACHE_KV) {
      try {
        const expiredCachedData = await PRICING_CACHE_KV.get(cacheKey, { type: 'json' });
        if (expiredCachedData && expiredCachedData.data) {
          console.log(`⚠️ Using expired cache for ${cleanDomain} due to API error`);
          return NextResponse.json({
            ...expiredCachedData.data,
            warning: 'Using cached data due to API unavailability'
          });
        }
      } catch (cacheError: any) {
        console.error(`Failed to retrieve expired cache for ${cleanDomain}:`, cacheError.message);
      }
    }

    // Return error response instead of fallback data
    return NextResponse.json({
      error: 'Price data temporarily unavailable',
      message: 'Unable to fetch current pricing data from nazhumi.com. Please try again later.',
      domain: cleanDomain,
      order
    }, { status: 503 }); // Service Unavailable
  } finally {
    // Ensure pending request is cleared even if an unexpected error occurs
    pendingRequests.delete(cacheKey);
  }
}
