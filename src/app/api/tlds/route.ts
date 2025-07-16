import { NextRequest, NextResponse } from 'next/server'
import { tldCache, CacheKeys } from '@/lib/cache'

// Get all supported TLDs from IANA bootstrap
export async function GET() {
  // Check cache first
  const cacheKey = CacheKeys.tldList()
  const cachedData = tldCache.get(cacheKey)
  
  if (cachedData) {
    console.log('✅ Returning cached TLD data')
    return NextResponse.json({
      ...cachedData,
      cached: true,
      cache_age: Math.floor((Date.now() - cachedData.timestamp) / 1000)
    })
  }
  
  try {
    // Fetch current IANA bootstrap data with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
    
    const response = await fetch('https://data.iana.org/rdap/dns.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal,
      cache: 'force-cache' // Explicitly cache this external data
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IANA bootstrap: ${response.status}`)
    }
    
    const data = await response.json()
    const tlds = new Set<string>()
    
    // Extract TLDs from bootstrap services
    if (data && data.services) {
      for (const service of data.services) {
        const [serviceTlds, servers] = service
        if (Array.isArray(serviceTlds) && Array.isArray(servers) && servers.length > 0) {
          serviceTlds.forEach(tld => tlds.add(tld.toLowerCase()))
        }
      }
    }
    
    // Convert to sorted array
    const sortedTlds = Array.from(tlds).sort()
    
    // Categorize TLDs with better performance
    const categorizedTlds = categorizeRTlds(sortedTlds)
    
    // Cache the results with timestamp
    const responseData = {
      total: sortedTlds.length,
      tlds: sortedTlds,
      categorized: categorizedTlds,
      last_updated: new Date().toISOString(),
      timestamp: Date.now()
    }
    
    tldCache.set(cacheKey, responseData, 24 * 60 * 60 * 1000) // 24 hours
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Failed to get supported TLDs:', error)
    
    // Try to return any cached data, even if expired
    const expiredCache = tldCache.get(cacheKey)
    if (expiredCache) {
      console.log('⚠️ Using expired cache due to fetch error')
      return NextResponse.json({
        ...expiredCache,
        cached: true,
        expired: true,
        error: 'Fresh data unavailable, using cache'
      })
    }
    
    // Return fallback data
    const fallbackTlds = [
      'com', 'net', 'org', 'info', 'biz', 'name', 'pro',
      'io', 'ai', 'dev', 'app', 'tech', 'online', 'site', 'website',
      'shop', 'store', 'business', 'company', 'services',
      'design', 'art', 'studio', 'photography', 'blog', 'news', 'media',
      'uk', 'de', 'fr', 'nl', 'it', 'es', 'ca', 'au', 'jp', 'br', 'mx',
      'co', 'me', 'tv', 'cc', 'ly', 'sh', 'gg',
      'xyz', 'top', 'club', 'click', 'link'
    ]
    
    const fallbackCategorized = categorizeRTlds(fallbackTlds)
    
    return NextResponse.json({
      total: fallbackTlds.length,
      tlds: fallbackTlds,
      categorized: fallbackCategorized,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Optimized TLD categorization function
function categorizeRTlds(tlds: string[]) {
  const categorizedTlds: { [key: string]: string[] } = {
    generic: [],
    country: [],
    tech: [],
    business: [],
    creative: [],
    media: [],
    finance: [],
    health: [],
    education: [],
    travel: [],
    other: []
  }
  
  // Pre-define category maps for better performance
  const categoryMap = {
    generic: new Set(['com', 'net', 'org', 'info', 'biz', 'name', 'pro']),
    tech: new Set(['tech', 'io', 'ai', 'dev', 'app', 'software', 'computer', 'digital']),
    business: new Set(['shop', 'store', 'business', 'company', 'services', 'enterprise']),
    creative: new Set(['design', 'art', 'studio', 'photography', 'creative', 'gallery']),
    media: new Set(['blog', 'news', 'media', 'tv', 'radio', 'video']),
    finance: new Set(['finance', 'money', 'bank', 'insurance', 'investment']),
    health: new Set(['health', 'care', 'medical', 'fitness', 'wellness']),
    education: new Set(['education', 'school', 'academy', 'university']),
    travel: new Set(['travel', 'hotel', 'restaurant', 'tourism'])
  }
  
  tlds.forEach(tld => {
    if (tld.length === 2) {
      categorizedTlds.country.push(tld)
    } else {
      let categorized = false
      for (const [category, tldSet] of Object.entries(categoryMap)) {
        if (tldSet.has(tld)) {
          categorizedTlds[category].push(tld)
          categorized = true
          break
        }
      }
      if (!categorized) {
        categorizedTlds.other.push(tld)
      }
    }
  })
  
  return categorizedTlds
}