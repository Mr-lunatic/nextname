// 传统WHOIS协议查询实现（Edge Runtime兼容）
// 由于Edge Runtime限制，我们使用HTTP代理方式而非直接TCP连接

export interface WhoisResult {
  domain: string
  is_available: boolean
  whois_text?: string
  registrar?: string
  created_date?: string
  expiry_date?: string
  updated_date?: string
  name_servers?: string[]
  status?: string[]
  fallback_method: string
  error?: string
}

// 使用稳定的免费WHOIS API服务
const WHOIS_API_SERVICES = [
  // IP2WHOIS API - 免费，较稳定
  {
    name: 'ip2whois',
    url: (domain: string) => `https://www.whoisxmlapi.com/whoisserver/WhoisService?domainName=${domain}&outputFormat=JSON`,
    headers: {},
    parser: 'whoisxml'
  },
  // WhoisFreaks API - 有免费额度
  {
    name: 'whoisfreaks',
    url: (domain: string) => `https://api.whoisfreaks.com/v1.0/whois?domainName=${domain}`,
    headers: {},
    parser: 'whoisfreaks'
  },
  // RDAP.info 服务 - 支持部分ccTLD
  {
    name: 'rdap_info',
    url: (domain: string) => `https://rdap.info/domain/${domain}`,
    headers: { 'Accept': 'application/rdap+json' },
    parser: 'rdap'
  },
  // WhoisJS API - 备用（经常不稳定）
  {
    name: 'whoisjs',
    url: (domain: string) => `https://api.whoisjs.com/${domain}`,
    headers: {},
    parser: 'whoisjs'
  }
]

// 解析不同API服务的响应
function parseWhoisResponse(data: any, parser: string, domain: string): WhoisResult {
  try {
    console.log(`🔍 Parsing ${parser} response for ${domain}:`, JSON.stringify(data, null, 2))
    
    switch (parser) {
      case 'whoisxml':
        // WhoisXML API解析器
        if (data.DomainInfo) {
          const domainInfo = data.DomainInfo
          console.log(`📋 WhoisXML result for ${domain}:`, { 
            domainAvailability: domainInfo.domainAvailability,
            registrarName: domainInfo.registrarName 
          })
          return {
            domain,
            is_available: domainInfo.domainAvailability === 'AVAILABLE',
            registrar: domainInfo.registrarName,
            created_date: domainInfo.createdDate,
            expiry_date: domainInfo.expiresDate,
            updated_date: domainInfo.updatedDate,
            name_servers: domainInfo.nameServers?.hostNames || [],
            status: domainInfo.status ? [domainInfo.status] : [],
            fallback_method: 'WhoisXML API (Free)'
          }
        }
        break
        
      case 'whoisjs':
        if (data.status === 'success' && data.result) {
          const result = data.result
          console.log(`📋 WhoisJS result for ${domain}:`, { registered: result.registered, registrar: result.registrar })
          return {
            domain,
            is_available: !result.registered,
            whois_text: result.raw,
            registrar: result.registrar,
            created_date: result.created_date,
            expiry_date: result.expiry_date,
            updated_date: result.updated_date,
            name_servers: result.name_servers,
            status: result.status ? [result.status] : [],
            fallback_method: 'WhoisJS API (Free)'
          }
        }
        // 特殊处理：如果API返回错误但有原始WHOIS数据，尝试解析
        if (data.result && data.result.raw) {
          const rawText = data.result.raw.toLowerCase()
          const isRegistered = rawText.includes('registrar:') || 
                              rawText.includes('registry domain id:') || 
                              rawText.includes('domain name:') ||
                              rawText.includes('注册商：') ||
                              rawText.includes('域名状态：')
          
          console.log(`📋 WhoisJS raw text analysis for ${domain}: registered=${isRegistered}`)
          
          return {
            domain,
            is_available: !isRegistered,
            whois_text: data.result.raw,
            registrar: 'Parsed from raw WHOIS',
            fallback_method: 'WhoisJS API (Raw text analysis)'
          }
        }
        break
        
      case 'generic':
        // 通用解析器，处理简单的JSON响应
        console.log(`📋 Generic parser data for ${domain}:`, { 
          available: data.available, 
          status: data.status,
          domain: data.domain,
          domain_name: data.domain_name,
          whois_raw: data.whois_raw ? 'present' : 'missing'
        })
        
        if (data.domain || data.domain_name) {
          return {
            domain,
            is_available: data.available === true || data.status === 'available',
            registrar: data.registrar || data.registrar_name,
            created_date: data.created_date || data.creation_date,
            expiry_date: data.expiry_date || data.expiration_date,
            updated_date: data.updated_date || data.last_updated,
            name_servers: data.name_servers || data.nameservers,
            status: data.status ? [data.status] : [],
            fallback_method: 'Generic WHOIS API (Free)'
          }
        }
        
        // 特殊处理：如果有原始WHOIS文本但没有结构化数据
        if (data.whois_raw || data.raw) {
          const rawText = (data.whois_raw || data.raw).toLowerCase()
          const isRegistered = rawText.includes('registrar:') || 
                              rawText.includes('registry domain id:') || 
                              rawText.includes('domain name:') ||
                              rawText.includes('注册商：') ||
                              rawText.includes('域名状态：') ||
                              rawText.includes('registrant:') ||
                              rawText.includes('creation date:') ||
                              !rawText.includes('no matching query')
          
          console.log(`📋 Generic raw text analysis for ${domain}: registered=${isRegistered}`)
          
          return {
            domain,
            is_available: !isRegistered,
            whois_text: data.whois_raw || data.raw,
            registrar: 'Parsed from raw WHOIS',
            fallback_method: 'Generic WHOIS API (Raw text analysis)'
          }
        }
        break
        
      case 'whoisfreaks':
        if (data.whois_raw || data.domain_name) {
          return {
            domain,
            is_available: data.domain_registered === false,
            whois_text: data.whois_raw,
            registrar: data.domain_registrar?.registrar_name,
            created_date: data.create_date,
            expiry_date: data.registry_expiry_date,
            updated_date: data.updated_date,
            name_servers: data.name_servers,
            status: data.domain_status,
            fallback_method: 'WhoisFreaks API (Free)'
          }
        }
        break
        
      case 'rdap':
        if (data.objectClassName === 'domain') {
          const events = data.events || []
          const entities = data.entities || []
          const registrarEntity = entities.find((e: any) => 
            e.roles && e.roles.includes('registrar')
          )
          
          return {
            domain,
            is_available: false,
            registrar: registrarEntity?.handle || 'Unknown',
            created_date: events.find((e: any) => e.eventAction === 'registration')?.eventDate,
            expiry_date: events.find((e: any) => e.eventAction === 'expiration')?.eventDate,
            updated_date: events.find((e: any) => e.eventAction === 'last changed')?.eventDate,
            name_servers: (data.nameservers || []).map((ns: any) => ns.ldhName),
            status: data.status || [],
            fallback_method: 'RDAP Proxy (Free)'
          }
        }
        break
    }
  } catch (error) {
    console.error(`Error parsing ${parser} response:`, error)
  }
  
  // 如果解析失败，返回保守结果
  return {
    domain,
    is_available: false, // 保守策略：假设已注册
    fallback_method: `${parser} (parse error)`,
    error: 'Failed to parse response'
  }
}

// 主要WHOIS查询函数
export async function queryWhois(domain: string): Promise<WhoisResult> {
  const tld = domain.split('.').pop()?.toLowerCase()
  
  console.log(`🔍 Querying WHOIS for ${domain} (TLD: ${tld})`)
  
  // 特殊处理.cn域名 - 直接进行HTTP验证，因为WHOIS API支持不佳
  if (tld === 'cn') {
    console.log(`🇨🇳 CN domain detected: ${domain} - using enhanced HTTP verification`)
    
    try {
      // 并行测试多个协议和常见子域
      const testUrls = [
        `https://${domain}`,
        `http://${domain}`,
        `https://www.${domain}`,
        `http://www.${domain}`
      ]
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      const promises = testUrls.map(async (url) => {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow'
          })
          return { url, status: response.status, success: true }
        } catch (error) {
          return { url, error: error instanceof Error ? error.message : 'Unknown error', success: false }
        }
      })
      
      const results = await Promise.allSettled(promises)
      clearTimeout(timeout)
      
      // 如果任何URL返回成功响应，域名已注册
      const hasSuccessfulResponse = results.some(result => 
        result.status === 'fulfilled' && result.value.success
      )
      
      if (hasSuccessfulResponse) {
        console.log(`✅ CN domain ${domain} verified as registered via HTTP`)
        return {
          domain,
          is_available: false,
          registrar: 'CN Registry (HTTP verified)',
          fallback_method: 'CN HTTP verification - multiple protocols',
          status: ['clientTransferProhibited (inferred)']
        }
      } else {
        console.log(`🤔 CN domain ${domain} - no HTTP response, checking with conservative heuristics`)
        
        // 对于.cn域名，使用更保守的启发式判断
        const [name] = domain.split('.')
        const isLikelyRegistered = 
          name.length <= 4 || // 短域名通常已注册
          /^(baidu|tencent|alibaba|qq|sina|sohu|163|126|taobao|tmall|jd|douban|weibo|zhihu|ctrip|dianping|meituan|pinduoduo|xiaomi|huawei|oppo|vivo|lenovo|haier|gree|midea|bank|icbc|ccb|abc|boc|cmb|citic|ping|an|china|beijing|shanghai|guangzhou|shenzhen|hangzhou|nanjing|chengdu|wuhan|xian|tianjin|qingdao|dalian|harbin|gov|edu|org|com|net|info|news|blog|shop|mall|store|app|tech|game|music|movie|book|food|travel|hotel|car|house|job|love|life|health|sport|art|photo|video|live|tv|radio)$/.test(name.toLowerCase())
        
        return {
          domain,
          is_available: !isLikelyRegistered,
          registrar: isLikelyRegistered ? 'CN Registry (heuristic)' : undefined,
          fallback_method: 'CN conservative heuristic analysis'
        }
      }
    } catch (error) {
      console.error(`❌ CN HTTP verification failed for ${domain}:`, error)
      // 对于.cn域名，出错时保守假设已注册
      return {
        domain,
        is_available: false,
        registrar: 'CN Registry (verification failed)',
        fallback_method: 'CN conservative fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // 其他域名使用WHOIS API
  for (const service of WHOIS_API_SERVICES) {
    try {
      console.log(`📡 Trying ${service.name} for ${domain}`)
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000) // 8秒超时
      
      const headers: HeadersInit = {
        'User-Agent': 'NextName-Domain-Search/1.0'
      }
      
      // Only add Accept header if it exists
      if (service.headers.Accept) {
        headers.Accept = service.headers.Accept
      }
      
      const response = await fetch(service.url(domain), {
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      
      if (!response.ok) {
        if (response.status === 404) {
          // 404通常表示域名未注册
          return {
            domain,
            is_available: true,
            fallback_method: `${service.name} (404 - available)`
          }
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const result = parseWhoisResponse(data, service.parser, domain)
      
      if (!result.error) {
        console.log(`✅ WHOIS success via ${service.name} for ${domain}`)
        return result
      }
      
    } catch (error) {
      console.warn(`❌ ${service.name} failed for ${domain}:`, error instanceof Error ? error.message : error)
      continue
    }
  }
  
  // 所有服务都失败，返回保守结果
  console.log(`⚠️ All WHOIS services failed for ${domain}`)
  return {
    domain,
    is_available: false, // 保守策略
    fallback_method: 'All WHOIS services failed',
    error: 'Unable to query WHOIS data'
  }
}