import { NextRequest, NextResponse } from 'next/server'
import { getPageCache } from '@/lib/page-cache'
import { getCacheStats as getApiCacheStats } from '@/lib/cache'

export const runtime = 'edge'

// Enhanced cache statistics API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('range') || '1h' // 1h, 24h, 7d, 30d
  const detailed = searchParams.get('detailed') === 'true'

  try {
    // Get page cache stats
    const pageCache = getPageCache()
    const pageCacheStats = pageCache ? pageCache.getStats() : null

    // Get API cache stats (existing functionality)
    const apiCacheStats = getApiCacheStats()

    // Calculate combined metrics
    const combinedStats = calculateCombinedStats(pageCacheStats, apiCacheStats)

    // Get system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 0,
      environment: process.env.NODE_ENV || 'development',
      cacheEnabled: {
        pageCache: process.env.ENABLE_PAGE_CACHE !== 'false',
        apiCache: true
      }
    }

    const response = {
      system: systemInfo,
      pageCache: pageCacheStats,
      apiCache: apiCacheStats,
      combined: combinedStats,
      recommendations: generatePerformanceRecommendations(combinedStats),
      ...(detailed && {
        detailed: await getDetailedStats(timeRange)
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error getting enhanced cache stats:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get cache statistics', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'record_hit':
        return handleRecordHit(body)
      
      case 'record_miss':
        return handleRecordMiss(body)
      
      case 'reset_stats':
        return handleResetStats()
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in cache stats POST:', error)
    return NextResponse.json(
      { error: 'Operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Calculate combined statistics from page and API caches
function calculateCombinedStats(pageCacheStats: any, apiCacheStats: any) {
  if (!pageCacheStats && !apiCacheStats) {
    return null
  }

  const pageStats = pageCacheStats || { hits: 0, misses: 0, hitRate: 0, totalSize: 0 }
  const apiStatsTotal = apiCacheStats ? 
    Object.values(apiCacheStats).reduce((acc: any, cache: any) => ({
      hits: acc.hits + (cache.hits || 0),
      misses: acc.misses + (cache.misses || 0),
      size: acc.size + (cache.size || 0)
    }), { hits: 0, misses: 0, size: 0 }) : 
    { hits: 0, misses: 0, size: 0 }

  const totalHits = pageStats.hits + apiStatsTotal.hits
  const totalMisses = pageStats.misses + apiStatsTotal.misses
  const totalRequests = totalHits + totalMisses
  const combinedHitRate = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) : 0

  return {
    totalHits,
    totalMisses,
    totalRequests,
    combinedHitRate,
    pageCache: {
      hits: pageStats.hits,
      misses: pageStats.misses,
      hitRate: pageStats.hitRate,
      totalSize: pageStats.totalSize
    },
    apiCache: {
      hits: apiStatsTotal.hits,
      misses: apiStatsTotal.misses,
      totalSize: apiStatsTotal.size
    },
    efficiency: calculateCacheEfficiency(totalHits, totalMisses, pageStats.totalSize + apiStatsTotal.size)
  }
}

// Calculate cache efficiency score
function calculateCacheEfficiency(hits: number, misses: number, totalSize: number): number {
  const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0
  const sizeScore = Math.min(1, 1 - (totalSize / (100 * 1024 * 1024))) // Penalty for large cache size
  const requestScore = Math.min(1, (hits + misses) / 1000) // Bonus for high usage
  
  return Math.round((hitRate * 0.7 + sizeScore * 0.2 + requestScore * 0.1) * 100)
}

// Generate performance recommendations
function generatePerformanceRecommendations(stats: any): string[] {
  const recommendations: string[] = []
  
  if (!stats) {
    recommendations.push('No cache statistics available - ensure caching is properly configured')
    return recommendations
  }

  // Hit rate recommendations
  if (stats.combinedHitRate < 60) {
    recommendations.push('Overall cache hit rate is low - consider increasing TTL values')
  } else if (stats.combinedHitRate > 90) {
    recommendations.push('Excellent cache hit rate - current configuration is optimal')
  }

  // Page cache specific
  if (stats.pageCache.hitRate < 50) {
    recommendations.push('Page cache hit rate is low - consider preloading popular pages')
  }

  // API cache specific  
  if (stats.apiCache.hits < stats.pageCache.hits) {
    recommendations.push('API cache usage is lower than page cache - review API caching strategy')
  }

  // Size recommendations
  const totalSize = stats.pageCache.totalSize + stats.apiCache.totalSize
  if (totalSize > 100 * 1024 * 1024) { // 100MB
    recommendations.push('Total cache size is large - consider implementing cleanup policies')
  }

  // Efficiency recommendations
  if (stats.efficiency < 70) {
    recommendations.push('Cache efficiency is below optimal - review cache configuration')
  }

  // Usage patterns
  if (stats.totalRequests < 100) {
    recommendations.push('Low cache usage detected - ensure cache is being utilized properly')
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is excellent - continue current configuration')
  }

  return recommendations
}

// Get detailed statistics (placeholder for future implementation)
async function getDetailedStats(timeRange: string) {
  // This would typically query a time-series database or logs
  // For now, return mock data structure
  return {
    timeRange,
    dataPoints: [],
    note: 'Detailed statistics tracking not yet implemented - consider adding metrics storage'
  }
}

// Handle recording cache hits
async function handleRecordHit(body: any) {
  const { cacheType, key, responseTime } = body
  
  // In a production system, you might want to store these metrics
  // in a time-series database like InfluxDB or CloudWatch
  console.log(`📊 Cache HIT recorded: ${cacheType}:${key} (${responseTime}ms)`)
  
  return NextResponse.json({ 
    success: true, 
    message: 'Cache hit recorded',
    type: cacheType,
    key,
    responseTime
  })
}

// Handle recording cache misses
async function handleRecordMiss(body: any) {
  const { cacheType, key, responseTime, reason } = body
  
  console.log(`📊 Cache MISS recorded: ${cacheType}:${key} (${responseTime}ms) - ${reason}`)
  
  return NextResponse.json({ 
    success: true, 
    message: 'Cache miss recorded',
    type: cacheType,
    key,
    responseTime,
    reason
  })
}

// Handle resetting statistics
async function handleResetStats() {
  try {
    const pageCache = getPageCache()
    if (pageCache) {
      pageCache.resetStats()
    }
    
    // Note: API cache stats reset would need to be implemented in cache.ts
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache statistics reset successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Utility function to format cache statistics for display
function formatCacheStats(stats: any) {
  if (!stats) return 'No statistics available'
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  return {
    hitRate: `${stats.hitRate}%`,
    totalRequests: stats.hits + stats.misses,
    cacheSize: formatSize(stats.totalSize || 0),
    efficiency: stats.efficiency ? `${stats.efficiency}%` : 'N/A'
  }
}