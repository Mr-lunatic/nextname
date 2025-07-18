import { NextRequest, NextResponse } from 'next/server'
import { domainCache, CacheKeys } from '@/lib/cache'

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

// Comprehensive fallback RDAP servers (synchronized with search API)
const FALLBACK_RDAP_SERVERS: { [key: string]: string[] } = {
  // Major gTLDs
  'com': ['https://rdap.verisign.com/com/v1/', 'https://rdap.nic.com/'],
  'net': ['https://rdap.verisign.com/net/v1/', 'https://rdap.nic.net/'],
  'org': ['https://rdap.publicinterestregistry.org/', 'https://rdap.nic.org/'],
  'info': ['https://rdap.afilias.info/rdap/afilias/', 'https://rdap.nic.info/'],
  'biz': ['https://rdap.afilias.info/rdap/afilias/', 'https://rdap.nic.biz/'],
  'name': ['https://rdap.afilias.info/rdap/afilias/', 'https://rdap.nic.name/'],
  
  // Popular new gTLDs
  'io': ['https://rdap.nic.io/', 'https://rdap.nic.io/'],
  'ai': ['https://rdap.nic.ai/', 'https://rdap.nic.ai/'],
  'co': ['https://rdap.nic.co/', 'https://rdap.nic.co/'],
  'me': ['https://rdap.nic.me/', 'https://rdap.nic.me/'],
  'tv': ['https://rdap.nic.tv/', 'https://rdap.nic.tv/'],
  'cc': ['https://rdap.nic.cc/', 'https://rdap.nic.cc/'],
  'ly': ['https://rdap.nic.ly/', 'https://rdap.nic.ly/'],
  'sh': ['https://rdap.nic.sh/', 'https://rdap.nic.sh/'],
  'gg': ['https://rdap.nic.gg/', 'https://rdap.nic.gg/'],
  
  // Tech TLDs
  'tech': ['https://rdap.nic.tech/', 'https://rdap.nic.tech/'],
  'online': ['https://rdap.nic.online/', 'https://rdap.nic.online/'],
  'site': ['https://rdap.nic.site/', 'https://rdap.nic.site/'],
  'website': ['https://rdap.nic.website/', 'https://rdap.nic.website/'],
  'app': ['https://rdap.nic.google/', 'https://rdap.google.com/'],
  'dev': ['https://rdap.nic.google/', 'https://rdap.google.com/'],
  'page': ['https://rdap.nic.google/', 'https://rdap.google.com/'],
  'how': ['https://rdap.nic.google/', 'https://rdap.google.com/'],
  
  // Business TLDs
  'company': ['https://rdap.nic.company/', 'https://rdap.nic.company/'],
  'business': ['https://rdap.nic.business/', 'https://rdap.nic.business/'],
  'services': ['https://rdap.nic.services/', 'https://rdap.nic.services/'],
  'shop': ['https://rdap.nic.shop/', 'https://rdap.nic.shop/'],
  'store': ['https://rdap.nic.store/', 'https://rdap.nic.store/'],
  
  // Creative TLDs
  'design': ['https://rdap.nic.design/', 'https://rdap.nic.design/'],
  'art': ['https://rdap.nic.art/', 'https://rdap.nic.art/'],
  'studio': ['https://rdap.nic.studio/', 'https://rdap.nic.studio/'],
  'photography': ['https://rdap.nic.photography/', 'https://rdap.nic.photography/'],
  'blog': ['https://rdap.nic.blog/', 'https://rdap.nic.blog/'],
  'news': ['https://rdap.nic.news/', 'https://rdap.nic.news/'],
  'media': ['https://rdap.nic.media/', 'https://rdap.nic.media/'],
  
  // Country TLDs with RDAP
  'uk': ['https://rdap.nominet.uk/', 'https://rdap.nic.uk/'],
  'de': ['https://rdap.denic.de/', 'https://rdap.nic.de/'],
  'cn': ['https://rdap.cnnic.cn/', 'https://rdap.nic.cn/'],
  'nl': ['https://rdap.sidn.nl/', 'https://rdap.nic.nl/'],
  'fr': ['https://rdap.nic.fr/', 'https://rdap.nic.fr/'],
  'it': ['https://rdap.nic.it/', 'https://rdap.nic.it/'],
  'be': ['https://rdap.dns.be/', 'https://rdap.nic.be/'],
  'eu': ['https://rdap.eu/', 'https://rdap.nic.eu/'],
  'ca': ['https://rdap.ca/', 'https://rdap.nic.ca/'],
  'au': ['https://rdap.auda.org.au/', 'https://rdap.nic.au/'],
  'jp': ['https://rdap.jprs.jp/', 'https://rdap.nic.jp/'],
  'kr': ['https://rdap.kr/', 'https://rdap.nic.kr/'],
  'in': ['https://rdap.registry.in/', 'https://rdap.nic.in/'],
  'ru': ['https://rdap.tcinet.ru/', 'https://rdap.nic.ru/'],
  'br': ['https://rdap.registro.br/', 'https://rdap.nic.br/'],
  'mx': ['https://rdap.mx/', 'https://rdap.nic.mx/'],
  
  // Generic new TLDs
  'top': ['https://rdap.nic.top/', 'https://rdap.nic.top/'],
  'xyz': ['https://rdap.nic.xyz/', 'https://rdap.nic.xyz/'],
  'click': ['https://rdap.nic.click/', 'https://rdap.nic.click/'],
  'link': ['https://rdap.uniregistry.net/', 'https://rdap.nic.link/'],
  'club': ['https://rdap.nic.club/', 'https://rdap.nic.club/'],
  
  // Financial TLDs
  'finance': ['https://rdap.nic.finance/', 'https://rdap.nic.finance/'],
  'money': ['https://rdap.nic.money/', 'https://rdap.nic.money/'],
  'crypto': ['https://rdap.nic.crypto/', 'https://rdap.nic.crypto/'],
  
  // Entertainment TLDs
  'games': ['https://rdap.nic.games/', 'https://rdap.nic.games/'],
  'fun': ['https://rdap.nic.fun/', 'https://rdap.nic.fun/'],
  'live': ['https://rdap.nic.live/', 'https://rdap.nic.live/'],
  'stream': ['https://rdap.nic.stream/', 'https://rdap.nic.stream/'],
  
  // Health TLDs
  'health': ['https://rdap.nic.health/', 'https://rdap.nic.health/'],
  'care': ['https://rdap.nic.care/', 'https://rdap.nic.care/'],
  'fitness': ['https://rdap.nic.fitness/', 'https://rdap.nic.fitness/'],
  
  // Education TLDs
  'education': ['https://rdap.nic.education/', 'https://rdap.nic.education/'],
  'academy': ['https://rdap.nic.academy/', 'https://rdap.nic.academy/'],
  'school': ['https://rdap.nic.school/', 'https://rdap.nic.school/'],
  
  // Travel TLDs
  'travel': ['https://rdap.nic.travel/', 'https://rdap.nic.travel/'],
  'hotel': ['https://rdap.nic.hotel/', 'https://rdap.nic.hotel/'],
  'restaurant': ['https://rdap.nic.restaurant/', 'https://rdap.nic.restaurant/']
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

// Generate common RDAP server patterns for unknown TLDs
function generateRdapServerPatterns(tld: string): string[] {
  const patterns = [
    `https://rdap.nic.${tld}/`,
    `https://rdap.${tld}/`,
    `https://rdap.registry.${tld}/`,
    `https://whois.nic.${tld}/rdap/`,
    `https://rdap-${tld}.nic/`,
    `https://tld-rdap.${tld}/`,
    `https://rdap.${tld}.registry/`,
    `https://rdap.centralnic.com/${tld}/`,
    `https://rdap.identitydigital.services/rdap/`,
    `https://rdap.afilias.info/rdap/${tld}/`
  ]
  
  return patterns
}
// Function to get TLD from domain
function getTLD(domain: string): string {
  const parts = domain.toLowerCase().split('.')
  return parts[parts.length - 1]
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
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
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

// Function to get RDAP server URL for a domain (enhanced)
async function getRdapServer(domain: string): Promise<string[]> {
  const tld = getTLD(domain)
  const servers: string[] = []
  
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
            servers.push(serverUrl)
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
  
  // If no servers found, generate common patterns
  if (servers.length === 0) {
    const patterns = generateRdapServerPatterns(tld)
    servers.push(...patterns)
  }
  
  return servers
}

// Function to query RDAP with parallel attempts (optimized)
async function queryRDAP(domain: string): Promise<any> {
  const tld = getTLD(domain)
  
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

  console.log(`Querying RDAP for ${domain} with ${rdapServers.length} servers (parallel)`)
  
  // Limit to top 3 servers for faster response
  const topServers = rdapServers.slice(0, 3)
  
  // Try all servers in parallel, take the first successful response
  const promises = topServers.map(async (server) => {
    const rdapUrl = `${server}domain/${domain}`
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // Reduced to 3 seconds
      
      const response = await fetch(rdapUrl, {
        headers: {
          'Accept': 'application/rdap+json',
          'User-Agent': 'Domain-Search-Platform/1.0'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          // Domain not found - likely available
          return {
            available: true,
            reason: 'Domain not found in registry',
            server: server,
            success: true
          }
        }
        
        if (response.status === 429) {
          // Rate limited - mark server as slow
          throw new Error(`Rate limited on ${server}`)
        }
        
        // Other errors
        throw new Error(`Server ${server} returned ${response.status}`)
      }

      const data = await response.json()
      
      // Check if this is a valid RDAP response
      if (!data.objectClassName || data.objectClassName !== 'domain') {
        throw new Error(`Invalid RDAP response from ${server}`)
      }
      
      return {
        available: false,
        rdapData: data,
        server: server,
        success: true
      }
    } catch (error) {
      throw new Error(`${server}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
  
  try {
    // Wait for the first successful response using Promise.allSettled
    const results = await Promise.allSettled(promises)
    
    // Find the first successful result
    const successfulResult = results.find(
      (result): result is PromiseFulfilledResult<any> => 
        result.status === 'fulfilled' && result.value.success
    )
    
    if (!successfulResult) {
      throw new Error('All servers failed')
    }
    
    const result = successfulResult.value
    
    // Cache the working server for this TLD
    if (result.success) {
      const workingServers = [result.server, ...topServers.filter(s => s !== result.server)]
      workingRdapServers.set(tld, workingServers)
      rdapServerCacheTime.set(tld, Date.now())
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

  // Find registrar entity
  const registrarEntity = entities.find((entity: any) => 
    entity.roles && entity.roles.includes('registrar')
  )

  // Extract dates from events - try multiple event action names
  const createdEvent = events.find((event: any) =>
    ['registration', 'registered', 'created', 'creation'].includes(event.eventAction?.toLowerCase())
  )
  const updatedEvent = events.find((event: any) =>
    ['last changed', 'last updated', 'updated', 'changed', 'modification'].includes(event.eventAction?.toLowerCase())
  )
  const expiryEvent = events.find((event: any) =>
    ['expiration', 'expires', 'expiry', 'registry expiry date'].includes(event.eventAction?.toLowerCase())
  )

  // Debug: Log which events were found
  console.log(`📅 Found events for ${domain}:`, {
    created: createdEvent ? { action: createdEvent.eventAction, date: createdEvent.eventDate } : null,
    updated: updatedEvent ? { action: updatedEvent.eventAction, date: updatedEvent.eventDate } : null,
    expiry: expiryEvent ? { action: expiryEvent.eventAction, date: expiryEvent.eventDate } : null
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
    status: status,
    name_servers: nameServerNames,
    dnssec: rdapData.secureDNS?.delegationSigned ? 'signedDelegation' : 'unsigned',
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
    const timeoutId = setTimeout(() => controller.abort(), 2000) // Reduced to 2 seconds
    
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

// Fallback function for when RDAP fails
async function getFallbackResponse(domain: string) {
  // Try online verification first
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
  
  // Use heuristic as last resort
  const [name] = domain.split('.')
  const likelyRegistered = name.length <= 4 || /^(test|demo|example|www|mail|app|api|admin)$/.test(name.toLowerCase())
  
  return {
    domain,
    is_available: !likelyRegistered,
    registrar: likelyRegistered ? 'Unknown (RDAP query failed)' : null,
    created_date: null,
    expiry_date: null,
    status: likelyRegistered ? ['RDAP query failed - heuristic guess'] : [],
    name_servers: [],
    fallback_method: 'Heuristic guess'
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
    
    // Check cache first
    const cacheKey = CacheKeys.domain(domain)
    const cachedResult = domainCache.get(cacheKey)
    
    if (cachedResult) {
      console.log(`✅ Returning cached result for ${domain}`)
      return NextResponse.json(cachedResult)
    }
    
    // Query RDAP (no artificial delay)
    const rdapResult = await queryRDAP(domain)
    
    let responseData
    
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
      // RDAP failed, use enhanced fallback
      console.log(`⚠️  RDAP failed for ${domain}, using fallback verification`)
      const fallbackData = await getFallbackResponse(domain)
      responseData = {
        ...fallbackData,
        fallback_reason: rdapResult.error
      }
    }
    
    // Cache the result with appropriate TTL
    const ttl = responseData.is_available ? 10 * 60 * 1000 : 30 * 60 * 1000 // 10min for available, 30min for registered
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