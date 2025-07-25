import { NextRequest, NextResponse } from 'next/server'
import { PageCache, PageCacheKeys, initPageCache } from '@/lib/page-cache'

// Note: Middleware automatically runs on Edge Runtime in Next.js 13+
// No need to explicitly declare runtime for middleware

export const config = {
  matcher: [
    // Match domain pages
    '/domain/:domain*',
    // Skip API routes and static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 暂时禁用复杂的缓存逻辑，避免Edge Runtime兼容性问题
  // TODO: 重新启用页面缓存功能

  // 简单的域名页面处理
  if (pathname.startsWith('/domain/')) {
    // 提取域名并验证
    const domainMatch = pathname.match(/^\/domain\/([^\/]+)/)
    if (domainMatch) {
      const domain = decodeURIComponent(domainMatch[1]).toLowerCase().trim()

      // 基本验证
      if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
        return NextResponse.next()
      }

      console.log(`🔍 Processing domain page: ${domain}`)
    }
  }

  return NextResponse.next()
}

// 暂时注释掉复杂的缓存逻辑，避免Edge Runtime兼容性问题
// async function handleDomainPageCache(request: NextRequest) {
//   const { pathname } = request.nextUrl
//
//   // Extract domain from path
//   const domainMatch = pathname.match(/^\/domain\/([^\/]+)/)
//   if (!domainMatch) {
//     return NextResponse.next()
//   }
//
//   const domain = decodeURIComponent(domainMatch[1]).toLowerCase().trim()
//
//   // Validate domain format
//   if (!domain || !domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
//     return NextResponse.next()
//   }

//   try {
//     // Initialize page cache
//     const env = process.env as any
//     const kvNamespace = env.PRICING_CACHE || env.PRICINGCACHE
//
//     // Check if caching is enabled
//     const cacheEnabled = env.ENABLE_PAGE_CACHE !== 'false'
//
//     if (!cacheEnabled || !kvNamespace) {
//       console.log('Page caching disabled or KV not available')
//       return NextResponse.next()
//     }

//     const pageCache = initPageCache(kvNamespace)
//     const cacheKey = PageCacheKeys.domain(domain)

//     console.log(`🔍 Middleware checking cache for domain: ${domain}`)

//     // Try to get cached page
//     const cachedHtml = await pageCache.getPage(cacheKey)
//
//     if (cachedHtml) {
//       console.log(`✅ Middleware cache HIT for domain: ${domain}`)
//
//       return new Response(cachedHtml, {
//         status: 200,
//         headers: {
//           'Content-Type': 'text/html; charset=utf-8',
//           'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
//           'X-Cache': 'HIT-MIDDLEWARE',
//           'X-Cache-Key': cacheKey,
//           'X-Served-By': 'PageCache-Middleware'
//         }
//       })
//     }

//     console.log(`❌ Middleware cache MISS for domain: ${domain}`)
//
//     // Cache miss - redirect to API route that handles caching
//     const apiUrl = new URL(`/api/cached-domain/${encodeURIComponent(domain)}`, request.url)
//
//     // Forward the request to our caching API
//     return NextResponse.rewrite(apiUrl)

//   } catch (error) {
//     console.error('Middleware error:', error)
//     // Fall back to normal processing
//     return NextResponse.next()
//   }
// }

// Helper function to check if a domain is valid
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}