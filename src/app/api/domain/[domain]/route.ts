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

// Cache for failed servers (to avoid repeated attempts)
let failedRdapServers: Map<string, Set<string>> = new Map()
let failedServerCacheTime: Map<string, number> = new Map()
const FAILED_SERVER_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

// Enhanced fallback RDAP servers with more providers
const FALLBACK_RDAP_SERVERS: { [key: string]: string[] } = {
  // Major gTLDs with multiple providers
  'com': [
    'https://rdap.verisign.com/com/v1/',
    'https://rdap.nic.com/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/com/'
  ],
  'net': [
    'https://rdap.verisign.com/net/v1/',
    'https://rdap.nic.net/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/net/'
  ],
  'org': [
    'https://rdap.publicinterestregistry.org/',
    'https://rdap.nic.org/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.afilias.info/rdap/afilias/'
  ],
  'info': [
    'https://rdap.afilias.info/rdap/afilias/',
    'https://rdap.nic.info/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'biz': [
    'https://rdap.afilias.info/rdap/afilias/',
    'https://rdap.nic.biz/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'name': [
    'https://rdap.afilias.info/rdap/afilias/',
    'https://rdap.nic.name/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  
  // Popular new gTLDs with enhanced coverage
  'io': [
    'https://rdap.nic.io/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/io/'
  ],
  'ai': [
    'https://rdap.nic.ai/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/ai/'
  ],
  'co': [
    'https://rdap.nic.co/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/co/'
  ],
  'me': [
    'https://rdap.nic.me/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/me/'
  ],
  'tv': [
    'https://rdap.nic.tv/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/tv/'
  ],
  'cc': [
    'https://rdap.nic.cc/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/cc/'
  ],
  'ly': [
    'https://rdap.nic.ly/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'sh': [
    'https://rdap.nic.sh/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'gg': [
    'https://rdap.nic.gg/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  
  // Tech TLDs
  'tech': [
    'https://rdap.nic.tech/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/tech/'
  ],
  'online': [
    'https://rdap.nic.online/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/online/'
  ],
  'site': [
    'https://rdap.nic.site/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/site/'
  ],
  'website': [
    'https://rdap.nic.website/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/website/'
  ],
  'app': [
    'https://rdap.nic.google/',
    'https://rdap.google.com/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'dev': [
    'https://rdap.nic.google/',
    'https://rdap.google.com/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'page': [
    'https://rdap.nic.google/',
    'https://rdap.google.com/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'how': [
    'https://rdap.nic.google/',
    'https://rdap.google.com/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  
  // Business TLDs
  'company': [
    'https://rdap.nic.company/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/company/'
  ],
  'business': [
    'https://rdap.nic.business/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/business/'
  ],
  'services': [
    'https://rdap.nic.services/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/services/'
  ],
  'shop': [
    'https://rdap.nic.shop/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/shop/'
  ],
  'store': [
    'https://rdap.nic.store/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/store/'
  ],
  
  // Creative TLDs
  'design': [
    'https://rdap.nic.design/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/design/'
  ],
  'art': [
    'https://rdap.nic.art/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/art/'
  ],
  'studio': [
    'https://rdap.nic.studio/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/studio/'
  ],
  'photography': [
    'https://rdap.nic.photography/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/photography/'
  ],
  'blog': [
    'https://rdap.nic.blog/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/blog/'
  ],
  'news': [
    'https://rdap.nic.news/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/news/'
  ],
  'media': [
    'https://rdap.nic.media/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/media/'
  ],
  
  // Country TLDs with RDAP
  'uk': [
    'https://rdap.nominet.uk/',
    'https://rdap.nic.uk/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'de': [
    'https://rdap.denic.de/',
    'https://rdap.nic.de/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'cn': [
    'https://rdap.cnnic.cn/',
    'https://rdap.nic.cn/',
    'https://restwhois.ngtld.cn/',
    'https://rdap.teleinfo.cn/',
    'https://rdap.identitydigital.services/rdap/',
    // Additional fallback patterns for CN
    'https://whois.cnnic.cn/rdap/',
    'https://registry.cn/rdap/'
  ],
  'nl': [
    'https://rdap.sidn.nl/',
    'https://rdap.nic.nl/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'fr': [
    'https://rdap.nic.fr/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'it': [
    'https://rdap.nic.it/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'be': [
    'https://rdap.dns.be/',
    'https://rdap.nic.be/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'eu': [
    'https://rdap.eu/',
    'https://rdap.nic.eu/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'ca': [
    'https://rdap.ca/',
    'https://rdap.nic.ca/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'au': [
    'https://rdap.auda.org.au/',
    'https://rdap.nic.au/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'jp': [
    'https://rdap.jprs.jp/',
    'https://rdap.nic.jp/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'kr': [
    'https://rdap.kr/',
    'https://rdap.nic.kr/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'in': [
    'https://rdap.registry.in/',
    'https://rdap.nic.in/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'ru': [
    'https://rdap.tcinet.ru/',
    'https://rdap.nic.ru/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'br': [
    'https://rdap.registro.br/',
    'https://rdap.nic.br/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  'mx': [
    'https://rdap.mx/',
    'https://rdap.nic.mx/',
    'https://rdap.identitydigital.services/rdap/'
  ],
  
  // Generic new TLDs
  'top': [
    'https://rdap.nic.top/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/top/'
  ],
  'xyz': [
    'https://rdap.nic.xyz/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/xyz/'
  ],
  'click': [
    'https://rdap.nic.click/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/click/'
  ],
  'link': [
    'https://rdap.uniregistry.net/',
    'https://rdap.nic.link/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/link/'
  ],
  'club': [
    'https://rdap.nic.club/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/club/'
  ],
  
  // Financial TLDs
  'finance': [
    'https://rdap.nic.finance/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/finance/'
  ],
  'money': [
    'https://rdap.nic.money/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/money/'
  ],
  'crypto': [
    'https://rdap.nic.crypto/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/crypto/'
  ],
  
  // Entertainment TLDs
  'games': [
    'https://rdap.nic.games/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/games/'
  ],
  'fun': [
    'https://rdap.nic.fun/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/fun/'
  ],
  'live': [
    'https://rdap.nic.live/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/live/'
  ],
  'stream': [
    'https://rdap.nic.stream/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/stream/'
  ],
  
  // Health TLDs
  'health': [
    'https://rdap.nic.health/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/health/'
  ],
  'care': [
    'https://rdap.nic.care/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/care/'
  ],
  'fitness': [
    'https://rdap.nic.fitness/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/fitness/'
  ],
  
  // Education TLDs
  'education': [
    'https://rdap.nic.education/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/education/'
  ],
  'academy': [
    'https://rdap.nic.academy/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/academy/'
  ],
  'school': [
    'https://rdap.nic.school/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/school/'
  ],
  
  // Travel TLDs
  'travel': [
    'https://rdap.nic.travel/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/travel/'
  ],
  'hotel': [
    'https://rdap.nic.hotel/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/hotel/'
  ],
  'restaurant': [
    'https://rdap.nic.restaurant/',
    'https://rdap.identitydigital.services/rdap/',
    'https://rdap.centralnic.com/restaurant/'
  ]
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
  
  // If no servers found, generate comprehensive patterns
  if (servers.length === 0) {
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
  
  // Use enhanced heuristic as last resort
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
      console.log(`⚠️  RDAP failed for ${domain}, using enhanced fallback verification`)
      const fallbackData = await getFallbackResponse(domain)
      responseData = {
        ...fallbackData,
        fallback_reason: rdapResult.error
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