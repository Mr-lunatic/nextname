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

// 使用第三方WHOIS API服务作为代理
const WHOIS_API_SERVICES = [
  // WhoisXML API (需要API key，但提供免费额度)
  {
    name: 'whoisjson',
    url: (domain: string) => `https://whoisjson.com/api/v1/whois?domain=${domain}`,
    headers: {},
    parser: 'whoisjson'
  },
  // Whois.com API
  {
    name: 'whois_com',
    url: (domain: string) => `https://api.whois.com/whois/${domain}`,
    headers: {},
    parser: 'whois_com'
  },
  // 备用RDAP代理服务
  {
    name: 'rdap_proxy',
    url: (domain: string) => `https://rdap.db.ripe.net/domain/${domain}`,
    headers: { 'Accept': 'application/rdap+json' },
    parser: 'rdap'
  }
]

// 解析不同API服务的响应
function parseWhoisResponse(data: any, parser: string, domain: string): WhoisResult {
  try {
    switch (parser) {
      case 'whoisjson':
        if (data.status === 'success' && data.result) {
          const result = data.result
          return {
            domain,
            is_available: !result.registered,
            whois_text: result.whois_raw,
            registrar: result.registrar?.name,
            created_date: result.dates?.created,
            expiry_date: result.dates?.expiry,
            updated_date: result.dates?.updated,
            name_servers: result.nameservers,
            status: result.status ? [result.status] : [],
            fallback_method: 'WhoisJSON API'
          }
        }
        break
        
      case 'whois_com':
        if (data.domain_name) {
          return {
            domain,
            is_available: false,
            registrar: data.registrar,
            created_date: data.creation_date,
            expiry_date: data.registry_expiry_date,
            updated_date: data.updated_date,
            name_servers: data.name_servers,
            status: data.status,
            fallback_method: 'Whois.com API'
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
            fallback_method: 'RDAP Proxy'
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
  
  // 尝试多个WHOIS API服务
  for (const service of WHOIS_API_SERVICES) {
    try {
      console.log(`📡 Trying ${service.name} for ${domain}`)
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000) // 8秒超时
      
      const response = await fetch(service.url(domain), {
        headers: {
          'User-Agent': 'NextName-Domain-Search/1.0',
          ...service.headers
        },
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