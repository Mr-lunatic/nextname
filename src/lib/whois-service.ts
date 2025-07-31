/**
 * 统一的WHOIS查询服务
 * 
 * 查询优先级：
 * 1. RDAP协议（标准化、可靠）
 * 2. WHO.CX API（备用方案）
 * 3. 失败时正常报错，不使用虚假数据
 */

export const runtime = 'edge'

// WHOIS查询结果接口
export interface WhoisResult {
  domain: string
  is_available: boolean
  registrar?: string
  registrar_iana_id?: string
  registrar_whois_server?: string
  registrar_url?: string
  created_date?: string
  updated_date?: string
  expiry_date?: string
  status?: string[]
  name_servers?: string[]
  dnssec?: string
  registrar_abuse_contact_email?: string
  registrar_abuse_contact_phone?: string
  registry_domain_id?: string
  last_update_of_whois_database?: string
  whois_raw?: string
  query_method: 'rdap' | 'whocx'
  query_time_ms: number
  error?: string
}

// WHOIS查询错误类型
export class WhoisError extends Error {
  constructor(
    message: string,
    public code: 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_DOMAIN' | 'NO_DATA' | 'PARSE_ERROR' | 'SERVICE_UNAVAILABLE',
    public domain: string,
    public details?: any
  ) {
    super(message)
    this.name = 'WhoisError'
  }
}

// RDAP服务器缓存
const rdapServerCache = new Map<string, { servers: string[], timestamp: number }>()
const RDAP_CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

// IANA RDAP Bootstrap服务
const IANA_RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json'

// 知名RDAP服务器（备用）
const FALLBACK_RDAP_SERVERS: Record<string, string[]> = {
  'com': ['https://rdap.verisign.com/com/v1/'],
  'net': ['https://rdap.verisign.com/net/v1/'],
  'org': ['https://rdap.publicinterestregistry.org/rdap/'],
  'info': ['https://rdap.identitydigital.services/rdap/'],
  'biz': ['https://rdap.nic.biz/'],
  'name': ['https://tld-rdap.verisign.com/name/v1/'],
  'io': ['https://rdap.nic.io/'],
  'ai': ['https://rdap.nic.ai/'],
  'dev': ['https://rdap.nic.google/'],
  'app': ['https://rdap.nic.google/'],
  'xyz': ['https://rdap.nic.xyz/'],
  'top': ['https://rdap.nic.top/'],
  'club': ['https://rdap.nic.club/'],
  'online': ['https://rdap.centralnic.com/online/'],
  'site': ['https://rdap.centralnic.com/site/'],
  'tech': ['https://rdap.nic.tech/'],
  'store': ['https://rdap.nic.store/'],
  'uk': ['https://rdap.nominet.uk/uk/'],
  'de': ['https://rdap.denic.de/'],
  'fr': ['https://rdap.nic.fr/'],
  'nl': ['https://rdap.sidn.nl/'],
  'it': ['https://rdap.nic.it/'],
  'es': ['https://rdap.nic.es/'],
  'ca': ['https://rdap.ca/'],
  'au': ['https://rdap.auda.org.au/'],
  'jp': ['https://rdap.jprs.jp/'],
  'br': ['https://rdap.registro.br/'],
  'mx': ['https://rdap.mx/'],
  'co': ['https://rdap.nic.co/'],
  'me': ['https://rdap.nic.me/'],
  'tv': ['https://rdap.nic.tv/'],
  'cc': ['https://rdap.nic.cc/'],
  'ly': ['https://rdap.nic.ly/'],
  'sh': ['https://rdap.nic.sh/'],
  'gg': ['https://rdap.gg/']
}

/**
 * 获取域名的TLD
 */
function getTLD(domain: string): string {
  return domain.split('.').pop()?.toLowerCase() || ''
}

/**
 * 验证域名格式
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return domainRegex.test(domain) && domain.length <= 253
}

/**
 * 从IANA获取RDAP服务器
 */
async function fetchRdapServers(tld: string): Promise<string[]> {
  // 检查缓存
  const cached = rdapServerCache.get(tld)
  if (cached && Date.now() - cached.timestamp < RDAP_CACHE_DURATION) {
    return cached.servers
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(IANA_RDAP_BOOTSTRAP_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextName-WHOIS-Service/1.0'
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`IANA RDAP bootstrap failed: ${response.status}`)
    }

    const data = await response.json()
    const services = data.services || []
    
    // 查找匹配的TLD
    for (const service of services) {
      const [tlds, servers] = service
      if (tlds.includes(tld)) {
        const serverList = servers.map((server: string) => 
          server.endsWith('/') ? server : `${server}/`
        )
        
        // 缓存结果
        rdapServerCache.set(tld, {
          servers: serverList,
          timestamp: Date.now()
        })
        
        return serverList
      }
    }

    // 如果没找到，使用备用服务器
    const fallbackServers = FALLBACK_RDAP_SERVERS[tld] || []
    if (fallbackServers.length > 0) {
      rdapServerCache.set(tld, {
        servers: fallbackServers,
        timestamp: Date.now()
      })
    }
    
    return fallbackServers
  } catch (error) {
    console.warn(`Failed to fetch RDAP servers for ${tld}:`, error)
    
    // 返回备用服务器
    const fallbackServers = FALLBACK_RDAP_SERVERS[tld] || []
    if (fallbackServers.length > 0) {
      rdapServerCache.set(tld, {
        servers: fallbackServers,
        timestamp: Date.now()
      })
    }
    
    return fallbackServers
  }
}

/**
 * 解析RDAP响应
 */
function parseRdapResponse(data: any, domain: string): Partial<WhoisResult> {
  try {
    if (!data.objectClassName || data.objectClassName !== 'domain') {
      throw new Error('Invalid RDAP response: not a domain object')
    }

    const events = data.events || []
    const entities = data.entities || []
    const status = data.status || []
    const nameservers = data.nameservers || []

    // 查找注册商信息
    const registrarEntity = entities.find((entity: any) => 
      entity.roles && entity.roles.includes('registrar')
    )

    // 解析事件日期
    const createdEvent = events.find((e: any) => e.eventAction === 'registration')
    const updatedEvent = events.find((e: any) => e.eventAction === 'last changed')
    const expiryEvent = events.find((e: any) => e.eventAction === 'expiration')

    return {
      domain,
      is_available: false, // RDAP返回数据说明域名已注册
      registrar: registrarEntity?.handle || registrarEntity?.fn || 'Unknown',
      created_date: createdEvent?.eventDate,
      updated_date: updatedEvent?.eventDate,
      expiry_date: expiryEvent?.eventDate,
      status: status,
      name_servers: nameservers.map((ns: any) => ns.ldhName || ns.unicodeName).filter(Boolean),
      registry_domain_id: data.handle,
      last_update_of_whois_database: new Date().toISOString(),
      query_method: 'rdap' as const
    }
  } catch (error) {
    throw new WhoisError(
      `Failed to parse RDAP response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      domain,
      { rdapData: data }
    )
  }
}

/**
 * RDAP协议查询
 */
async function queryRDAP(domain: string): Promise<Partial<WhoisResult>> {
  const tld = getTLD(domain)
  const servers = await fetchRdapServers(tld)

  if (servers.length === 0) {
    throw new WhoisError(
      `No RDAP servers found for TLD: ${tld}`,
      'NO_DATA',
      domain
    )
  }

  console.log(`🔍 Querying RDAP for ${domain} using ${servers.length} servers`)

  // 并行查询前3个服务器，取第一个成功的结果
  const promises = servers.slice(0, 3).map(async (server, index) => {
    const rdapUrl = `${server}domain/${domain}`
    
    try {
      // 为后续服务器添加小延迟，优先使用第一个服务器
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 100))
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)

      console.log(`📡 Querying RDAP server: ${rdapUrl}`)

      const response = await fetch(rdapUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/rdap+json',
          'User-Agent': 'NextName-WHOIS-Service/1.0'
        }
      })

      clearTimeout(timeout)

      if (response.status === 404) {
        // 404通常表示域名未注册
        return {
          domain,
          is_available: true,
          query_method: 'rdap' as const,
          last_update_of_whois_database: new Date().toISOString()
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ RDAP success from ${server}`)

      // 检查RDAP响应是否表示域名不存在
      if (data.errorCode === 404 ||
          (data.notices && data.notices.some((notice: any) =>
            notice.title && notice.title.toLowerCase().includes('not found')
          ))) {
        return {
          domain,
          is_available: true,
          query_method: 'rdap' as const,
          last_update_of_whois_database: new Date().toISOString()
        }
      }

      return parseRdapResponse(data, domain)
    } catch (error) {
      console.warn(`❌ RDAP server ${server} failed:`, error instanceof Error ? error.message : error)
      throw error
    }
  })

  // 使用Promise竞争模式获取第一个成功的结果
  return new Promise(async (resolve, reject) => {
    let completedCount = 0
    let lastError: any = null
    const errors: any[] = []

    for (const promise of promises) {
      promise
        .then((result) => {
          // 第一个成功的结果立即返回
          resolve(result)
        })
        .catch((error) => {
          errors.push(error)
          lastError = error
          completedCount++

          // 如果所有Promise都失败了，抛出错误
          if (completedCount === promises.length) {
            reject(new WhoisError(
              `All RDAP servers failed for ${domain}`,
              'SERVICE_UNAVAILABLE',
              domain,
              { servers, errors, lastError }
            ))
          }
        })
    }
  })
}

/**
 * 获取域名的原始WHOIS数据
 * 使用多个数据源以提高可靠性
 */
async function fetchRawWhoisData(domain: string): Promise<string> {
  try {
    // 使用公共WHOIS API获取原始数据
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(`https://api.whoisjs.com/${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NextName-WHOIS-Service/1.0'
      }
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`WHOIS API failed: ${response.status}`)
    }

    const data = await response.json()

    // 提取原始WHOIS文本
    if (data.result && data.result.raw) {
      return data.result.raw
    }

    throw new Error('No raw WHOIS data found')
  } catch (error) {
    console.warn(`Failed to fetch raw WHOIS data for ${domain}:`, error)
    throw new WhoisError(
      `Failed to fetch raw WHOIS data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SERVICE_UNAVAILABLE',
      domain
    )
  }
}



/**
 * WHO.CX API查询（备用方案）
 */
async function queryWhoCxAPI(domain: string): Promise<Partial<WhoisResult>> {
  console.log(`🔍 Querying WHO.CX API for ${domain}`)

  try {
    // 首先获取原始WHOIS数据
    const rawWhoisData = await fetchRawWhoisData(domain)

    // 调用WHO.CX API进行信息提取
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const formData = new URLSearchParams()
    formData.append('domain', domain)
    formData.append('whois', rawWhoisData)
    formData.append('lang', 'en')
    formData.append('time_zone', '8')

    const response = await fetch('https://who.cx/api/whois_extract', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'NextName-WHOIS-Service/1.0'
      },
      body: formData
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`WHO.CX API failed: ${response.status}`)
    }

    const extractedData = await response.text()
    console.log(`✅ WHO.CX API success for ${domain}`)

    // 解析WHO.CX返回的结构化数据
    return parseWhoCxResponse(extractedData, domain, rawWhoisData)
  } catch (error) {
    console.warn(`❌ WHO.CX API failed for ${domain}:`, error instanceof Error ? error.message : error)
    throw new WhoisError(
      `WHO.CX API query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SERVICE_UNAVAILABLE',
      domain
    )
  }
}

/**
 * 解析WHO.CX API响应
 */
function parseWhoCxResponse(extractedData: string, domain: string, rawWhois: string): Partial<WhoisResult> {
  try {
    // WHO.CX返回的是处理后的文本，我们需要解析它
    const lines = extractedData.split('\n').map(line => line.trim()).filter(Boolean)

    const result: Partial<WhoisResult> = {
      domain,
      is_available: false, // 如果能获取到WHOIS数据，通常说明域名已注册
      query_method: 'whocx' as const,
      whois_raw: rawWhois,
      last_update_of_whois_database: new Date().toISOString()
    }

    // 解析结构化信息
    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      if (lowerLine.includes('registrar:') || lowerLine.includes('注册商:')) {
        result.registrar = line.split(':')[1]?.trim()
      } else if (lowerLine.includes('creation date:') || lowerLine.includes('created:') || lowerLine.includes('注册时间:')) {
        result.created_date = line.split(':')[1]?.trim()
      } else if (lowerLine.includes('expiry date:') || lowerLine.includes('expires:') || lowerLine.includes('到期时间:')) {
        result.expiry_date = line.split(':')[1]?.trim()
      } else if (lowerLine.includes('updated date:') || lowerLine.includes('updated:') || lowerLine.includes('更新时间:')) {
        result.updated_date = line.split(':')[1]?.trim()
      } else if (lowerLine.includes('name server:') || lowerLine.includes('dns:')) {
        if (!result.name_servers) result.name_servers = []
        const ns = line.split(':')[1]?.trim()
        if (ns && !result.name_servers.includes(ns)) {
          result.name_servers.push(ns)
        }
      } else if (lowerLine.includes('status:') || lowerLine.includes('状态:')) {
        if (!result.status) result.status = []
        const status = line.split(':')[1]?.trim()
        if (status && !result.status.includes(status)) {
          result.status.push(status)
        }
      }
    }

    // 检查是否为可用域名
    const rawLower = rawWhois.toLowerCase()
    if (rawLower.includes('no matching query') ||
        rawLower.includes('not found') ||
        rawLower.includes('no data found') ||
        rawLower.includes('domain not found')) {
      result.is_available = true
      result.registrar = undefined
      result.created_date = undefined
      result.expiry_date = undefined
      result.updated_date = undefined
      result.status = []
      result.name_servers = []
    }

    return result
  } catch (error) {
    throw new WhoisError(
      `Failed to parse WHO.CX response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      domain,
      { extractedData, rawWhois }
    )
  }
}

/**
 * 主要的WHOIS查询函数
 * 统一入口，按优先级查询
 */
export async function queryWhois(domain: string): Promise<WhoisResult> {
  const startTime = Date.now()

  // 验证域名格式
  if (!isValidDomain(domain)) {
    throw new WhoisError(
      `Invalid domain format: ${domain}`,
      'INVALID_DOMAIN',
      domain
    )
  }

  const normalizedDomain = domain.toLowerCase().trim()
  console.log(`🔍 Starting WHOIS query for ${normalizedDomain}`)

  try {
    // 第一优先级：RDAP协议
    console.log(`📡 Trying RDAP protocol for ${normalizedDomain}`)
    const rdapResult = await queryRDAP(normalizedDomain)

    const queryTime = Date.now() - startTime
    console.log(`✅ RDAP query successful for ${normalizedDomain} (${queryTime}ms)`)

    return {
      ...rdapResult,
      domain: normalizedDomain,
      query_time_ms: queryTime
    } as WhoisResult
  } catch (rdapError) {
    console.warn(`❌ RDAP failed for ${normalizedDomain}:`, rdapError instanceof Error ? rdapError.message : rdapError)

    try {
      // 第二优先级：WHO.CX API
      console.log(`📡 Trying WHO.CX API for ${normalizedDomain}`)
      const whocxResult = await queryWhoCxAPI(normalizedDomain)

      const queryTime = Date.now() - startTime
      console.log(`✅ WHO.CX API query successful for ${normalizedDomain} (${queryTime}ms)`)

      return {
        ...whocxResult,
        domain: normalizedDomain,
        query_time_ms: queryTime
      } as WhoisResult
    } catch (whocxError) {
      console.error(`❌ WHO.CX API also failed for ${normalizedDomain}:`, whocxError instanceof Error ? whocxError.message : whocxError)

      // 所有方法都失败，抛出详细错误
      const queryTime = Date.now() - startTime
      throw new WhoisError(
        `All WHOIS query methods failed for ${normalizedDomain}. Please try again later.`,
        'SERVICE_UNAVAILABLE',
        normalizedDomain,
        {
          rdapError: rdapError instanceof Error ? rdapError.message : rdapError,
          whocxError: whocxError instanceof Error ? whocxError.message : whocxError,
          queryTime
        }
      )
    }
  }
}

/**
 * 批量WHOIS查询（可选功能）
 */
export async function queryMultipleWhois(domains: string[]): Promise<(WhoisResult | WhoisError)[]> {
  const promises = domains.map(async (domain) => {
    try {
      return await queryWhois(domain)
    } catch (error) {
      return error as WhoisError
    }
  })

  return Promise.all(promises)
}
