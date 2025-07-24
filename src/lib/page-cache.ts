// Page-level HTML caching system for Cloudflare KV
// Designed to cache rendered HTML pages for better performance and SEO

interface CachedPageData {
  html: string
  metadata: {
    title: string
    description: string
    keywords?: string
    lastModified: string
  }
  timestamp: number
  ttl: number
  version: string
  compressed: boolean
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
  totalSize: number
}

export class PageCache {
  private kv: any // KV namespace will be injected
  private defaultTTL: number = 30 * 60 // 30 minutes default
  private maxPageSize: number = 25 * 1024 * 1024 // 25MB KV limit
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    totalSize: 0
  }

  constructor(kvNamespace?: any) {
    this.kv = kvNamespace
  }

  /**
   * Get cached page HTML
   */
  async getPage(key: string): Promise<string | null> {
    if (!this.kv) {
      console.warn('KV namespace not available, skipping page cache')
      return null
    }

    try {
      const cached = await this.kv.get(key, 'json') as CachedPageData | null
      
      if (!cached) {
        this.stats.misses++
        return null
      }

      // Check if cache is expired
      const now = Date.now()
      if (now > cached.timestamp + cached.ttl) {
        this.stats.misses++
        // Delete expired cache entry
        await this.kv.delete(key)
        return null
      }

      this.stats.hits++
      this.updateHitRate()

      // Decompress if needed
      if (cached.compressed) {
        return this.decompress(cached.html)
      }

      return cached.html
    } catch (error) {
      console.error('Error getting cached page:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Cache page HTML with metadata
   */
  async setPage(
    key: string, 
    html: string, 
    metadata: CachedPageData['metadata'],
    ttl?: number
  ): Promise<boolean> {
    if (!this.kv) {
      console.warn('KV namespace not available, skipping page cache')
      return false
    }

    try {
      const cacheTTL = ttl || this.defaultTTL
      const timestamp = Date.now()
      
      // Check if HTML is too large
      let finalHtml = html
      let compressed = false
      
      if (html.length > 1024 * 1024) { // 1MB threshold
        finalHtml = this.compress(html)
        compressed = true
      }

      if (finalHtml.length > this.maxPageSize) {
        console.warn(`Page too large for KV storage: ${finalHtml.length} bytes`)
        return false
      }

      const cacheData: CachedPageData = {
        html: finalHtml,
        metadata: {
          ...metadata,
          lastModified: new Date().toISOString()
        },
        timestamp,
        ttl: cacheTTL * 1000, // Convert to milliseconds
        version: '1.0',
        compressed
      }

      // Store in KV with expiration
      await this.kv.put(key, JSON.stringify(cacheData), {
        expirationTtl: Math.ceil(cacheTTL + 300) // Add 5 minutes buffer
      })

      this.stats.sets++
      this.stats.totalSize += finalHtml.length

      console.log(`✅ Cached page: ${key} (${finalHtml.length} bytes, TTL: ${cacheTTL}s)`)
      return true
    } catch (error) {
      console.error('Error caching page:', error)
      return false
    }
  }

  /**
   * Check if page exists in cache
   */
  async hasPage(key: string): Promise<boolean> {
    if (!this.kv) return false
    
    try {
      const cached = await this.kv.get(key, 'json') as CachedPageData | null
      if (!cached) return false

      // Check expiration
      const now = Date.now()
      return now <= cached.timestamp + cached.ttl
    } catch (error) {
      console.error('Error checking cached page:', error)
      return false
    }
  }

  /**
   * Delete cached page
   */
  async deletePage(key: string): Promise<boolean> {
    if (!this.kv) return false

    try {
      await this.kv.delete(key)
      this.stats.deletes++
      console.log(`🗑️  Deleted cached page: ${key}`)
      return true
    } catch (error) {
      console.error('Error deleting cached page:', error)
      return false
    }
  }

  /**
   * Invalidate pages matching pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.kv) return 0

    try {
      // Note: KV doesn't support pattern matching directly
      // This is a simplified implementation for key patterns
      const keys = await this.listKeys(pattern)
      let deletedCount = 0

      for (const key of keys) {
        if (await this.deletePage(key)) {
          deletedCount++
        }
      }

      console.log(`🧹 Invalidated ${deletedCount} pages matching pattern: ${pattern}`)
      return deletedCount
    } catch (error) {
      console.error('Error invalidating pattern:', error)
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      totalSize: 0
    }
  }

  /**
   * Get cached page metadata only
   */
  async getPageMetadata(key: string): Promise<CachedPageData['metadata'] | null> {
    if (!this.kv) return null

    try {
      const cached = await this.kv.get(key, 'json') as CachedPageData | null
      return cached?.metadata || null
    } catch (error) {
      console.error('Error getting page metadata:', error)
      return null
    }
  }

  /**
   * Update TTL for existing cached page
   */
  async refreshPage(key: string, newTTL?: number): Promise<boolean> {
    if (!this.kv) return false

    try {
      const cached = await this.kv.get(key, 'json') as CachedPageData | null
      if (!cached) return false

      // Update timestamp and TTL
      cached.timestamp = Date.now()
      cached.ttl = (newTTL || this.defaultTTL) * 1000

      await this.kv.put(key, JSON.stringify(cached), {
        expirationTtl: Math.ceil((newTTL || this.defaultTTL) + 300)
      })

      return true
    } catch (error) {
      console.error('Error refreshing page cache:', error)
      return false
    }
  }

  // Private helper methods
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0
  }

  private compress(html: string): string {
    // Simple compression - remove extra whitespace and comments
    return html
      .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .trim()
  }

  private decompress(html: string): string {
    // For now, just return as-is since we're using simple compression
    return html
  }

  private async listKeys(pattern: string): Promise<string[]> {
    // Simplified pattern matching for KV keys
    // In a real implementation, you might maintain a separate index
    try {
      const { keys } = await this.kv.list({ prefix: pattern.replace('*', '') })
      return keys.map((key: any) => key.name)
    } catch (error) {
      console.error('Error listing keys:', error)
      return []
    }
  }
}

// Cache key generators
export const PageCacheKeys = {
  domain: (domain: string) => `html:domain:${domain.toLowerCase()}`,
  search: (query: string, filters?: any) => {
    const filterStr = filters ? `:${JSON.stringify(filters)}` : ''
    return `html:search:${encodeURIComponent(query)}${filterStr}`
  },
  tld: (tld: string) => `html:tld:${tld.toLowerCase()}`,
  homepage: () => 'html:home',
  tldList: () => 'html:tlds'
}

// TTL constants (in seconds)
export const CacheTTL = {
  DOMAIN_PAGE: 30 * 60,      // 30 minutes
  SEARCH_RESULTS: 15 * 60,   // 15 minutes  
  TLD_PAGE: 24 * 60 * 60,    // 24 hours
  HOMEPAGE: 10 * 60,         // 10 minutes
  TLD_LIST: 6 * 60 * 60      // 6 hours
}

// Global page cache instance
let globalPageCache: PageCache | null = null

export function initPageCache(kvNamespace: any): PageCache {
  globalPageCache = new PageCache(kvNamespace)
  return globalPageCache
}

export function getPageCache(): PageCache | null {
  return globalPageCache
}

// Utility functions for common caching patterns
export async function getCachedOrGenerate<T>(
  key: string,
  generator: () => Promise<T>,
  serializer: (data: T) => string,
  deserializer: (html: string) => T,
  ttl?: number
): Promise<T> {
  const cache = getPageCache()
  if (!cache) {
    return await generator()
  }

  // Try to get from cache
  const cached = await cache.getPage(key)
  if (cached) {
    try {
      return deserializer(cached)
    } catch (error) {
      console.error('Error deserializing cached data:', error)
    }
  }

  // Generate fresh data
  const freshData = await generator()
  const html = serializer(freshData)
  
  // Cache the result (don't await to avoid blocking)
  const metadata = {
    title: 'Generated Page',
    description: 'Auto-generated cached page',
    lastModified: new Date().toISOString()
  }
  
  cache.setPage(key, html, metadata, ttl).catch(error => {
    console.error('Error caching generated page:', error)
  })

  return freshData
}