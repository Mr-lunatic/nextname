// Cache invalidation system for automatic cache management
// Handles cache cleanup when underlying data changes

import { PageCache, PageCacheKeys, getPageCache } from './page-cache'

export interface InvalidationRule {
  trigger: string
  patterns: string[]
  keys?: string[]
  delay?: number // Delay in seconds before invalidation
}

export interface DataSourceUpdateEvent {
  type: string
  tld?: string
  domain?: string
}

export interface DomainQueryEvent {
  domain: string
  frequency?: number
}

export class CacheInvalidator {
  private pageCache: PageCache | null
  private rules: InvalidationRule[] = []

  constructor() {
    this.pageCache = getPageCache()
    this.initializeRules()
  }

  /**
   * Initialize default invalidation rules
   */
  private initializeRules() {
    this.rules = [
      {
        trigger: 'domain_data_update',
        patterns: ['html:domain:*'],
        delay: 0
      },
      {
        trigger: 'price_data_update',
        patterns: ['html:domain:*', 'html:search:*'],
        delay: 300 // 5 minutes delay to avoid frequent invalidation
      },
      {
        trigger: 'tld_data_update', 
        patterns: ['html:tld:*', 'html:tlds'],
        delay: 0
      },
      {
        trigger: 'whois_data_update',
        patterns: [], // Will be filled with specific domain keys
        delay: 0
      }
    ]
  }

  /**
   * Add a custom invalidation rule
   */
  addRule(rule: InvalidationRule) {
    this.rules.push(rule)
  }

  /**
   * Remove invalidation rules by trigger
   */
  removeRule(trigger: string) {
    this.rules = this.rules.filter(rule => rule.trigger !== trigger)
  }

  /**
   * Trigger cache invalidation based on event
   */
  async trigger(event: string, data?: any): Promise<boolean> {
    if (!this.pageCache) {
      console.warn('Page cache not available for invalidation')
      return false
    }

    console.log(`🧹 Cache invalidation triggered: ${event}`, data)

    const matchingRules = this.rules.filter(rule => rule.trigger === event)
    
    if (matchingRules.length === 0) {
      console.log(`No invalidation rules found for event: ${event}`)
      return false
    }

    let totalInvalidated = 0

    for (const rule of matchingRules) {
      try {
        if (rule.delay && rule.delay > 0) {
          // Schedule delayed invalidation
          setTimeout(async () => {
            await this.executeRule(rule, data)
          }, rule.delay * 1000)
          console.log(`⏰ Scheduled delayed invalidation for ${rule.trigger} in ${rule.delay}s`)
        } else {
          // Immediate invalidation
          const count = await this.executeRule(rule, data)
          totalInvalidated += count
        }
      } catch (error) {
        console.error(`Error executing invalidation rule for ${rule.trigger}:`, error)
      }
    }

    console.log(`✅ Invalidated ${totalInvalidated} cache entries for event: ${event}`)
    return totalInvalidated > 0
  }

  /**
   * Execute a specific invalidation rule
   */
  private async executeRule(rule: InvalidationRule, data?: any): Promise<number> {
    if (!this.pageCache) return 0

    let invalidatedCount = 0

    // Invalidate specific keys
    if (rule.keys) {
      for (const key of rule.keys) {
        const processedKey = this.processKeyTemplate(key, data)
        if (await this.pageCache.deletePage(processedKey)) {
          invalidatedCount++
        }
      }
    }

    // Invalidate patterns
    if (rule.patterns) {
      for (const pattern of rule.patterns) {
        const processedPattern = this.processKeyTemplate(pattern, data)
        const count = await this.pageCache.invalidatePattern(processedPattern)
        invalidatedCount += count
      }
    }

    return invalidatedCount
  }

  /**
   * Process key template with data substitution
   */
  private processKeyTemplate(template: string, data?: any): string {
    if (!data) return template

    let processed = template

    // Replace common placeholders
    if (data.domain) {
      processed = processed.replace('{domain}', data.domain.toLowerCase())
    }
    if (data.tld) {
      processed = processed.replace('{tld}', data.tld.toLowerCase())
    }
    if (data.query) {
      processed = processed.replace('{query}', encodeURIComponent(data.query))
    }

    return processed
  }

  /**
   * Get current invalidation rules
   */
  getRules(): InvalidationRule[] {
    return [...this.rules]
  }

  /**
   * Clear all cached pages (use with caution)
   */
  async clearAll(): Promise<number> {
    if (!this.pageCache) return 0

    return await this.pageCache.invalidatePattern('html:*')
  }

  /**
   * Invalidate domain-specific cache
   */
  async invalidateDomain(domain: string): Promise<boolean> {
    return await this.trigger('domain_data_update', { domain })
  }

  /**
   * Invalidate TLD-specific cache
   */
  async invalidateTLD(tld: string): Promise<boolean> {
    return await this.trigger('tld_data_update', { tld })
  }

  /**
   * Invalidate search-related cache
   */
  async invalidateSearch(query?: string): Promise<boolean> {
    return await this.trigger('search_data_update', { query })
  }

  /**
   * Invalidate price-related cache
   */
  async invalidatePricing(tld?: string): Promise<boolean> {
    return await this.trigger('price_data_update', { tld })
  }
}

// Event listeners for automatic invalidation
export class AutoInvalidationManager {
  private invalidator: CacheInvalidator
  private listeners: Map<string, Set<Function>> = new Map()

  constructor() {
    this.invalidator = new CacheInvalidator()
    this.setupEventListeners()
  }

  /**
   * Setup automatic event listeners
   */
  private setupEventListeners() {
    // Listen for data source changes
    this.on('data_source_update', async (data: DataSourceUpdateEvent) => {
      if (data.type === 'pricing') {
        await this.invalidator.invalidatePricing(data.tld)
      }
    })

    // Listen for domain queries that might affect cache
    this.on('domain_query', async (data: DomainQueryEvent) => {
      // If this is a frequently queried domain, preload its cache
      if (data.frequency && data.frequency > 10) {
        await this.preloadDomainCache(data.domain)
      }
    })
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  /**
   * Emit event to trigger listeners
   */
  async emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          await callback(data)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
        }
      }
    }
  }

  /**
   * Preload cache for a domain
   */
  private async preloadDomainCache(domain: string) {
    try {
      const response = await fetch(`/api/cached-domain/${encodeURIComponent(domain)}`)
      if (response.ok) {
        console.log(`✅ Preloaded cache for popular domain: ${domain}`)
      }
    } catch (error) {
      console.error(`Failed to preload cache for ${domain}:`, error)
    }
  }

  /**
   * Get the invalidator instance
   */
  getInvalidator(): CacheInvalidator {
    return this.invalidator
  }
}

// Global instances
let globalInvalidator: CacheInvalidator | null = null
let globalAutoManager: AutoInvalidationManager | null = null

export function getInvalidator(): CacheInvalidator {
  if (!globalInvalidator) {
    globalInvalidator = new CacheInvalidator()
  }
  return globalInvalidator
}

export function getAutoInvalidationManager(): AutoInvalidationManager {
  if (!globalAutoManager) {
    globalAutoManager = new AutoInvalidationManager()
  }
  return globalAutoManager
}

// Utility functions for common invalidation scenarios
export async function invalidateOnDataUpdate(updateType: string, data: any) {
  const invalidator = getInvalidator()
  
  switch (updateType) {
    case 'pricing':
      await invalidator.invalidatePricing(data.tld)
      break
      
    case 'domain':
      await invalidator.invalidateDomain(data.domain)
      break
      
    case 'tld':
      await invalidator.invalidateTLD(data.tld)
      break
      
    default:
      console.log(`Unknown update type: ${updateType}`)
  }
}

// Hook for Next.js API routes to trigger invalidation
export function useInvalidationHook() {
  return {
    invalidateOnUpdate: invalidateOnDataUpdate,
    invalidator: getInvalidator(),
    autoManager: getAutoInvalidationManager()
  }
}