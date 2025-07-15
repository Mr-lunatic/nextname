import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, domainCache, searchCache, tldCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats()
    
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
    
    const cacheDetails = {
      domain: {
        ...stats.domain,
        info: domainCache.getInfo()
      },
      search: {
        ...stats.search,
        info: searchCache.getInfo()
      },
      tld: {
        ...stats.tld,
        info: tldCache.getInfo()
      }
    }
    
    const performance = {
      totalCacheSize: stats.domain.size + stats.search.size + stats.tld.size,
      averageHitRate: Math.round(
        (stats.domain.hitRate + stats.search.hitRate + stats.tld.hitRate) / 3
      ),
      totalHits: stats.domain.hits + stats.search.hits + stats.tld.hits,
      totalMisses: stats.domain.misses + stats.search.misses + stats.tld.misses
    }
    
    return NextResponse.json({
      system: systemInfo,
      cache: cacheDetails,
      performance,
      recommendations: generateRecommendations(stats)
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cache stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateRecommendations(stats: any): string[] {
  const recommendations: string[] = []
  
  // Check hit rates
  if (stats.domain.hitRate < 50) {
    recommendations.push('Domain cache hit rate is low - consider increasing TTL or pre-warming popular domains')
  }
  
  if (stats.search.hitRate < 30) {
    recommendations.push('Search cache hit rate is low - consider caching search results longer')
  }
  
  if (stats.tld.hitRate < 80) {
    recommendations.push('TLD cache should have higher hit rate - check cache warming strategy')
  }
  
  // Check cache sizes
  if (stats.domain.size > 800) {
    recommendations.push('Domain cache is getting large - consider implementing more aggressive cleanup')
  }
  
  if (stats.search.size > 500) {
    recommendations.push('Search cache size is high - review search pattern caching strategy')
  }
  
  // Performance recommendations
  const totalRequests = stats.domain.hits + stats.domain.misses + stats.search.hits + stats.search.misses
  if (totalRequests > 1000) {
    recommendations.push('High request volume detected - consider implementing distributed caching')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal - continue monitoring')
  }
  
  return recommendations
}