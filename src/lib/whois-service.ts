/**
 * 统一的WHOIS查询服务
 * 
 * 查询优先级：
 * 1. RDAP协议（标准化、可靠）
 * 2. Who-Dat API (https://whois-domain-teal.vercel.app)
 * 3. WHO.CX API（备用方案）
 */

export const runtime = 'edge'

// WHOIS查询结果接口 - 扩展支持联系人信息
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
  transfer_date?: string
  status?: string[]
  name_servers?: string[]
  dnssec?: string
  registrar_abuse_contact_email?: string
  registrar_abuse_contact_phone?: string
  registry_domain_id?: string
  last_update_of_whois_database?: string
  whois_raw?: string
  query_method: 'rdap' | 'whodat' | 'whocx'
  query_time_ms: number
  error?: string
  
  // 新增：联系人信息
  registrant_contact?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
    country?: string
    state?: string
    city?: string
    address?: string
  }
  admin_contact?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
    country?: string
    address?: string
  }
  tech_contact?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
    country?: string
    address?: string
  }
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
  'cn': [], // .cn域名RDAP支持有限，主要依赖Who-Dat和WHO.CX
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
 * 解析RDAP响应 - 增强版本支持联系人信息
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

    // 查找联系人信息
    const registrantEntity = entities.find((entity: any) => 
      entity.roles && entity.roles.includes('registrant')
    )
    const adminEntity = entities.find((entity: any) => 
      entity.roles && entity.roles.includes('administrative')
    )
    const techEntity = entities.find((entity: any) => 
      entity.roles && entity.roles.includes('technical')
    )

    // 解析事件日期
    const createdEvent = events.find((e: any) => e.eventAction === 'registration')
    const updatedEvent = events.find((e: any) => e.eventAction === 'last changed')
    const expiryEvent = events.find((e: any) => e.eventAction === 'expiration')
    const transferEvent = events.find((e: any) => e.eventAction === 'transfer')

    // 解析联系人信息的辅助函数
    const parseContactInfo = (entity: any) => {
      if (!entity) return undefined

      const vcardArray = entity.vcardArray
      let contactInfo: any = {}

      if (vcardArray && Array.isArray(vcardArray) && vcardArray[1]) {
        const properties = vcardArray[1]
        
        for (const prop of properties) {
          if (!Array.isArray(prop) || prop.length < 4) continue
          
          const [propName, params, type, value] = prop
          
          switch (propName.toLowerCase()) {
            case 'fn':
              contactInfo.name = value
              break
            case 'org':
              contactInfo.organization = Array.isArray(value) ? value[0] : value
              break
            case 'email':
              contactInfo.email = value
              break
            case 'tel':
              contactInfo.phone = value
              break
            case 'adr':
              if (Array.isArray(value) && value.length >= 7) {
                // ADR格式: [邮政信箱, 扩展地址, 街道, 城市, 州/省, 邮编, 国家]
                const [, , street, city, state, postal, country] = value
                contactInfo.address = [street, city, state].filter(Boolean).join(', ')
                contactInfo.city = city
                contactInfo.state = state
                contactInfo.country = country
              }
              break
          }
        }
      }

      // 如果vCard解析失败，尝试直接从实体中提取
      if (!contactInfo.name && entity.handle) {
        contactInfo.name = entity.handle
      }

      return Object.keys(contactInfo).length > 0 ? contactInfo : undefined
    }

    // 解析注册商名称
    let registrarName = 'Unknown'
    if (registrarEntity) {
      // 首先尝试从vCard中获取fn (full name)
      if (registrarEntity.vcardArray && Array.isArray(registrarEntity.vcardArray) && registrarEntity.vcardArray[1]) {
        const vcardProperties = registrarEntity.vcardArray[1]
        const fnProperty = vcardProperties.find((prop: any) => Array.isArray(prop) && prop[0] === 'fn')
        if (fnProperty && fnProperty[3]) {
          registrarName = fnProperty[3]
        }
      }
      
      // 如果vCard中没有找到，使用handle作为后备
      if (registrarName === 'Unknown' && registrarEntity.handle) {
        registrarName = registrarEntity.handle
      }
    }

    const result: Partial<WhoisResult> = {
      domain,
      is_available: false, // RDAP返回数据说明域名已注册
      registrar: registrarName,
      created_date: createdEvent?.eventDate,
      updated_date: updatedEvent?.eventDate,
      expiry_date: expiryEvent?.eventDate,
      transfer_date: transferEvent?.eventDate,
      status: status,
      name_servers: nameservers.map((ns: any) => ns.ldhName || ns.unicodeName).filter(Boolean),
      registry_domain_id: data.handle,
      last_update_of_whois_database: new Date().toISOString(),
      query_method: 'rdap' as const
    }

    // 添加注册商详细信息
    if (registrarEntity) {
      // 提取注册商URL
      if (registrarEntity.links) {
        const aboutLink = registrarEntity.links.find((link: any) => 
          link.rel === 'about' && link.type === 'text/html'
        )
        if (aboutLink && aboutLink.href) {
          result.registrar_url = aboutLink.href
        }
      }
      
      if (registrarEntity.publicIds) {
        const ianaId = registrarEntity.publicIds.find((id: any) => id.type === 'IANA Registrar ID')
        if (ianaId) {
          result.registrar_iana_id = ianaId.identifier
        }
      }
      
      // 查找注册商联系信息
      if (registrarEntity.entities) {
        const abuseEntity = registrarEntity.entities.find((e: any) => 
          e.roles && e.roles.includes('abuse')
        )
        if (abuseEntity && abuseEntity.vcardArray) {
          const vcardProps = abuseEntity.vcardArray[1] || []
          for (const prop of vcardProps) {
            if (prop[0] === 'email') {
              result.registrar_abuse_contact_email = prop[3]
            } else if (prop[0] === 'tel') {
              result.registrar_abuse_contact_phone = prop[3]
            }
          }
        }
      }
    }

    // 添加联系人信息
    const registrantContact = parseContactInfo(registrantEntity)
    if (registrantContact) {
      result.registrant_contact = registrantContact
    }

    const adminContact = parseContactInfo(adminEntity)
    if (adminContact) {
      result.admin_contact = adminContact
    }

    const techContact = parseContactInfo(techEntity)
    if (techContact) {
      result.tech_contact = techContact
    }

    // DNSSEC信息 - 增强版本
    if (data.secureDNS) {
      if (data.secureDNS.delegationSigned === true) {
        result.dnssec = 'signedDelegation'
      } else if (data.secureDNS.delegationSigned === false) {
        result.dnssec = 'unsigned'
      } else {
        // 处理字符串格式的DNSSEC状态
        const dnssecStatus = String(data.secureDNS.delegationSigned).toLowerCase()
        if (dnssecStatus === 'true' || dnssecStatus === 'signed') {
          result.dnssec = 'signedDelegation'
        } else if (dnssecStatus === 'false' || dnssecStatus === 'unsigned') {
          result.dnssec = 'unsigned'
        } else {
          result.dnssec = dnssecStatus
        }
      }
    }

    return result
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
 * Who-Dat API查询（第二优先级）
 */
async function queryWhoDatAPI(domain: string): Promise<Partial<WhoisResult>> {
  console.log(`🔍 Querying Who-Dat API for ${domain}`)
  
  // 获取环境变量中的API Key和Base URL
  const apiKey = process.env.WHO_DAT_API_KEY || ''
  const baseUrl = process.env.WHO_DAT_BASE_URL || 'https://whois-domain-teal.vercel.app'
  
  console.log(`🔧 Debug - API Key exists: ${!!apiKey}`)
  console.log(`🔧 Debug - API Key length: ${apiKey.length}`)
  console.log(`🔧 Debug - Base URL: ${baseUrl}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const headers: Record<string, string> = {
      'User-Agent': 'NextName-WHOIS-Service/1.0',
      'Accept': 'application/json'
    }

    // 如果有API Key，添加到请求头（根据Who-Dat标准格式）
    if (apiKey) {
      headers.Authorization = apiKey  // Who-Dat API直接使用key，不需要Bearer前缀
    }

    console.log(`📡 Making request to: ${baseUrl}/${domain}`)
    const response = await fetch(`${baseUrl}/${domain}`, {
      method: 'GET',
      signal: controller.signal,
      headers
    })

    clearTimeout(timeout)
    console.log(`📡 Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // 特殊处理：如果是404或500，可能是域名不存在，先检查响应内容
      if (response.status === 404 || response.status === 500) {
        const responseText = await response.text();
        console.log(`📡 Response text for ${response.status}: ${responseText}`)
        
        // 检查是否返回了域名不存在的文本
        if (responseText.includes('domain is not found') || 
            responseText.includes('whoisparser:') ||
            responseText.includes('No matching query') ||
            responseText.includes('not found') ||
            responseText.includes('No data found')) {
          console.log(`✅ Who-Dat API: ${domain} is available (status ${response.status}, not found)`)
          return {
            domain,
            is_available: true,
            query_method: 'whodat' as const,
            last_update_of_whois_database: new Date().toISOString()
          }
        }
      }
      throw new Error(`Who-Dat API failed: ${response.status}`)
    }

    const responseText = await response.text()
    console.log(`📡 Response text (${responseText.length} chars): ${responseText.substring(0, 200)}...`)
    
    // 检查是否返回了 "domain is not found" 文本响应
    if (responseText.includes('domain is not found') || 
        responseText.includes('whoisparser:') ||
        responseText.includes('No matching query') ||
        responseText.includes('not found') ||
        responseText.includes('No data found')) {
      console.log(`✅ Who-Dat API: ${domain} is available (not found)`)
      return {
        domain,
        is_available: true,
        query_method: 'whodat' as const,
        last_update_of_whois_database: new Date().toISOString()
      }
    }

    let data
    try {
      data = JSON.parse(responseText)
      console.log(`📡 Parsed JSON response successfully`)
    } catch (parseError) {
      // 如果不是JSON，可能是纯文本响应，尝试解析
      console.warn(`Who-Dat API returned non-JSON response: ${responseText.substring(0, 200)}`)
      
      // 对于.cn等域名和其他文本响应，尝试解析纯文本WHOIS数据
      // 不仅仅检查长度，也检查是否包含有意义的WHOIS信息或域名状态
      if (responseText.length > 10 && 
          (responseText.includes(':') || 
           responseText.includes('whoisparser') || 
           responseText.includes('domain') ||
           !responseText.includes('error') && !responseText.includes('failed'))) {
        // 尝试解析纯文本WHOIS数据
        console.log(`📝 Parsing text WHOIS response for ${domain}: ${responseText.substring(0, 100)}`)
        return parseTextWhoisResponse(responseText, domain)
      }
      
      throw new Error(`Who-Dat API returned invalid response: ${responseText.substring(0, 100)}`)
    }
    console.log(`✅ Who-Dat API success for ${domain}`)

    // 解析Who-Dat API返回的数据
    return parseWhoDatResponse(data, domain)
  } catch (error) {
    console.warn(`❌ Who-Dat API failed for ${domain}:`, error instanceof Error ? error.message : error)
    throw new WhoisError(
      `Who-Dat API query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'SERVICE_UNAVAILABLE',
      domain
    )
  }
}

/**
 * 解析Who-Dat API纯文本WHOIS响应（适用于.cn等域名）
 */
function parseTextWhoisResponse(textResponse: string, domain: string): Partial<WhoisResult> {
  try {
    const result: Partial<WhoisResult> = {
      domain,
      query_method: 'whodat' as const,
      last_update_of_whois_database: new Date().toISOString(),
      whois_raw: textResponse
    }

    const lines = textResponse.split('\n').map(line => line.trim())
    
    // 检查域名是否可用
    const lowerText = textResponse.toLowerCase()
    if (lowerText.includes('no matching query') ||
        lowerText.includes('not found') ||
        lowerText.includes('no data found') ||
        lowerText.includes('domain not found') ||
        lowerText.includes('没有匹配的查询结果') ||
        lowerText.includes('未找到') ||
        lowerText.includes('无匹配结果')) {
      result.is_available = true
      return result
    }

    // 域名已注册，设置为false
    result.is_available = false

    // 解析WHOIS信息
    for (const line of lines) {
      if (!line || line.startsWith('%') || line.startsWith('#')) continue
      
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) continue
      
      const key = line.substring(0, colonIndex).trim().toLowerCase()
      const value = line.substring(colonIndex + 1).trim()
      
      if (!value) continue

      // 注册商信息
      if (key.includes('registrar') || key.includes('注册商') || key.includes('sponsor')) {
        if (!/^\d+$/.test(value) && value.length > 2) {
          result.registrar = value
        }
      }
      // 创建时间
      else if (key.includes('registration time') || key.includes('registration date') || 
               key.includes('created') || key.includes('注册时间') || key.includes('created date')) {
        result.created_date = value
      }
      // 到期时间
      else if (key.includes('expiration time') || key.includes('expiration date') || 
               key.includes('expires') || key.includes('到期时间') || key.includes('expiry date')) {
        result.expiry_date = value
      }
      // 更新时间
      else if (key.includes('updated') || key.includes('更新时间') || key.includes('last updated')) {
        result.updated_date = value
      }
      // 域名状态
      else if (key.includes('domain status') || key.includes('status') || key.includes('域名状态')) {
        if (!result.status) result.status = []
        const statuses = value.split(/[,;]/).map(s => s.trim()).filter(Boolean)
        result.status.push(...statuses)
      }
      // 名称服务器
      else if (key.includes('name server') || key.includes('nserver') || key.includes('dns') || 
               key.includes('域名服务器') || key.includes('nameserver')) {
        if (!result.name_servers) result.name_servers = []
        const servers = value.split(/[,;\s]/).map(s => s.trim()).filter(Boolean)
        result.name_servers.push(...servers)
      }
      // DNSSEC
      else if (key.includes('dnssec')) {
        const dnssecLower = value.toLowerCase()
        if (dnssecLower.includes('signed') || dnssecLower === 'yes') {
          result.dnssec = 'signedDelegation'
        } else if (dnssecLower.includes('unsigned') || dnssecLower === 'no') {
          result.dnssec = 'unsigned'
        } else {
          result.dnssec = value
        }
      }
    }

    // 去重名称服务器
    if (result.name_servers) {
      result.name_servers = [...new Set(result.name_servers)]
    }
    
    // 去重状态
    if (result.status) {
      result.status = [...new Set(result.status)]
    }

    return result
  } catch (error) {
    throw new WhoisError(
      `Failed to parse text WHOIS response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      domain,
      { textResponse: textResponse.substring(0, 500) }
    )
  }
}

/**
 * 解析Who-Dat API响应（适配用户自定义实例格式）
 */
function parseWhoDatResponse(data: any, domain: string): Partial<WhoisResult> {
  try {
    const result: Partial<WhoisResult> = {
      domain,
      query_method: 'whodat' as const,
      last_update_of_whois_database: new Date().toISOString()
    }

    // 处理域名基本信息
    if (data.domain) {
      const domainInfo = data.domain
      
      // 设置可用性 - 如果有域名信息，说明已注册
      result.is_available = false
      
      // 日期信息
      if (domainInfo.created_date || domainInfo.created_date_in_time) {
        result.created_date = domainInfo.created_date_in_time || domainInfo.created_date
      }
      if (domainInfo.expiration_date || domainInfo.expiration_date_in_time) {
        result.expiry_date = domainInfo.expiration_date_in_time || domainInfo.expiration_date
      }
      
      // 状态信息
      if (domainInfo.status && Array.isArray(domainInfo.status)) {
        result.status = domainInfo.status
      }
      
      // 名称服务器
      if (domainInfo.name_servers && Array.isArray(domainInfo.name_servers)) {
        result.name_servers = domainInfo.name_servers
      }
      
      // 域名ID
      if (domainInfo.id) {
        result.registry_domain_id = domainInfo.id
      }
    }

    // 处理注册商信息
    if (data.registrar) {
      const registrarInfo = data.registrar
      if (registrarInfo.name) {
        result.registrar = registrarInfo.name
      }
      // 添加注册商URL和投诉联系方式
      if (registrarInfo.url) {
        result.registrar_url = registrarInfo.url
      }
      if (registrarInfo.whois_server) {
        result.registrar_whois_server = registrarInfo.whois_server
      }
      if (registrarInfo.abuse_contact_email) {
        result.registrar_abuse_contact_email = registrarInfo.abuse_contact_email
      }
      if (registrarInfo.abuse_contact_phone) {
        result.registrar_abuse_contact_phone = registrarInfo.abuse_contact_phone
      }
    }

    // 处理注册人联系信息
    if (data.registrant) {
      const registrantInfo = data.registrant
      result.registrant_contact = {
        name: registrantInfo.name,
        organization: registrantInfo.organization,
        email: registrantInfo.email,
        phone: registrantInfo.phone,
        country: registrantInfo.country,
        state: registrantInfo.state || registrantInfo.province,
        city: registrantInfo.city,
        address: registrantInfo.address
      }
    }

    // 处理管理员联系信息
    if (data.admin || data.administrative_contact) {
      const adminData = data.admin || data.administrative_contact
      result.admin_contact = {
        name: adminData.name,
        organization: adminData.organization,
        email: adminData.email,
        phone: adminData.phone,
        country: adminData.country,
        address: adminData.address
      }
    }

    // 处理技术联系信息
    if (data.tech || data.technical_contact) {
      const techData = data.tech || data.technical_contact
      result.tech_contact = {
        name: techData.name,
        organization: techData.organization,
        email: techData.email,
        phone: techData.phone,
        country: techData.country,
        address: techData.address
      }
    }

    // 处理DNSSEC信息
    if (data.dnssec) {
      if (typeof data.dnssec === 'string') {
        const dnssecLower = data.dnssec.toLowerCase()
        if (dnssecLower.includes('signed') || dnssecLower === 'true') {
          result.dnssec = 'signedDelegation'
        } else if (dnssecLower.includes('unsigned') || dnssecLower === 'false') {
          result.dnssec = 'unsigned'
        } else {
          result.dnssec = data.dnssec
        }
      } else if (typeof data.dnssec === 'boolean') {
        result.dnssec = data.dnssec ? 'signedDelegation' : 'unsigned'
      }
    }

    return result
  } catch (error) {
    throw new WhoisError(
      `Failed to parse Who-Dat response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PARSE_ERROR',
      domain,
      { responseData: data }
    )
  }
}

/**
 * WHO.CX API查询（第三优先级）
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
      const colonIndex = line.indexOf(':')
      
      if (colonIndex === -1) continue // Skip lines without colons
      
      const key = line.substring(0, colonIndex).trim().toLowerCase()
      const value = line.substring(colonIndex + 1).trim()
      
      if (!value) continue // Skip empty values

      if (key.includes('registrar') || key.includes('注册商')) {
        // Enhanced registrar parsing - avoid numeric IDs
        if (!/^\d+$/.test(value) && value.length > 2) {
          result.registrar = value
        }
      } else if (key.includes('creation date') || key.includes('created') || key.includes('注册时间')) {
        result.created_date = value
      } else if (key.includes('expiry date') || key.includes('expires') || key.includes('到期时间')) {
        result.expiry_date = value
      } else if (key.includes('updated date') || key.includes('updated') || key.includes('更新时间')) {
        result.updated_date = value
      } else if (key.includes('name server') || key.includes('dns')) {
        if (!result.name_servers) result.name_servers = []
        if (value && !result.name_servers.includes(value)) {
          result.name_servers.push(value)
        }
      } else if (key.includes('status') || key.includes('状态')) {
        if (!result.status) result.status = []
        if (value && !result.status.includes(value)) {
          result.status.push(value)
        }
      } else if (key.includes('dnssec') || key.includes('sec dns')) {
        // 处理DNSSEC信息
        const dnssecLower = value.toLowerCase()
        if (dnssecLower.includes('signed') || dnssecLower === 'yes' || dnssecLower === 'true') {
          result.dnssec = 'signedDelegation'
        } else if (dnssecLower.includes('unsigned') || dnssecLower === 'no' || dnssecLower === 'false') {
          result.dnssec = 'unsigned'
        } else {
          result.dnssec = value
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

  // 对于已知没有RDAP支持的TLD，直接跳过RDAP查询
  const tld = getTLD(normalizedDomain)
  const skipRDAP = ['cn', 'ru', 'xn--p1ai', 'xn--j1amh'].includes(tld) // 添加更多不支持RDAP的TLD
  
  if (!skipRDAP) {
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
    }
  } else {
    console.log(`⏭️ Skipping RDAP for ${normalizedDomain} (${tld} TLD not supported)`)
  }

  try {
    // 第二优先级：Who-Dat API
    console.log(`📡 Trying Who-Dat API for ${normalizedDomain}`)
    const whodatResult = await queryWhoDatAPI(normalizedDomain)

    const queryTime = Date.now() - startTime
    console.log(`✅ Who-Dat API query successful for ${normalizedDomain} (${queryTime}ms)`)

    return {
      ...whodatResult,
      domain: normalizedDomain,
      query_time_ms: queryTime
    } as WhoisResult
  } catch (whodatError) {
    console.warn(`❌ Who-Dat API failed for ${normalizedDomain}:`, whodatError instanceof Error ? whodatError.message : whodatError)

    try {
      // 第三优先级：WHO.CX API
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
      console.error(`❌ All WHOIS methods failed for ${normalizedDomain}`)

      // 所有方法都失败，抛出详细错误
      const queryTime = Date.now() - startTime
      throw new WhoisError(
        `All WHOIS query methods failed for ${normalizedDomain}. Please try again later.`,
        'SERVICE_UNAVAILABLE',
        normalizedDomain,
        {
          rdapError: skipRDAP ? 'Skipped (TLD not supported)' : rdapError instanceof Error ? rdapError.message : rdapError,
          whoDatError: whodatError instanceof Error ? whodatError.message : whodatError,
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
