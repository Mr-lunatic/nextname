// Simple cache management system for Next.js
// This simulates Redis-like functionality using in-memory cache

interface CacheEntry {
  data: any
  timestamp: number
  expiry: number
  hits: number
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry>()
  private readonly maxSize = 1000
  private readonly stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  }

  set(key: string, data: any, ttlMs: number = 15 * 60 * 1000): void {
    // Evict expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictExpired()
      
      // If still full, evict LRU entries
      if (this.cache.size >= this.maxSize) {
        this.evictLRU()
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs,
      hits: 0
    })

    this.stats.sets++
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    entry.hits++
    this.stats.hits++
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.resetStats()
  }

  private evictExpired(): void {
    const now = Date.now()
    let evicted = 0

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiry) {
        this.cache.delete(key)
        evicted++
      }
    }

    this.stats.evictions += evicted
  }

  private evictLRU(): void {
    // Evict 10% of least recently used entries
    const entries = Array.from(this.cache.entries())
    const toEvict = Math.floor(entries.length * 0.1)
    
    // Sort by hits (ascending) and timestamp (ascending)
    entries.sort((a, b) => {
      if (a[1].hits === b[1].hits) {
        return a[1].timestamp - b[1].timestamp
      }
      return a[1].hits - b[1].hits
    })

    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0])
      this.stats.evictions++
    }
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100),
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }

  private resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.sets = 0
    this.stats.evictions = 0
  }

  // Get cache usage information
  getInfo() {
    return {
      ...this.getStats(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  private estimateMemoryUsage(): string {
    const entries = Array.from(this.cache.values())
    const avgEntrySize = 1024 // Rough estimate in bytes
    const totalBytes = entries.length * avgEntrySize
    
    if (totalBytes < 1024) {
      return `${totalBytes} B`
    } else if (totalBytes < 1024 * 1024) {
      return `${Math.round(totalBytes / 1024)} KB`
    } else {
      return `${Math.round(totalBytes / (1024 * 1024))} MB`
    }
  }
}

// Global cache instances
export const domainCache = new AdvancedCache()
export const searchCache = new AdvancedCache()
export const tldCache = new AdvancedCache()

// Cache keys generator
export const CacheKeys = {
  domain: (domain: string) => `domain:${domain.toLowerCase()}`,
  search: (query: string, type: string, page: number = 1) => `search:${query}:${type}:${page}`,
  tldList: () => 'tlds:list',
  rdapServers: (tld: string) => `rdap:${tld}`,
  priceData: (tld: string) => `price:${tld}`,
  popularDomains: () => 'popular:domains',
  stats: () => 'cache:stats'
}

// Cache warming functions
export async function warmupCache() {
  console.log('🔥 Starting cache warmup...')
  
  // Warm up TLD list
  try {
    const response = await fetch('/api/tlds')
    if (response.ok) {
      const data = await response.json()
      tldCache.set(CacheKeys.tldList(), data, 24 * 60 * 60 * 1000) // 24 hours
      console.log('✅ TLD cache warmed up')
    }
  } catch (error) {
    console.error('❌ TLD cache warmup failed:', error)
  }

  // Warm up popular domains
  const popularDomains = [
    'google.com', 'facebook.com', 'apple.com', 'microsoft.com',
    'amazon.com', 'netflix.com', 'youtube.com', 'twitter.com'
  ]

  for (const domain of popularDomains) {
    try {
      const response = await fetch(`/api/domain/${domain}`)
      if (response.ok) {
        const data = await response.json()
        domainCache.set(CacheKeys.domain(domain), data, 30 * 60 * 1000) // 30 minutes
      }
    } catch (error) {
      console.log(`Cache warmup failed for ${domain}:`, error)
    }
  }

  console.log('✅ Cache warmup completed')
}

// Cache monitoring
export function getCacheStats() {
  return {
    domain: domainCache.getStats(),
    search: searchCache.getStats(),
    tld: tldCache.getStats()
  }
}

// Cache maintenance - run periodically
export function maintainCache() {
  // This would normally be called by a background job
  const stats = getCacheStats()
  
  console.log('🔧 Cache maintenance:', {
    domain: `${stats.domain.size} entries, ${stats.domain.hitRate}% hit rate`,
    search: `${stats.search.size} entries, ${stats.search.hitRate}% hit rate`,
    tld: `${stats.tld.size} entries, ${stats.tld.hitRate}% hit rate`
  })
}

export default AdvancedCache