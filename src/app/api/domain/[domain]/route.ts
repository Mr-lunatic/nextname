import { NextRequest, NextResponse } from 'next/server'
import { domainCache, CacheKeys } from '@/lib/cache'
import { shouldUseWhois, getWhoisServer } from '@/lib/whois-servers'
import { queryWhois } from '@/lib/whois-query'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

// IANA RDAP Bootstrap Service
const IANA_RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json'

// Cache for RDAP bootstrap data (to avoid repeated requests)
let rdapBootstrapCache: any = null
let bootstrapCacheTime = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

// Cache for supported TLDs list
let supportedTLDsCache: string[] = []
let tldsCacheTime = 0

// Cache for domain query results
let domainQueryCache: Map<string, any> = new Map()
let domainCacheTime: Map<string, number> = new Map()
const DOMAIN_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes

// Cache for working RDAP servers
let workingRdapServers: Map<string, string[]> = new Map()
let rdapServerCacheTime: Map<string, number> = new Map()
const RDAP_SERVER_CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 hours

// Cache for failed servers (to avoid repeated attempts)
let failedRdapServers: Map<string, Set<string>> = new Map()
let failedServerCacheTime: Map<string, number> = new Map()
const FAILED_SERVER_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

// Enhanced fallback RDAP servers using IANA bootstrap data
const FALLBACK_RDAP_SERVERS: { [key: string]: string[] } = {
  // Major gTLDs (from IANA bootstrap)
  'com': ['https://rdap.verisign.com/com/v1/'],
  'net': ['https://rdap.verisign.com/net/v1/'],
  'org': ['https://rdap.publicinterestregistry.org/rdap/'],
  'info': ['https://rdap.identitydigital.services/rdap/'],
  'biz': ['https://rdap.nic.biz/'],
  'name': ['https://tld-rdap.verisign.com/name/v1/'],
  
  // Popular new gTLDs (from IANA bootstrap)
  'io': ['https://rdap.nic.io/'],
  'ai': ['https://rdap.nic.ai/'],
  'co': ['https://rdap.nic.co/'],
  'me': ['https://rdap.nic.me/'],
  'tv': ['https://rdap.nic.tv/'],
  'cc': ['https://rdap.nic.cc/'],
  'ly': ['https://rdap.nic.ly/'],
  'sh': ['https://rdap.nic.sh/'],
  'gg': ['https://rdap.nic.gg/'],
  
  // Google TLDs (from IANA bootstrap)
  'app': ['https://pubapi.registry.google/rdap/'],
  'dev': ['https://pubapi.registry.google/rdap/'],
  'page': ['https://pubapi.registry.google/rdap/'],
  'how': ['https://pubapi.registry.google/rdap/'],
  'google': ['https://pubapi.registry.google/rdap/'],
  
  // Country TLDs (from IANA bootstrap)
  'uk': ['https://rdap.nominet.uk/uk/'],
  'de': ['https://rdap.denic.de/'],
  'nl': ['https://rdap.sidn.nl/'],
  'fr': ['https://rdap.nic.fr/'],
  'it': ['https://rdap.nic.it/'],
  'be': ['https://rdap.dns.be/'],
  'eu': ['https://rdap.eu/'],
  'ca': ['https://rdap.ca.fury.ca/rdap/'],
  'au': ['https://rdap.auda.org.au/'],
  'jp': ['https://rdap.jprs.jp/'],
  'kr': ['https://rdap.kr/'],
  'in': ['https://rdap.nixiregistry.in/rdap/'],
  'br': ['https://rdap.registro.br/'],
  'mx': ['https://rdap.mx/'],
  'ru': ['https://rdap.tcinet.ru/'],
  'pl': ['https://rdap.dns.pl/'],
  'fi': ['https://rdap.fi/rdap/rdap/'],
  'no': ['https://rdap.norid.no/'],
  'si': ['https://rdap.register.si/'],
  'cz': ['https://rdap.nic.cz/'],
  
  // 特别注意：.cn域名RDAP支持情况复杂
  // 虽然ICANN要求gTLD支持RDAP，但.cn是ccTLD，由CNNIC自主管理
  // 尝试可能的中国RDAP服务器
  'cn': [
    'https://restwhois.ngtld.cn/',
    'https://rdap.teleinfo.cn/', 
    'https://rdap.cnnic.cn/',
    'https://rdap.cnnic.net.cn/'
  ],
  
  // Business TLDs
  'company': ['https://rdap.nic.company/'],
  'business': ['https://rdap.nic.business/'],
  'services': ['https://rdap.nic.services/'],
  'shop': ['https://rdap.nic.shop/'],
  'store': ['https://rdap.nic.store/'],
  
  // Tech TLDs
  'tech': ['https://rdap.nic.tech/'],
  'online': ['https://rdap.nic.online/'],
  'site': ['https://rdap.nic.site/'],
  'website': ['https://rdap.nic.website/'],
  
  // Creative TLDs
  'design': ['https://rdap.nic.design/'],
  'art': ['https://rdap.centralnic.com/art/'],
  'studio': ['https://rdap.nic.studio/'],
  'blog': ['https://rdap.blog.fury.ca/rdap/'],
  'news': ['https://rdap.nic.news/'],
  'media': ['https://rdap.nic.media/']
}

// Function to get all supported TLDs from IANA bootstrap
async function getSupportedTLDs(): Promise<string[]> {
  const now = Date.now()
  
  // Return cached TLDs if still valid
  if (supportedTLDsCache.length > 0 && (now - tldsCacheTime) < CACHE_DURATION) {
    return supportedTLDsCache
  }
  
  try {
    const bootstrap = await getRdapBootstrap()
    const tlds = new Set<string>()
    
    // Extract TLDs from bootstrap services
    if (bootstrap && bootstrap.services) {
      for (const service of bootstrap.services) {
        const [serviceTlds] = service
        if (Array.isArray(serviceTlds)) {
          serviceTlds.forEach(tld => tlds.add(tld.toLowerCase()))
        }
      }
    }
    
    // Add our fallback TLDs to ensure comprehensive coverage
    Object.keys(FALLBACK_RDAP_SERVERS).forEach(tld => tlds.add(tld))
    
    // Cache the result
    supportedTLDsCache = Array.from(tlds).sort()
    tldsCacheTime = now
    
    console.log(`✅ Loaded ${supportedTLDsCache.length} supported TLDs from IANA bootstrap`)
    return supportedTLDsCache
  } catch (error) {
    console.error('Failed to get supported TLDs from IANA bootstrap:', error)
    
    // Fallback to our predefined list
    supportedTLDsCache = Object.keys(FALLBACK_RDAP_SERVERS).sort()
    tldsCacheTime = now
    
    return supportedTLDsCache
  }
}

// Enhanced RDAP server patterns with more comprehensive coverage
function generateRdapServerPatterns(tld: string): string[] {
  const patterns = [
    // Standard patterns
    `https://rdap.nic.${tld}/`,
    `https://rdap.${tld}/`,
    `https://rdap.registry.${tld}/`,
    
    // Alternative naming conventions
    `https://whois.nic.${tld}/rdap/`,
    `https://rdap-${tld}.nic/`,
    `https://tld-rdap.${tld}/`,
    `https://rdap.${tld}.registry/`,
    `https://${tld}.rdap.nic/`,
    `https://registry.${tld}/rdap/`,
    
    // Major registry providers
    'https://rdap.centralnic.com/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.afilias.info/rdap/afilias/',
    'https://rdap.uniregistry.net/',
    'https://rdap.gmo-registry.com/rdap/',
    'https://rdap.nic.saarland/',
    'https://rdap.nic.red/',
    'https://rdap.donuts.domains/',
    'https://rdap.rightside.co/',
    
    // Regional registries
    'https://rdap.apnic.net/',
    'https://rdap.ripe.net/',
    'https://rdap.lacnic.net/',
    'https://rdap.afrinic.net/',
    'https://rdap.arin.net/',
    
    // ccTLD specific patterns
    `https://rdap.dns.${tld}/`,
    `https://whois.${tld}/rdap/`,
    `https://registry.${tld}/rdap/`
  ]
  
  return patterns
}

// Function to get TLD from domain
function getTLD(domain: string): string {
  const parts = domain.toLowerCase().split('.')
  return parts[parts.length - 1]
}

// Adaptive timeout based on TLD characteristics
function getTimeoutForTLD(tld: string): number {
  // Government and educational TLDs are typically slower
  const slowTLDs = ['gov', 'mil', 'edu', 'org', 'int', 'museum', 'coop', 'aero']
  // Country TLDs that might be slower due to geographic distance or infrastructure
  const countryTLDs = ['cn', 'ru', 'in', 'br', 'za', 'eg', 'ng', 'bd', 'pk']
  // Chinese domains often need extra time due to network latency and Great Firewall
  const chineseTLDs = ['cn', 'xn--fiqs8s', 'xn--fiqz9s'] // cn, 中国, 中國
  
  if (slowTLDs.includes(tld)) {
    return 15000 // 15 seconds for slow TLDs
  } else if (chineseTLDs.includes(tld)) {
    return 18000 // 18 seconds for Chinese TLDs (increased)
  } else if (countryTLDs.includes(tld)) {
    return 12000 // 12 seconds for country TLDs
  } else {
    return 10000 // 10 seconds for regular TLDs (increased from 8)
  }
}

// Function to get RDAP bootstrap data from IANA
async function getRdapBootstrap(): Promise<any> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (rdapBootstrapCache && (now - bootstrapCacheTime) < CACHE_DURATION) {
    return rdapBootstrapCache
  }
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // Increased timeout
    
    const response = await fetch(IANA_RDAP_BOOTSTRAP_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RDAP bootstrap: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Cache the bootstrap data
    rdapBootstrapCache = data
    bootstrapCacheTime = now
    
    return data
  } catch (error) {
    console.error('Failed to fetch IANA RDAP bootstrap:', error)
    // Return null to trigger fallback
    return null
  }
}

// Enhanced function to get RDAP server URL for a domain
async function getRdapServer(domain: string): Promise<string[]> {
  const tld = getTLD(domain)
  const servers: string[] = []
  
  // Special handling for CN domains - they don't have working RDAP
  if (tld === 'cn') {
    console.log(`🇨🇳 CN domain detected: ${domain} - skipping RDAP, will use HTTP verification`)
    return [] // Return empty array to skip RDAP entirely for CN domains
  }
  
  try {
    // Try to get official RDAP server from IANA bootstrap
    const bootstrap = await getRdapBootstrap()
    
    if (bootstrap && bootstrap.services) {
      // Find the service that handles this TLD
      for (const service of bootstrap.services) {
        const [tlds, rdapServers] = service
        if (tlds.includes(tld) && rdapServers && rdapServers.length > 0) {
          // Add all official servers
          rdapServers.forEach((server: string) => {
            const serverUrl = server.endsWith('/') ? server : server + '/'
            if (!servers.includes(serverUrl)) {
              servers.push(serverUrl)
            }
          })
          break
        }
      }
    }
  } catch (error) {
    console.error('Error getting RDAP server from bootstrap:', error)
  }
  
  // Add fallback servers
  const fallbackServers = FALLBACK_RDAP_SERVERS[tld]
  if (fallbackServers) {
    fallbackServers.forEach(server => {
      if (!servers.includes(server)) {
        servers.push(server)
      }
    })
  }
  
  // If no servers found, generate comprehensive patterns (except for CN)
  if (servers.length === 0 && tld !== 'cn') {
    const patterns = generateRdapServerPatterns(tld)
    patterns.forEach(pattern => {
      if (!servers.includes(pattern)) {
        servers.push(pattern)
      }
    })
  }
  
  // Remove servers that have failed recently for this TLD
  const failedServers = failedRdapServers.get(tld) || new Set()
  const failedCacheTime = failedServerCacheTime.get(tld) || 0
  
  if (Date.now() - failedCacheTime < FAILED_SERVER_CACHE_DURATION) {
    return servers.filter(server => !failedServers.has(server))
  }
  
  return servers
}

// Enhanced RDAP query with intelligent retry and error handling
async function queryRDAP(domain: string): Promise<any> {
  const tld = getTLD(domain)
  
  // Special handling for CN domains - skip RDAP entirely
  if (tld === 'cn') {
    console.log(`🇨🇳 CN domain ${domain} - skipping RDAP, will use fallback verification`)
    return {
      available: null,
      error: 'CN domains do not support RDAP protocol',
      fallback: true
    }
  }
  
  // Check if we have cached working servers for this TLD
  let rdapServers = workingRdapServers.get(tld)
  const serverCacheTime = rdapServerCacheTime.get(tld) || 0
  
  if (!rdapServers || (Date.now() - serverCacheTime) > RDAP_SERVER_CACHE_DURATION) {
    rdapServers = await getRdapServer(domain)
    // Don't cache yet - wait for successful response
  }
  
  if (!rdapServers || rdapServers.length === 0) {
    throw new Error(`No RDAP server found for domain: ${domain}`)
  }

  console.log(`Querying RDAP for ${domain} with ${rdapServers.length} servers (enhanced parallel)`)
  
  // Increase limit to top 5 servers for better success rate
  const topServers = rdapServers.slice(0, 5)
  const timeout = getTimeoutForTLD(tld)
  
  // Try all servers in parallel, take the first successful response
  console.log(`🚀 Starting enhanced parallel RDAP queries for ${domain} using servers:`, topServers)
  console.log(`⏰ Using ${timeout}ms timeout for .${tld} TLD`)

  const promises = topServers.map(async (server, index) => {
    const rdapUrl = `${server}domain/${domain}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Add small delay for secondary servers to prioritize faster ones
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 200))
      }

      console.log(`🔍 [${index + 1}/${topServers.length}] Querying RDAP server: ${rdapUrl}`)

      const response = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/rdap+json',
          'User-Agent': 'Domain-Search-Platform/1.0'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log(`📡 RDAP response from ${server}: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        console.log(`❌ RDAP server ${server} returned ${response.status}: ${response.statusText}`)

        // Handle different error types
        if (response.status === 404) {
          // Domain not found - likely available
          console.log(`✅ Domain ${domain} not found in registry (available)`)
          return {
            available: true,
            reason: 'Domain not found in registry',
            server: server,
            success: true
          }
        }

        if (response.status === 429) {
          // Rate limited - mark server as failed temporarily
          console.log(`⏰ Rate limited on ${server}`)
          markServerAsFailed(tld, server)
          throw new Error(`Rate limited on ${server}`)
        }

        if (response.status >= 500) {
          // Server error - mark as failed temporarily
          console.log(`🚫 Server error on ${server}`)
          markServerAsFailed(tld, server)
          throw new Error(`Server error on ${server}: ${response.status}`)
        }

        // Other errors
        const errorText = await response.text().catch(() => 'Unknown error')
        console.log(`🚫 Server ${server} error: ${response.status} - ${errorText}`)
        throw new Error(`Server ${server} returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log(`📋 RDAP data structure from ${server}:`, {
        objectClassName: data.objectClassName,
        hasEvents: !!data.events,
        hasEntities: !!data.entities,
        hasStatus: !!data.status,
        eventsCount: data.events?.length || 0,
        entitiesCount: data.entities?.length || 0
      })

      // Check if this is a valid RDAP response
      if (!data.objectClassName || data.objectClassName !== 'domain') {
        console.log(`❌ Invalid RDAP response from ${server}: missing or wrong objectClassName`)
        throw new Error(`Invalid RDAP response from ${server}`)
      }

      console.log(`✅ Valid RDAP response received from ${server}`)

      return {
        available: false,
        rdapData: data,
        server: server,
        success: true
      }
    } catch (error) {
      console.log(`❌ RDAP server ${server} failed:`, error instanceof Error ? error.message : error)
      
      // Mark server as failed if it's a persistent error
      if (error instanceof Error && 
          (error.message.includes('timeout') || 
           error.message.includes('fetch failed') ||
           error.message.includes('Rate limited'))) {
        markServerAsFailed(tld, server)
      }
      
      throw new Error(`${server}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
  
  try {
    // Wait for the first successful response using Promise.allSettled
    console.log(`⏳ Waiting for RDAP responses from ${promises.length} servers...`)
    const results = await Promise.allSettled(promises)

    // Log all results for debugging
    console.log(`📋 RDAP query results:`, results.map((result, index) => ({
      server: topServers[index],
      status: result.status,
      success: result.status === 'fulfilled' ? result.value?.success : false,
      error: result.status === 'rejected' ? result.reason?.message : null
    })))

    // Find the first successful result
    const successfulResult = results.find(
      (result): result is PromiseFulfilledResult<any> =>
        result.status === 'fulfilled' && result.value.success
    )

    if (!successfulResult) {
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Unknown error')

      console.log(`❌ All RDAP servers failed for ${domain}. Errors:`, errors)
      throw new Error('All servers failed')
    }

    const result = successfulResult.value

    // Cache the working server for this TLD
    if (result.success) {
      const workingServers = [result.server, ...topServers.filter(s => s !== result.server)]
      workingRdapServers.set(tld, workingServers)
      rdapServerCacheTime.set(tld, Date.now())
      console.log(`💾 Cached working RDAP server for .${tld}: ${result.server}`)
    }

    console.log(`✅ Successful RDAP response from ${result.server}`)
    return result
  } catch (error) {
    // All servers failed
    console.log(`❌ All RDAP servers failed for ${domain}`)
    return {
      available: null,
      error: 'All RDAP servers failed',
      fallback: true
    }
  }
}

// Function to mark a server as failed temporarily
function markServerAsFailed(tld: string, server: string) {
  if (!failedRdapServers.has(tld)) {
    failedRdapServers.set(tld, new Set())
  }
  failedRdapServers.get(tld)!.add(server)
  failedServerCacheTime.set(tld, Date.now())
  console.log(`🚫 Marked server as failed for .${tld}: ${server}`)
}

// Function to parse RDAP response
function parseRdapResponse(rdapData: any, domain: string) {
  const events = rdapData.events || []
  const entities = rdapData.entities || []
  const status = rdapData.status || []
  const nameservers = rdapData.nameservers || []

  // Debug: Log all available events to help diagnose date issues
  console.log(`📅 RDAP events for ${domain}:`, events.map((e: any) => ({
    action: e.eventAction,
    date: e.eventDate
  })))

  // Find registrar entity - include CN-specific roles
  const registrarEntity = entities.find((entity: any) => 
    entity.roles && (
      entity.roles.includes('registrar') || 
      entity.roles.includes('reseller') ||
      entity.roles.includes('sponsor') // Common in CN domains
    )
  )

  // Extract dates from events - try multiple event action names including CN-specific ones
  const createdEvent = events.find((event: any) =>
    ['registration', 'registered', 'created', 'creation', '注册', '创建'].includes(event.eventAction?.toLowerCase())
  )
  const updatedEvent = events.find((event: any) =>
    ['last changed', 'last updated', 'updated', 'changed', 'modification', '最后修改', '更新'].includes(event.eventAction?.toLowerCase())
  )
  const expiryEvent = events.find((event: any) =>
    ['expiration', 'expires', 'expiry', 'registry expiry date', '到期', '过期'].includes(event.eventAction?.toLowerCase())
  )
  const transferEvent = events.find((event: any) =>
    ['transfer', 'transferred', '转移', '转入'].includes(event.eventAction?.toLowerCase())
  )

  // Debug: Log which events were found
  console.log(`📅 Found events for ${domain}:`, {
    created: createdEvent ? { action: createdEvent.eventAction, date: createdEvent.eventDate } : null,
    updated: updatedEvent ? { action: updatedEvent.eventAction, date: updatedEvent.eventDate } : null,
    expiry: expiryEvent ? { action: expiryEvent.eventAction, date: expiryEvent.eventDate } : null,
    transfer: transferEvent ? { action: transferEvent.eventAction, date: transferEvent.eventDate } : null
  })

  // Extract nameserver names
  const nameServerNames = nameservers.map((ns: any) => ns.ldhName || ns.unicodeName).filter(Boolean)

  // Extract registrar information
  let registrarName = 'Unknown Registrar'
  let registrarIanaId = null
  let registrarEmail = null
  let registrarPhone = null
  
  if (registrarEntity) {
    // Try to get registrar name from vCard
    if (registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
      const fnField = registrarEntity.vcardArray[1].find((item: any) => item[0] === 'fn')
      if (fnField && fnField[3]) {
        registrarName = fnField[3]
      }
    }
    
    // Get IANA ID
    if (registrarEntity.publicIds) {
      const ianaId = registrarEntity.publicIds.find((id: any) => id.type === 'IANA Registrar ID')
      if (ianaId) {
        registrarIanaId = ianaId.identifier
      }
    }
    
    // Get contact info
    if (registrarEntity.vcardArray && registrarEntity.vcardArray[1]) {
      const emailField = registrarEntity.vcardArray[1].find((item: any) => item[0] === 'email')
      const phoneField = registrarEntity.vcardArray[1].find((item: any) => item[0] === 'tel')
      
      if (emailField && emailField[3]) registrarEmail = emailField[3]
      if (phoneField && phoneField[3]) registrarPhone = phoneField[3]
    }
  }

  return {
    domain,
    is_available: false,
    registrar: registrarName,
    registrar_iana_id: registrarIanaId,
    registrar_whois_server: rdapData.port43 || null,
    registrar_url: registrarEntity?.links?.find((link: any) => link.rel === 'related')?.href || null,
    created_date: createdEvent?.eventDate || null,
    updated_date: updatedEvent?.eventDate || null,
    expiry_date: expiryEvent?.eventDate || null,
    transfer_date: transferEvent?.eventDate || null,
    status: status,
    name_servers: nameServerNames,
    dnssec: rdapData.secureDNS?.delegationSigned ? 'signedDelegation' : 'unsigned',
    dnssec_details: rdapData.secureDNS || null,
    registrar_abuse_contact_email: registrarEmail,
    registrar_abuse_contact_phone: registrarPhone,
    registry_domain_id: rdapData.handle || null,
    last_update_of_whois_database: new Date().toISOString()
  }
}

// Enhanced heuristic check using online domain verification (optimized)
async function verifyDomainOnline(domain: string): Promise<boolean> {
  try {
    // Parallel check for both HTTP and HTTPS with shorter timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // Increased to 3 seconds
    
    const httpsPromise = fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    })
    
    const httpPromise = fetch(`http://${domain}`, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow'
    })
    
    // Try both in parallel, if either succeeds, domain is registered
    try {
      const results = await Promise.allSettled([httpsPromise, httpPromise])
      const hasSuccessfulResponse = results.some(result => result.status === 'fulfilled')
      clearTimeout(timeoutId)
      return hasSuccessfulResponse
    } catch (error) {
      clearTimeout(timeoutId)
      return false
    }
  } catch (error) {
    return false
  }
}

// Who.cx API查询函数 - 当RDAP不支持时的备用查询
async function queryWhoCxAPI(domain: string) {
  try {
    console.log(`🔍 Trying Who.cx API for ${domain}`)
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    
    const response = await fetch(`https://who.cx/api/price?domain=${domain}`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NextName-Domain-Search/1.0'
      }
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      throw new Error(`Who.cx API returned ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`📋 Who.cx API response for ${domain}:`, data)
    
    if (data.code === 200 && data.domain === domain) {
      // 有价格信息说明域名可注册
      if (data.new || data.renew) {
        return {
          domain,
          is_available: true,
          registrar: undefined,
          registrar_iana_id: null,
          registrar_whois_server: null,
          registrar_url: null,
          created_date: null,
          updated_date: null,
          expiry_date: null,
          status: ['available'],
          name_servers: [],
          dnssec: 'unknown',
          registrar_abuse_contact_email: null,
          registrar_abuse_contact_phone: null,
          registry_domain_id: null,
          last_update_of_whois_database: new Date().toISOString(),
          fallback_method: 'Who.cx Price API (available for registration)',
          pricing: {
            new: data.new,
            renew: data.renew,
            currency: data.currency,
            currency_symbol: data.currency_symbol
          }
        }
      } else {
        // 没有价格信息，可能已注册
        return {
          domain,
          is_available: false,
          registrar: 'Unknown (detected via Who.cx)',
          registrar_iana_id: null,
          registrar_whois_server: null,
          registrar_url: null,
          created_date: null,
          updated_date: null,
          expiry_date: null,
          status: ['registered (inferred)'],
          name_servers: [],
          dnssec: 'unknown',
          registrar_abuse_contact_email: null,
          registrar_abuse_contact_phone: null,
          registry_domain_id: null,
          last_update_of_whois_database: new Date().toISOString(),
          fallback_method: 'Who.cx Price API (no pricing - likely registered)'
        }
      }
    }
    
    return null // API调用失败
  } catch (error) {
    console.error(`❌ Who.cx API failed for ${domain}:`, error)
    return null
  }
}

// Fallback function for when RDAP fails - especially important for CN domains
async function getFallbackResponse(domain: string) {
  const tld = getTLD(domain)
  
  // For CN domains, be more conservative since RDAP often fails
  if (tld === 'cn') {
    console.log(`🇨🇳 CN domain detected: ${domain} - using enhanced verification`)
    
    // Try online verification first
    const isOnline = await verifyDomainOnline(domain)
    
    if (isOnline) {
      return {
        domain,
        is_available: false,
        registrar: 'Unknown (CN domain - RDAP unavailable)',
        registrar_iana_id: null,
        registrar_whois_server: null,
        registrar_url: null,
        created_date: null,
        updated_date: null,
        expiry_date: null,
        status: ['CN domain - verified via HTTP'],
        name_servers: [],
        dnssec: 'unknown',
        registrar_abuse_contact_email: null,
        registrar_abuse_contact_phone: null,
        registry_domain_id: null,
        last_update_of_whois_database: new Date().toISOString(),
        fallback_method: 'CN HTTP verification'
      }
    }
    
    // For CN domains, if HTTP verification fails, be conservative and assume registered
    // This is because CN RDAP is unreliable, better to be conservative
    const [name] = domain.split('.')
    const isVeryLikelyAvailable = name.length > 15 && // Very long names
      !/^(test|demo|example|www|mail|app|api|admin|blog|shop|home|info|news|support|help|contact|china|beijing|shanghai|guangzhou|shenzhen|hangzhou|nanjing|chengdu|wuhan|xian|tianjin|qingdao|dalian|harbin|changchun|shijiazhuang|taiyuan|hohhot|shenyang|jinan|zhengzhou|wuhan|changsha|nanning|haikou|chongqing|kunming|guiyang|lhasa|lanzhou|xining|yinchuan|urumqi)$/.test(name.toLowerCase())
    
    return {
      domain,
      is_available: isVeryLikelyAvailable,
      registrar: isVeryLikelyAvailable ? null : 'Unknown (CN domain - RDAP unavailable)',
      created_date: null,
      expiry_date: null,
      status: isVeryLikelyAvailable ? [] : ['CN domain - conservative guess (likely registered)'],
      name_servers: [],
      fallback_method: 'CN conservative heuristic'
    }
  }
  
  // For other domains, try online verification first
  const isOnline = await verifyDomainOnline(domain)
  
  if (isOnline) {
    return {
      domain,
      is_available: false,
      registrar: 'Unknown (RDAP query failed)',
      registrar_iana_id: null,
      registrar_whois_server: null,
      registrar_url: null,
      created_date: null,
      updated_date: null,
      expiry_date: null,
      status: ['RDAP query failed - verified via HTTP'],
      name_servers: [],
      dnssec: 'unknown',
      registrar_abuse_contact_email: null,
      registrar_abuse_contact_phone: null,
      registry_domain_id: null,
      last_update_of_whois_database: new Date().toISOString(),
      fallback_method: 'HTTP verification'
    }
  }
  
  // Use enhanced heuristic as last resort for non-CN domains
  const [name] = domain.split('.')
  const likelyRegistered = name.length <= 3 || // Very short names are usually taken
    /^(test|demo|example|www|mail|app|api|admin|blog|shop|home|info|news|support|help|contact)$/.test(name.toLowerCase())
  
  return {
    domain,
    is_available: !likelyRegistered,
    registrar: likelyRegistered ? 'Unknown (RDAP query failed)' : null,
    created_date: null,
    expiry_date: null,
    status: likelyRegistered ? ['RDAP query failed - heuristic guess'] : [],
    name_servers: [],
    fallback_method: 'Enhanced heuristic guess'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain.toLowerCase().trim()
  
  // Validate domain format
  if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return NextResponse.json(
      { error: 'Invalid domain format' }, 
      { status: 400 }
    )
  }

  try {
    console.log(`🔍 Processing domain: ${domain}`)
    const tld = getTLD(domain)
    
    // Check cache first
    const cacheKey = CacheKeys.domain(domain)
    const cachedResult = domainCache.get(cacheKey)
    
    if (cachedResult) {
      console.log(`✅ Returning cached result for ${domain}`)
      return NextResponse.json(cachedResult)
    }
    
    let responseData
    
    // 选择查询方法：WHOIS vs RDAP
    if (shouldUseWhois(tld)) {
      console.log(`📋 Using WHOIS protocol for ${domain} (TLD: ${tld})`)
      
      try {
        const whoisResult = await queryWhois(domain)
        
        responseData = {
          domain,
          is_available: whoisResult.is_available,
          registrar: whoisResult.registrar,
          registrar_iana_id: null,
          registrar_whois_server: getWhoisServer(tld),
          registrar_url: null,
          created_date: whoisResult.created_date,
          updated_date: whoisResult.updated_date,
          expiry_date: whoisResult.expiry_date,
          status: whoisResult.status || [],
          name_servers: whoisResult.name_servers || [],
          dnssec: 'unknown',
          registrar_abuse_contact_email: null,
          registrar_abuse_contact_phone: null,
          registry_domain_id: null,
          last_update_of_whois_database: new Date().toISOString(),
          fallback_method: whoisResult.fallback_method,
          whois_raw: whoisResult.whois_text, // 保留原始WHOIS文本用于调试
          ...(whoisResult.error && { error: whoisResult.error }) // 条件性添加error属性
        }
        
        console.log(`✅ WHOIS query completed for ${domain}: ${whoisResult.is_available ? 'available' : 'registered'}`)
        
      } catch (error) {
        console.error(`❌ WHOIS query failed for ${domain}:`, error)
        
        // Try Who.cx API as backup for WHOIS failures
        console.log(`⚠️  WHOIS failed for ${domain}, trying Who.cx API as backup`)
        const whoCxResult = await queryWhoCxAPI(domain)
        
        if (whoCxResult) {
          console.log(`✅ Who.cx API success for ${domain}: ${whoCxResult.is_available ? 'available' : 'registered'}`)
          responseData = whoCxResult
        } else {
          // Both WHOIS and Who.cx failed, use enhanced fallback
          console.log(`⚠️  Both WHOIS and Who.cx failed for ${domain}, using enhanced fallback verification`)
          const fallbackData = await getFallbackResponse(domain)
          responseData = {
            ...fallbackData,
            fallback_reason: 'WHOIS query failed, Who.cx also failed'
          }
        }
      }
    } else {
      // 使用RDAP协议
      console.log(`🔗 Using RDAP protocol for ${domain} (TLD: ${tld})`)
      
      const rdapResult = await queryRDAP(domain)
      
      if (rdapResult.available === true) {
        // Domain is available
        responseData = {
          domain,
          is_available: true,
          registrar: null,
          created_date: null,
          expiry_date: null,
          status: [],
          name_servers: []
        }
      } else if (rdapResult.available === false && rdapResult.rdapData) {
        // Domain is registered, parse RDAP data
        responseData = parseRdapResponse(rdapResult.rdapData, domain)
        console.log(`✅ RDAP success for ${domain}: ${responseData.registrar}`)
      } else {
        // RDAP failed, try Who.cx API as backup
        console.log(`⚠️  RDAP failed for ${domain}, trying Who.cx API as backup`)
        
        const whoCxResult = await queryWhoCxAPI(domain)
        if (whoCxResult) {
          console.log(`✅ Who.cx API success for ${domain}: ${whoCxResult.is_available ? 'available' : 'registered'}`)
          responseData = whoCxResult
        } else {
          // Both RDAP and Who.cx failed, use enhanced fallback
          console.log(`⚠️  Both RDAP and Who.cx failed for ${domain}, using enhanced fallback verification`)
          const fallbackData = await getFallbackResponse(domain)
          responseData = {
            ...fallbackData,
            fallback_reason: `RDAP failed: ${rdapResult.error}, Who.cx also failed`
          }
        }
      }
    }
    
    // Cache the result with stratified TTL
    let ttl: number
    if (responseData.is_available) {
      ttl = 5 * 60 * 1000 // 5min for available domains (they might get registered)
    } else if ('fallback_method' in responseData && responseData.fallback_method) {
      ttl = 2 * 60 * 1000 // 2min for fallback results (less reliable)
    } else {
      ttl = 30 * 60 * 1000 // 30min for registered domains with RDAP data
    }
    
    domainCache.set(cacheKey, responseData, ttl)
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error(`❌ Error processing domain ${domain}:`, error)
    
    // Final fallback with online verification
    const fallbackData = await getFallbackResponse(domain)
    
    return NextResponse.json({
      ...fallbackData,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}