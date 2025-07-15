"use client"

import { useEffect, useState } from 'react'

interface PreFetchCacheEntry {
  data: any
  timestamp: number
  expiry: number
}

class PreFetchCache {
  private cache = new Map<string, PreFetchCacheEntry>()
  private readonly maxSize = 100
  private readonly defaultTTL = 15 * 60 * 1000 // 15 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL) {
    // Remove expired entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }

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

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiry) {
        this.cache.delete(key)
      }
    }
  }

  clear() {
    this.cache.clear()
  }
}

// Global cache instance
const preFetchCache = new PreFetchCache()

// Hot prefixes for popular domain searches
const HOT_PREFIXES = [
  'api', 'app', 'web', 'blog', 'shop', 'mail', 'www', 'dev', 'test', 'admin',
  'home', 'news', 'work', 'team', 'cloud', 'data', 'code', 'tech', 'ai', 'chat'
]

// Popular TLDs for prefetching
const HOT_TLDS = ['.com', '.net', '.org', '.io', '.ai', '.dev', '.app']

export function usePreFetch() {
  const [isPreFetching, setIsPreFetching] = useState(false)

  // Prefetch popular domain combinations
  const preFetchHotDomains = async () => {
    if (isPreFetching) return
    setIsPreFetching(true)

    try {
      // Limit concurrent requests
      const batchSize = 3
      const combinations = []

      // Generate hot combinations (limit to top ones)
      for (const prefix of HOT_PREFIXES.slice(0, 5)) {
        for (const tld of HOT_TLDS.slice(0, 3)) {
          combinations.push(`${prefix}${tld}`)
        }
      }

      // Process in batches
      for (let i = 0; i < combinations.length; i += batchSize) {
        const batch = combinations.slice(i, i + batchSize)
        
        await Promise.allSettled(
          batch.map(async (domain) => {
            const cacheKey = `domain:${domain}`
            
            if (preFetchCache.has(cacheKey)) return
            
            try {
              const response = await fetch(`/api/domain/${domain}`)
              if (response.ok) {
                const data = await response.json()
                preFetchCache.set(cacheKey, data)
              }
            } catch (error) {
              console.log(`Prefetch failed for ${domain}:`, error)
            }
          })
        )

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } finally {
      setIsPreFetching(false)
    }
  }

  // Prefetch TLD list
  const preFetchTldList = async () => {
    const cacheKey = 'tlds:list'
    
    if (preFetchCache.has(cacheKey)) return
    
    try {
      const response = await fetch('/api/tlds')
      if (response.ok) {
        const data = await response.json()
        preFetchCache.set(cacheKey, data, 24 * 60 * 60 * 1000) // 24 hours
      }
    } catch (error) {
      console.log('TLD prefetch failed:', error)
    }
  }

  // Get cached data
  const getCachedData = (key: string) => {
    return preFetchCache.get(key)
  }

  // Cache search results
  const cacheSearchResult = (query: string, type: string, data: any) => {
    const cacheKey = `search:${query}:${type}`
    preFetchCache.set(cacheKey, data, 10 * 60 * 1000) // 10 minutes
  }

  // Get cached search results
  const getCachedSearchResult = (query: string, type: string) => {
    const cacheKey = `search:${query}:${type}`
    return preFetchCache.get(cacheKey)
  }

  return {
    preFetchHotDomains,
    preFetchTldList,
    getCachedData,
    cacheSearchResult,
    getCachedSearchResult,
    isPreFetching,
    cache: preFetchCache
  }
}

// Local storage utilities
export function useLocalStorage() {
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && !!window.localStorage)
  }, [])

  const setItem = (key: string, value: any) => {
    if (!isSupported) return

    try {
      const item = {
        value,
        timestamp: Date.now()
      }
      localStorage.setItem(`nextname_${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn('localStorage setItem failed:', error)
    }
  }

  const getItem = (key: string, maxAge: number = 24 * 60 * 60 * 1000) => {
    if (!isSupported) return null

    try {
      const itemStr = localStorage.getItem(`nextname_${key}`)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      const age = Date.now() - item.timestamp

      if (age > maxAge) {
        localStorage.removeItem(`nextname_${key}`)
        return null
      }

      return item.value
    } catch (error) {
      console.warn('localStorage getItem failed:', error)
      return null
    }
  }

  const removeItem = (key: string) => {
    if (!isSupported) return
    localStorage.removeItem(`nextname_${key}`)
  }

  const clear = () => {
    if (!isSupported) return
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('nextname_')) {
        localStorage.removeItem(key)
      }
    })
  }

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    isSupported
  }
}

// Search history management
export function useSearchHistory() {
  const { setItem, getItem } = useLocalStorage()
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const savedHistory = getItem('search_history') || []
    setHistory(savedHistory.slice(0, 10)) // Keep only last 10 searches
  }, [])

  const addToHistory = (query: string) => {
    if (!query.trim()) return

    const newHistory = [query, ...history.filter(item => item !== query)].slice(0, 10)
    setHistory(newHistory)
    setItem('search_history', newHistory)
  }

  const clearHistory = () => {
    setHistory([])
    setItem('search_history', [])
  }

  return {
    history,
    addToHistory,
    clearHistory
  }
}

// User preferences
export function useUserPreferences() {
  const { setItem, getItem } = useLocalStorage()
  
  const getPreference = (key: string, defaultValue: any = null) => {
    return getItem(`pref_${key}`, 7 * 24 * 60 * 60 * 1000) || defaultValue // 7 days
  }

  const setPreference = (key: string, value: any) => {
    setItem(`pref_${key}`, value)
  }

  return {
    getPreference,
    setPreference
  }
}