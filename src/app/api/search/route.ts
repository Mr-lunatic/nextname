import { NextRequest, NextResponse } from 'next/server'
import { searchCache, tldCache, CacheKeys } from '@/lib/cache'
import { tldMetadata, getAllSupportedTLDs } from '@/lib/tld-data'
import { queryWhois } from '@/lib/whois-service'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'










// Mock registrar pricing data (integrated from pricing API)
const registrarPricing = {
  '.com': [
    { registrar: 'Porkbun', registrationPrice: 7.87, renewalPrice: 9.13, transferPrice: 7.87, currency: 'USD', features: ['Free SSL', 'Free Privacy', 'Modern Interface', 'Competitive Pricing'], rating: 4.6, isPopular: true, discountPercent: 20 },
    { registrar: 'Cloudflare', registrationPrice: 8.57, renewalPrice: 8.57, transferPrice: 8.57, currency: 'USD', features: ['No Markup Pricing', 'Free Privacy', 'Security Features', 'Global CDN'], rating: 4.8, isPopular: true },
    { registrar: 'Namecheap', registrationPrice: 8.88, renewalPrice: 13.98, transferPrice: 8.98, currency: 'USD', features: ['Free WHOIS Privacy', 'Email Forwarding', 'URL Forwarding', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 31 },
    { registrar: 'Google Domains', registrationPrice: 12.00, renewalPrice: 12.00, transferPrice: 12.00, currency: 'USD', features: ['24/7 Support', 'Domain Lock', 'Free Email', 'Website Builder'], rating: 4.2, isPremium: true },
    { registrar: 'GoDaddy', registrationPrice: 12.99, renewalPrice: 17.99, transferPrice: 8.99, currency: 'USD', features: ['World\'s Largest Registrar', '24/7 Support', 'Website Builder', 'Email Marketing'], rating: 4.1, discountPercent: 15 }
  ],
  '.net': [
    { registrar: 'Cloudflare', registrationPrice: 9.68, renewalPrice: 9.68, transferPrice: 9.68, currency: 'USD', features: ['No Markup Pricing', 'Free Privacy', 'Security Features'], rating: 4.8, isPopular: true },
    { registrar: 'Google Domains', registrationPrice: 12.00, renewalPrice: 12.00, transferPrice: 12.00, currency: 'USD', features: ['Simple Management', 'Privacy Protection', 'Email Forwarding'], rating: 4.2 },
    { registrar: 'Namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management', 'Email Forwarding'], rating: 4.5 },
    { registrar: 'GoDaddy', registrationPrice: 14.99, renewalPrice: 19.99, transferPrice: 10.99, currency: 'USD', features: ['24/7 Support', 'Domain Lock', 'Website Builder'], rating: 4.1, discountPercent: 25 }
  ],
  '.org': [
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 10.12, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy', 'Modern Interface'], rating: 4.6, isPopular: true, discountPercent: 20 },
    { registrar: 'Namecheap', registrationPrice: 12.98, renewalPrice: 14.98, transferPrice: 12.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5 },
    { registrar: 'GoDaddy', registrationPrice: 13.99, renewalPrice: 18.99, transferPrice: 9.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 30 }
  ],
  '.io': [
    { registrar: 'Namecheap', registrationPrice: 39.88, renewalPrice: 49.88, transferPrice: 39.88, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management', 'Tech Community Favorite'], rating: 4.5, isPopular: true, discountPercent: 25 },
    { registrar: 'Google Domains', registrationPrice: 60.00, renewalPrice: 60.00, transferPrice: 60.00, currency: 'USD', features: ['Simple Management', 'Privacy Protection'], rating: 4.2 },
    { registrar: 'GoDaddy', registrationPrice: 64.99, renewalPrice: 64.99, transferPrice: 64.99, currency: 'USD', features: ['24/7 Support', 'Premium Extension'], rating: 4.1 }
  ],
  '.ai': [
    { registrar: 'Porkbun', registrationPrice: 75.23, renewalPrice: 95.12, transferPrice: 75.23, currency: 'USD', features: ['AI/Tech Focused', 'Free SSL', 'Modern Interface'], rating: 4.6, isPopular: true, discountPercent: 15 },
    { registrar: 'Namecheap', registrationPrice: 89.88, renewalPrice: 99.88, transferPrice: 89.88, currency: 'USD', features: ['Tech Community', 'DNS Management'], rating: 4.5, discountPercent: 10 },
    { registrar: 'GoDaddy', registrationPrice: 99.99, renewalPrice: 99.99, transferPrice: 99.99, currency: 'USD', features: ['Premium Extension', '24/7 Support'], rating: 4.1 }
  ],
  '.dev': [
    { registrar: 'Cloudflare', registrationPrice: 9.15, renewalPrice: 9.15, transferPrice: 9.15, currency: 'USD', features: ['Developer Favorite', 'Security Features', 'Free Privacy'], rating: 4.8, isPopular: true },
    { registrar: 'Google Domains', registrationPrice: 12.00, renewalPrice: 12.00, transferPrice: 12.00, currency: 'USD', features: ['Google Registry', 'Simple Management'], rating: 4.2, isPopular: true },
    { registrar: 'GoDaddy', registrationPrice: 17.99, renewalPrice: 17.99, transferPrice: 17.99, currency: 'USD', features: ['Developer Tools', '24/7 Support'], rating: 4.1 }
  ],
  '.info': [
    { registrar: 'Namecheap', registrationPrice: 2.98, renewalPrice: 18.98, transferPrice: 7.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 80 },
    { registrar: 'GoDaddy', registrationPrice: 3.99, renewalPrice: 19.99, transferPrice: 7.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 75 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 17.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.biz': [
    { registrar: 'Namecheap', registrationPrice: 4.98, renewalPrice: 16.98, transferPrice: 8.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 70 },
    { registrar: 'GoDaddy', registrationPrice: 5.99, renewalPrice: 17.99, transferPrice: 8.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 65 },
    { registrar: 'Porkbun', registrationPrice: 7.87, renewalPrice: 15.99, transferPrice: 7.87, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.co': [
    { registrar: 'Namecheap', registrationPrice: 8.88, renewalPrice: 32.98, transferPrice: 18.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 60 },
    { registrar: 'GoDaddy', registrationPrice: 9.99, renewalPrice: 34.99, transferPrice: 19.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 55 },
    { registrar: 'Google Domains', registrationPrice: 24.00, renewalPrice: 24.00, transferPrice: 24.00, currency: 'USD', features: ['Simple Management', 'Privacy Protection'], rating: 4.2 }
  ],
  '.me': [
    { registrar: 'Namecheap', registrationPrice: 3.98, renewalPrice: 19.98, transferPrice: 8.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 75 },
    { registrar: 'GoDaddy', registrationPrice: 4.99, renewalPrice: 19.99, transferPrice: 8.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 70 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 17.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.tv': [
    { registrar: 'Namecheap', registrationPrice: 34.88, renewalPrice: 39.88, transferPrice: 34.88, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true },
    { registrar: 'GoDaddy', registrationPrice: 36.99, renewalPrice: 41.99, transferPrice: 36.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1 },
    { registrar: 'Google Domains', registrationPrice: 40.00, renewalPrice: 40.00, transferPrice: 40.00, currency: 'USD', features: ['Simple Management', 'Privacy Protection'], rating: 4.2 }
  ],
  '.app': [
    { registrar: 'Google Domains', registrationPrice: 12.00, renewalPrice: 12.00, transferPrice: 12.00, currency: 'USD', features: ['Google Registry', 'Simple Management'], rating: 4.2, isPopular: true },
    { registrar: 'Cloudflare', registrationPrice: 13.15, renewalPrice: 13.15, transferPrice: 13.15, currency: 'USD', features: ['Security Features', 'Free Privacy'], rating: 4.8 },
    { registrar: 'Namecheap', registrationPrice: 15.98, renewalPrice: 20.98, transferPrice: 15.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5 }
  ],
  '.tech': [
    { registrar: 'Namecheap', registrationPrice: 6.98, renewalPrice: 54.98, transferPrice: 18.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 85 },
    { registrar: 'GoDaddy', registrationPrice: 7.99, renewalPrice: 56.99, transferPrice: 19.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 80 },
    { registrar: 'Porkbun', registrationPrice: 18.67, renewalPrice: 49.99, transferPrice: 18.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.online': [
    { registrar: 'Namecheap', registrationPrice: 2.98, renewalPrice: 39.98, transferPrice: 12.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 90 },
    { registrar: 'GoDaddy', registrationPrice: 3.99, renewalPrice: 41.99, transferPrice: 13.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 85 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 35.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.site': [
    { registrar: 'Namecheap', registrationPrice: 2.98, renewalPrice: 32.98, transferPrice: 12.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 90 },
    { registrar: 'GoDaddy', registrationPrice: 3.99, renewalPrice: 34.99, transferPrice: 13.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 85 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 29.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.website': [
    { registrar: 'Namecheap', registrationPrice: 2.98, renewalPrice: 24.98, transferPrice: 8.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 85 },
    { registrar: 'GoDaddy', registrationPrice: 3.99, renewalPrice: 26.99, transferPrice: 9.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 80 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 22.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.xyz': [
    { registrar: 'Namecheap', registrationPrice: 1.98, renewalPrice: 13.98, transferPrice: 6.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 85 },
    { registrar: 'GoDaddy', registrationPrice: 2.99, renewalPrice: 14.99, transferPrice: 7.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 80 },
    { registrar: 'Porkbun', registrationPrice: 8.67, renewalPrice: 12.99, transferPrice: 8.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.top': [
    { registrar: 'Namecheap', registrationPrice: 1.98, renewalPrice: 12.98, transferPrice: 5.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 85 },
    { registrar: 'GoDaddy', registrationPrice: 2.99, renewalPrice: 13.99, transferPrice: 6.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 80 },
    { registrar: 'Porkbun', registrationPrice: 7.87, renewalPrice: 11.99, transferPrice: 7.87, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ],
  '.club': [
    { registrar: 'Namecheap', registrationPrice: 4.98, renewalPrice: 18.98, transferPrice: 8.98, currency: 'USD', features: ['Free WHOIS Privacy', 'DNS Management'], rating: 4.5, isPopular: true, discountPercent: 70 },
    { registrar: 'GoDaddy', registrationPrice: 5.99, renewalPrice: 19.99, transferPrice: 9.99, currency: 'USD', features: ['24/7 Support', 'Website Builder'], rating: 4.1, discountPercent: 65 },
    { registrar: 'Porkbun', registrationPrice: 13.67, renewalPrice: 17.99, transferPrice: 13.67, currency: 'USD', features: ['Free SSL', 'Free Privacy'], rating: 4.6 }
  ]
}

// Get top 3 cheapest registrars for a TLD using smart data source
async function getTopRegistrars(tld: string) {
  try {
    // 调用智能数据源的pricing API
    const baseURL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseURL}/api/pricing?domain=${encodeURIComponent(tld)}&order=new&pageSize=3`);

    if (!response.ok) {
      console.warn(`Failed to fetch pricing for ${tld}, falling back to static data`);
      // 回退到静态数据
      const pricing = registrarPricing[tld as keyof typeof registrarPricing]
      if (!pricing) return []
      const sortedPricing = [...pricing].sort((a, b) => a.registrationPrice - b.registrationPrice)
      return sortedPricing.slice(0, 3)
    }

    const data = await response.json();

    if (data.pricing && Array.isArray(data.pricing)) {
      // 转换为搜索结果需要的格式
      return data.pricing.map((item: any) => ({
        registrar: item.registrar,
        registrarCode: item.registrarCode,
        registrationPrice: item.registrationPrice,
        renewalPrice: item.renewalPrice,
        transferPrice: item.transferPrice,
        currency: item.currency || 'USD',
        features: item.features || [],
        rating: item.rating || 4.0
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error fetching pricing for ${tld}:`, error);
    // 回退到静态数据
    const pricing = registrarPricing[tld as keyof typeof registrarPricing]
    if (!pricing) return []
    const sortedPricing = [...pricing].sort((a, b) => a.registrationPrice - b.registrationPrice)
    return sortedPricing.slice(0, 3)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const type = searchParams.get('type') || 'auto'
  const lang = searchParams.get('lang') || 'zh'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!q) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  if (q.length > 64) {
    return NextResponse.json({ error: 'Query is too long' }, { status: 400 })
  }

  const sanitizedQuery = q.replace(/[^a-zA-Z0-9.-]/g, '');

  const allowedTypes = ['auto', 'domain', 'prefix', 'suffix'];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid search type' }, { status: 400 });
  }
  
  // Check cache first
  const cacheKey = CacheKeys.search(sanitizedQuery, type, page)
  const cachedResult = searchCache.get(cacheKey)
  
  if (cachedResult) {
    console.log(`✅ Returning cached search result for ${sanitizedQuery}`)
    return NextResponse.json(cachedResult)
  }
  
  // No artificial delay - process immediately
  const query = sanitizedQuery.toLowerCase()
  
  if (type === 'domain' || (type === 'auto' && query.includes('.'))) {
    // Domain availability check - use WHOIS service directly
    try {
      console.log(`🔍 Querying domain: ${query}`)
      const domainData = await queryWhois(query)

      const result = {
        query,
        type: 'domain' as const,
        result: {
          domain: query,
          is_available: domainData.is_available,
          whois_info: domainData.is_available ? null : {
            registrar: domainData.registrar,
            registry_domain_id: domainData.registry_domain_id,
            registrar_whois_server: domainData.registrar_whois_server,
            registrar_url: domainData.registrar_url,
            created_date: domainData.created_date,
            updated_date: domainData.updated_date,
            registry_expiry_date: domainData.expiry_date,
            registrar_iana_id: domainData.registrar_iana_id,
            registrar_abuse_contact_email: domainData.registrar_abuse_contact_email,
            registrar_abuse_contact_phone: domainData.registrar_abuse_contact_phone,
            domain_status: domainData.status,
            name_servers: domainData.name_servers,
            dnssec: domainData.dnssec,
            last_update_of_whois_database: domainData.last_update_of_whois_database || new Date().toISOString()
          }
        }
      }

      // Cache the result
      searchCache.set(cacheKey, result)
      console.log(`✅ Domain query successful for ${query}`)

      return NextResponse.json(result)
    } catch (error) {
      console.error(`❌ Domain query failed for ${query}:`, error)
      // 返回错误信息，不使用虚假数据
      return NextResponse.json({
        query,
        type: 'domain',
        error: 'Failed to query domain information. Please try again later.',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  }
  
  if (type === 'suffix' || (type === 'auto' && query.startsWith('.'))) {
    // Suffix pricing info with full registrar data
    const suffix = query.startsWith('.') ? query : `.${query}`
    const pricing = registrarPricing[suffix as keyof typeof registrarPricing] || []
    
    return NextResponse.json({
      query,
      type: 'suffix',
      result: {
        suffix,
        pricing_available: pricing.length > 0,
        registrar_prices: pricing,
        description: getSuffixDescription(suffix),
        category: getSuffixCategory(suffix),
        popularity: getSuffixPopularity(suffix)
      }
    })
  }
  
  // Prefix batch check - use real RDAP queries with pagination and dynamic TLD loading
  const prefix = query.replace(/^\./, '')
  
  // Get all supported TLDs dynamically
  const allTlds = await getAllSupportedTLDs()
  const popularTLDs = allTlds
  
  // Calculate pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const totalTLDs = popularTLDs.length
  const totalPages = Math.ceil(totalTLDs / limit)
  
  // Get TLDs for current page
  const currentPageTLDs = popularTLDs.slice(startIndex, endIndex)
  
  // Limit concurrent checks to prevent overwhelming RDAP servers
  const maxConcurrentChecks = 8 // Increased from 5 for better performance
  const tldBatches = []
  
  // Split current page TLDs into batches
  for (let i = 0; i < currentPageTLDs.length; i += maxConcurrentChecks) {
    tldBatches.push(currentPageTLDs.slice(i, i + maxConcurrentChecks))
  }
  
  const results = []
  const startTime = Date.now()
  const maxProcessingTime = 6000 // Reduced to 6 seconds for faster response
  
  // Process batches with timeout
  for (const batch of tldBatches) {
    // Check if we've exceeded time limit
    if (Date.now() - startTime > maxProcessingTime) {
      console.log(`⏱️ Time limit reached, returning partial results`)
      break
    }
    
    // Check each domain in the batch concurrently
    const batchPromises = batch.map(async (tld: { tld: string; marketShare: number; category: string; popularity: number; }) => {
      const domain = `${prefix}${tld.tld}`
      const tldInfo = allTlds.find((item: { tld: string; marketShare: number; category: string; popularity: number; }) => item.tld === tld.tld)
      
      try {
        // Call the domain API with shorter timeout for other extensions check
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // Reduced to 2 second timeout for faster UX
        
        const domainResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/domain/${domain}`, {
          signal: controller.signal,
          cache: 'no-store' // Do not cache domain availability checks
        })
        
        clearTimeout(timeoutId)
        
        if (!domainResponse.ok) {
          throw new Error(`API returned ${domainResponse.status}`)
        }
        
        const domainData = await domainResponse.json()
        
        const topRegistrars = await getTopRegistrars(tld.tld)
        
        return {
          domain,
          tld,
          is_available: domainData.is_available || false,
          estimated_price: domainData.is_available ? getEstimatedPrice(tld.tld) : null,
          registrar: domainData.is_available ? null : domainData.registrar,
          expiry_date: domainData.is_available ? null : domainData.expiry_date,
          market_share: tldInfo?.marketShare || 0,
          category: tldInfo?.category || 'generic',
          popularity: tldInfo?.popularity || 50,
          top_registrars: topRegistrars, // 无论域名是否可用，都提供注册商数据
          response_time: Date.now() - startTime
        }
      } catch (error) {
        console.error(`Failed to check ${domain}:`, error)
        // On error, return checking status instead of blocking
        const topRegistrars = await getTopRegistrars(tld.tld)
        
        return {
          domain,
          tld,
          is_available: null,
          estimated_price: getEstimatedPrice(tld.tld),
          error: 'Timeout',
          market_share: tldInfo?.marketShare || 0,
          category: tldInfo?.category || 'generic',
          popularity: tldInfo?.popularity || 50,
          top_registrars: topRegistrars,
          response_time: Date.now() - startTime
        }
      }
    })
    
    // Wait for batch to complete with timeout
    try {
      const batchResults = await Promise.allSettled(batchPromises)
      const successfulResults = batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
      
      results.push(...successfulResults)
    } catch (error) {
      console.error('Batch processing error:', error)
    }
    
    // Minimal delay between batches for better performance
    if (tldBatches.indexOf(batch) < tldBatches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 50)) // Reduced to 50ms for faster pagination
    }
  }
  
  // Cache the result and return
  const responseData = {
    query,
    type: 'prefix',
    result: {
      prefix,
      checked_tlds: results,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalTLDs,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      },
      tld_stats: {
        total_supported: totalTLDs,
        last_updated: new Date().toISOString()
      }
    }
  }
  
  searchCache.set(cacheKey, responseData, 10 * 60 * 1000) // Increased to 10 minutes for better pagination performance
  return NextResponse.json(responseData)
}

function getEstimatedPrice(tld: string): number {
  // Return realistic pricing based on TLD
  const prices: { [key: string]: number } = {
    '.com': 12,
    '.net': 14,
    '.org': 13,
    '.io': 65,
    '.ai': 90,
    '.dev': 18,
    '.app': 20,
    '.me': 20,
    '.cc': 25,
    '.tv': 35,
    '.tech': 15,
    '.online': 8,
    '.site': 10,
    '.website': 12
  }
  return prices[tld] || 25
}

function getSuffixDescription(suffix: string): string {
  const descriptions: { [key: string]: string } = {
    '.com': 'The most popular and trusted domain extension for businesses and organizations worldwide.',
    '.net': 'Originally intended for network-related organizations, now used for various purposes.',
    '.org': 'Traditionally used by non-profit organizations, foundations, and community groups.',
    '.io': 'Popular among tech startups and developers, originally the country code for British Indian Ocean Territory.',
    '.ai': 'Perfect for artificial intelligence companies and tech startups focusing on AI.',
    '.dev': 'Secured domain extension specifically designed for developers and development projects.'
  }
  return descriptions[suffix] || `${suffix} is a domain extension suitable for various purposes.`
}

function getSuffixCategory(suffix: string): string {
  const categories: { [key: string]: string } = {
    '.com': 'Generic',
    '.net': 'Generic', 
    '.org': 'Generic',
    '.io': 'Tech',
    '.ai': 'Tech',
    '.dev': 'Tech',
    '.app': 'Tech',
    '.tech': 'Tech'
  }
  return categories[suffix] || 'Generic'
}

function getSuffixPopularity(suffix: string): number {
  const popularity: { [key: string]: number } = {
    '.com': 95,
    '.net': 75,
    '.org': 70,
    '.io': 85,
    '.ai': 80,
    '.dev': 78
  }
  return popularity[suffix] || 50
}