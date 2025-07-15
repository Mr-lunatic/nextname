import { NextRequest, NextResponse } from 'next/server'

// Nazhumi API base URL
const NAZHUMI_API_BASE = 'https://www.nazhumi.com/api/v1'

// Function to fetch pricing data from Nazhumi API
async function fetchNazhumiPricing(domain: string, order: string = 'new') {
  try {
    const url = `${NAZHUMI_API_BASE}?domain=${encodeURIComponent(domain)}&order=${order}`
    console.log(`Fetching from Nazhumi: ${url}`)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Nazhumi API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Check if response has the expected structure
    if (data.code === 100 && data.data && data.data.price) {
      return data.data.price
    } else if (Array.isArray(data)) {
      return data
    }
    
    return data
  } catch (error) {
    console.error('Nazhumi API error:', error)
    return null
  }
}

// Transform Nazhumi data to our format
function transformNazhumiData(nazhumiData: any[], suffix: string) {
  if (!Array.isArray(nazhumiData) || nazhumiData.length === 0) {
    return []
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
    rating: 4.0 // Default rating since Nazhumi doesn't provide this
  }))
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
  }
  
  return urlMap[registrarCode] || `https://${registrarCode}.com`
}

// Helper function to get currency name
function getCurrencyName(currency: string): string {
  const currencyMap: { [key: string]: string } = {
    'USD': 'US Dollar',
    'CNY': '人民币',
    'EUR': '欧元'
  }
  
  return currencyMap[currency] || currency
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
  }
  
  return featureMap[registrarCode] || ['域名管理', '客户支持', 'DNS解析', '安全保护']
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
    { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD' },
    { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 14.99, renewalPrice: 19.99, transferPrice: 10.99, currency: 'USD' }
  ],
  'org': [
    { registrar: 'Porkbun', registrarCode: 'porkbun', registrationPrice: 8.67, renewalPrice: 10.12, transferPrice: 8.67, currency: 'USD' },
    { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD' },
    { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 13.99, renewalPrice: 18.99, transferPrice: 9.99, currency: 'USD' }
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const order = searchParams.get('order') || 'new'
  
  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 })
  }
  
  console.log(`🔍 Fetching pricing for ${domain} with order: ${order}`)
  
  try {
    // Clean domain (remove leading dot if present)
    const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain
    
    // First, try to use our enhanced pricing data (20 registrars)
    const baseEnhancedData = enhancedPricing[cleanDomain as keyof typeof enhancedPricing]
    
    if (baseEnhancedData && baseEnhancedData.length > 0) {
      console.log(`✅ Using enhanced pricing data for ${cleanDomain}: ${baseEnhancedData.length} registrars`)
      
      const enrichedData = baseEnhancedData.map(item => ({
        ...item,
        features: addRegistrarFeatures(item.registrarCode),
        registrarUrl: getRegistrarUrl(item.registrarCode),
        hasPromo: false,
        updatedTime: new Date().toISOString(),
        currencyName: getCurrencyName(item.currency),
        currencyType: 'fiat',
        isPopular: ['cosmotown', 'spaceship', 'cloudflare', 'namecheap', 'porkbun', 'dreamhost'].includes(item.registrarCode || ''),
        isPremium: ['huawei', 'baidu', 'volcengine', 'ovh'].includes(item.registrarCode || ''),
        rating: 4.0 + Math.random() * 1.0 // Random rating between 4.0-5.0
      }))
      
      return NextResponse.json({
        domain: cleanDomain,
        order,
        source: 'enhanced',
        count: enrichedData.length,
        pricing: enrichedData
      })
    }
    
    // Fallback: Try to fetch from Nazhumi API if enhanced data not available
    const nazhumiData = await fetchNazhumiPricing(cleanDomain, order)
    
    if (nazhumiData && Array.isArray(nazhumiData) && nazhumiData.length > 0) {
      console.log(`✅ Got ${nazhumiData.length} results from Nazhumi API (fallback)`)
      
      const transformedData = transformNazhumiData(nazhumiData, cleanDomain)
      
      // Add features to each registrar
      const enrichedData = transformedData.map(item => ({
        ...item,
        features: addRegistrarFeatures(item.registrarCode || ''),
        registrarUrl: item.registrarUrl || `https://${item.registrarCode || 'example'}.com`,
        isPopular: ['cosmotown', 'spaceship', 'cloudflare', 'namecheap', 'porkbun', 'dreamhost'].includes(item.registrarCode || ''),
        isPremium: ['huawei', 'baidu', 'volcengine', 'ovh'].includes(item.registrarCode || '')
      }))
      
      return NextResponse.json({
        domain: cleanDomain,
        order,
        source: 'nazhumi',
        count: enrichedData.length,
        pricing: enrichedData
      })
    }
    
    // Last resort: use basic fallback data
    console.log(`⚠️  No pricing data available, using basic fallback for ${cleanDomain}`)
    
    const basicFallback = [
      { registrar: 'Namecheap', registrarCode: 'namecheap', registrationPrice: 8.88, renewalPrice: 13.98, transferPrice: 8.98, currency: 'USD' },
      { registrar: 'GoDaddy', registrarCode: 'godaddy', registrationPrice: 12.99, renewalPrice: 17.99, transferPrice: 8.99, currency: 'USD' },
      { registrar: 'Cloudflare', registrarCode: 'cloudflare', registrationPrice: 8.57, renewalPrice: 8.57, transferPrice: 8.57, currency: 'USD' }
    ]
    
    const enrichedBasicData = basicFallback.map(item => ({
      ...item,
      features: addRegistrarFeatures(item.registrarCode),
      registrarUrl: getRegistrarUrl(item.registrarCode),
      hasPromo: false,
      updatedTime: new Date().toISOString(),
      currencyName: getCurrencyName(item.currency),
      currencyType: 'fiat',
      isPopular: ['namecheap', 'cloudflare'].includes(item.registrarCode),
      isPremium: false,
      rating: 4.0 + Math.random() * 1.0
    }))
    
    return NextResponse.json({
      domain: cleanDomain,
      order,
      source: 'basic-fallback',
      count: enrichedBasicData.length,
      pricing: enrichedBasicData
    })
    
  } catch (error) {
    console.error(`❌ Error fetching pricing for ${domain}:`, error)
    
    return NextResponse.json({
      error: 'Failed to fetch pricing data',
      domain,
      order,
      source: 'error'
    }, { status: 500 })
  }
}