import { NextRequest, NextResponse } from 'next/server'
import { PageCache, initPageCache, getPageCache } from '@/lib/page-cache'

export const runtime = 'edge'

// Cache management API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const key = searchParams.get('key')
  const pattern = searchParams.get('pattern')

  try {
    // Initialize cache if needed
    const env = process.env as any
    const kvNamespace = env.PRICING_CACHE || env.PRICINGCACHE
    
    if (!kvNamespace) {
      return NextResponse.json({ error: 'KV namespace not available' }, { status: 500 })
    }

    let pageCache = getPageCache()
    if (!pageCache) {
      pageCache = initPageCache(kvNamespace)
    }

    switch (action) {
      case 'stats':
        return handleGetStats(pageCache)
      
      case 'list':
        return handleListKeys(pageCache, pattern)
      
      case 'get':
        if (!key) {
          return NextResponse.json({ error: 'Key parameter required' }, { status: 400 })
        }
        return handleGetPage(pageCache, key)
      
      case 'check':
        if (!key) {
          return NextResponse.json({ error: 'Key parameter required' }, { status: 400 })
        }
        return handleCheckPage(pageCache, key)
      
      default:
        return handleGetStats(pageCache)
    }
  } catch (error) {
    console.error('Cache management API error:', error)
    return NextResponse.json(
      { error: 'Cache management failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    const env = process.env as any
    const kvNamespace = env.PRICING_CACHE || env.PRICINGCACHE
    
    if (!kvNamespace) {
      return NextResponse.json({ error: 'KV namespace not available' }, { status: 500 })
    }

    let pageCache = getPageCache()
    if (!pageCache) {
      pageCache = initPageCache(kvNamespace)
    }

    const body = await request.json()

    switch (action) {
      case 'invalidate':
        return handleInvalidate(pageCache, body)
      
      case 'refresh':
        return handleRefresh(pageCache, body)
      
      case 'preload':
        return handlePreload(pageCache, body)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Cache management POST error:', error)
    return NextResponse.json(
      { error: 'Cache operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const pattern = searchParams.get('pattern')

  try {
    const env = process.env as any
    const kvNamespace = env.PRICING_CACHE || env.PRICINGCACHE
    
    if (!kvNamespace) {
      return NextResponse.json({ error: 'KV namespace not available' }, { status: 500 })
    }

    let pageCache = getPageCache()
    if (!pageCache) {
      pageCache = initPageCache(kvNamespace)
    }

    if (pattern) {
      const deletedCount = await pageCache.invalidatePattern(pattern)
      return NextResponse.json({ 
        success: true, 
        message: `Deleted ${deletedCount} pages matching pattern: ${pattern}`,
        deletedCount 
      })
    }

    if (key) {
      const success = await pageCache.deletePage(key)
      return NextResponse.json({ 
        success, 
        message: success ? `Deleted page: ${key}` : `Failed to delete page: ${key}` 
      })
    }

    return NextResponse.json({ error: 'Key or pattern parameter required' }, { status: 400 })
  } catch (error) {
    console.error('Cache DELETE error:', error)
    return NextResponse.json(
      { error: 'Cache deletion failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Handler functions
async function handleGetStats(pageCache: PageCache) {
  const stats = pageCache.getStats()
  const systemInfo = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    cacheEnabled: process.env.ENABLE_PAGE_CACHE !== 'false'
  }

  return NextResponse.json({
    system: systemInfo,
    cache: stats,
    recommendations: generateCacheRecommendations(stats)
  })
}

async function handleListKeys(pageCache: PageCache, pattern?: string | null) {
  // Note: This is a simplified implementation
  // In a real scenario, you might want to maintain a separate index of cached keys
  return NextResponse.json({
    message: 'Key listing not fully implemented yet',
    pattern: pattern || 'all',
    note: 'Consider implementing a separate key index for better performance'
  })
}

async function handleGetPage(pageCache: PageCache, key: string) {
  const cachedHtml = await pageCache.getPage(key)
  const metadata = await pageCache.getPageMetadata(key)
  
  if (!cachedHtml) {
    return NextResponse.json({ error: 'Page not found in cache' }, { status: 404 })
  }

  return NextResponse.json({
    key,
    cached: true,
    metadata,
    htmlLength: cachedHtml.length,
    preview: cachedHtml.substring(0, 200) + '...'
  })
}

async function handleCheckPage(pageCache: PageCache, key: string) {
  const exists = await pageCache.hasPage(key)
  const metadata = exists ? await pageCache.getPageMetadata(key) : null
  
  return NextResponse.json({
    key,
    exists,
    metadata
  })
}

async function handleInvalidate(pageCache: PageCache, body: any) {
  const { keys, patterns } = body
  let results = {
    deletedKeys: 0,
    deletedPatterns: 0,
    errors: [] as string[]
  }

  // Delete specific keys
  if (keys && Array.isArray(keys)) {
    for (const key of keys) {
      try {
        const success = await pageCache.deletePage(key)
        if (success) results.deletedKeys++
      } catch (error) {
        results.errors.push(`Failed to delete key ${key}: ${error}`)
      }
    }
  }

  // Delete patterns
  if (patterns && Array.isArray(patterns)) {
    for (const pattern of patterns) {
      try {
        const deletedCount = await pageCache.invalidatePattern(pattern)
        results.deletedPatterns += deletedCount
      } catch (error) {
        results.errors.push(`Failed to delete pattern ${pattern}: ${error}`)
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Invalidated ${results.deletedKeys} keys and ${results.deletedPatterns} patterns`,
    results
  })
}

async function handleRefresh(pageCache: PageCache, body: any) {
  const { key, ttl } = body
  
  if (!key) {
    return NextResponse.json({ error: 'Key parameter required' }, { status: 400 })
  }

  const success = await pageCache.refreshPage(key, ttl)
  
  return NextResponse.json({
    success,
    message: success ? `Refreshed cache for key: ${key}` : `Failed to refresh cache for key: ${key}`,
    key,
    newTTL: ttl
  })
}

async function handlePreload(pageCache: PageCache, body: any) {
  const { domains } = body
  
  if (!domains || !Array.isArray(domains)) {
    return NextResponse.json({ error: 'Domains array required' }, { status: 400 })
  }

  const results = {
    preloaded: 0,
    errors: []
  }

  for (const domain of domains) {
    try {
      // Trigger cache generation for the domain
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cached-domain/${encodeURIComponent(domain)}`)
      
      if (response.ok) {
        results.preloaded++
        console.log(`✅ Preloaded cache for domain: ${domain}`)
      } else {
        results.errors.push(`Failed to preload ${domain}: ${response.status}`)
      }
    } catch (error) {
      results.errors.push(`Failed to preload ${domain}: ${error}`)
    }
  }

  return NextResponse.json({
    success: true,
    message: `Preloaded ${results.preloaded} domains`,
    results
  })
}

function generateCacheRecommendations(stats: any): string[] {
  const recommendations: string[] = []
  
  if (stats.hitRate < 50) {
    recommendations.push('Cache hit rate is low - consider increasing TTL or preloading popular pages')
  }
  
  if (stats.misses > stats.hits * 2) {
    recommendations.push('High cache miss rate - review caching strategy')
  }
  
  if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
    recommendations.push('Cache size is large - consider implementing cleanup policies')
  }
  
  if (stats.sets < 10) {
    recommendations.push('Low cache activity - ensure caching is properly configured')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Cache performance looks good - continue monitoring')
  }
  
  return recommendations
}