"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { usePreFetch, useSearchHistory, useUserPreferences } from '@/hooks/usePreFetch'
import { Search, Globe, Hash, DollarSign, Clock, Star } from 'lucide-react'
import Fuse from 'fuse.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SearchType = 'auto' | 'domain' | 'prefix' | 'suffix'

interface SearchSuggestion {
  type: 'domain' | 'tld' | 'keyword' | 'recent'
  value: string
  label: string
  description?: string
  popular?: boolean
}

interface EnhancedSmartSearchV2Props {
  onSearch: (query: string, type: SearchType) => void
  placeholder?: string
}

const popularTLDs = [
  { value: '.com', label: '.com', description: 'Commercial', popular: true },
  { value: '.net', label: '.net', description: 'Network', popular: true },
  { value: '.org', label: '.org', description: 'Organization', popular: true },
  { value: '.io', label: '.io', description: 'Technology', popular: true },
  { value: '.ai', label: '.ai', description: 'Artificial Intelligence', popular: true },
  { value: '.dev', label: '.dev', description: 'Developers', popular: true },
  { value: '.app', label: '.app', description: 'Applications', popular: false },
  { value: '.web', label: '.web', description: 'Website', popular: false },
  { value: '.site', label: '.site', description: 'Website', popular: false },
  { value: '.online', label: '.online', description: 'Online Business', popular: false },
  { value: '.store', label: '.store', description: 'Online Store', popular: false },
  { value: '.tech', label: '.tech', description: 'Technology', popular: false },
]

const keywordSuggestions = [
  'google', 'microsoft', 'apple', 'amazon', 'facebook', 'twitter', 'instagram',
  'youtube', 'linkedin', 'github', 'stackoverflow', 'wikipedia', 'reddit',
  'netflix', 'spotify', 'discord', 'slack', 'zoom', 'adobe', 'nvidia'
]

export function EnhancedSmartSearchV2({ onSearch, placeholder }: EnhancedSmartSearchV2Props) {
  const { t } = useTranslations()
  const { preFetchHotDomains, preFetchTldList, getCachedSearchResult, cacheSearchResult } = usePreFetch()
  const { history, addToHistory } = useSearchHistory()
  const { getPreference, setPreference } = useUserPreferences()
  
  const [query, setQuery] = useState('')
  const [detectedType, setDetectedType] = useState<SearchType>('auto')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Initialize prefetching on mount
  useEffect(() => {
    // Start prefetching popular domains after a short delay
    const timer = setTimeout(() => {
      preFetchHotDomains()
      preFetchTldList()
    }, 1000)

    return () => clearTimeout(timer)
  }, [preFetchHotDomains, preFetchTldList])

  // Load recent searches from localStorage (now using the hook)
  useEffect(() => {
    // Recent searches are now handled by useSearchHistory hook
  }, [])

  const detectSearchType = useCallback((input: string): SearchType => {
    if (!input) return 'auto'
    
    // Complete domain detection (contains dot and doesn't start or end with dot)
    if (input.includes('.') && !input.startsWith('.') && !input.endsWith('.')) {
      const parts = input.split('.')
      if (parts.length >= 2 && parts.every(part => part.length > 0)) {
        return 'domain'
      }
    }
    
    // Suffix detection (starts with dot)
    if (input.startsWith('.')) {
      return 'suffix'
    }
    
    // Default to prefix
    return 'prefix'
  }, [])

  // Create suggestions with fuzzy search
  // Enhanced suggestions including search history
  const suggestions = useMemo(() => {
    if (!query) {
      // Show recent searches and usage examples when no query
      const recentSuggestions: SearchSuggestion[] = history.slice(0, 2).map(item => ({
        type: 'recent',
        value: item,
        label: item,
        description: '最近搜索'
      }))

      // Usage examples to guide users
      const usageExamples: SearchSuggestion[] = [
        {
          type: 'domain',
          value: 'nextname.app',
          label: 'nextname.app',
          description: '输入完整域名 - 检查WHOIS信息'
        },
        {
          type: 'prefix',
          value: 'nextname',
          label: 'nextname',
          description: '输入域名前缀 - 批量检索是否可注册'
        },
        {
          type: 'suffix',
          value: '.app',
          label: '.app',
          description: '输入域名后缀 - 批量对比注册商价格'
        }
      ]

      return [...recentSuggestions, ...usageExamples]
    }

    const normalizedQuery = query.toLowerCase().trim()
    const allSuggestions: SearchSuggestion[] = []

    // Add search type suggestions based on current query
    const searchTypeSuggestions: SearchSuggestion[] = [
      {
        type: 'domain',
        value: query.includes('.') ? query : `${query}.com`,
        label: query.includes('.') ? query : `${query}.com`,
        description: '完整域名查询 - 检查域名是否可注册'
      },
      {
        type: 'keyword',
        value: query.replace(/^\.+/, ''),
        label: query.replace(/^\.+/, ''),
        description: '域名前缀搜索 - 查找以此开头的域名'
      },
      {
        type: 'tld',
        value: query.startsWith('.') ? query : `.${query}`,
        label: query.startsWith('.') ? query : `.${query}`,
        description: '域名后缀搜索 - 查看此后缀的价格对比'
      }
    ]
    
    allSuggestions.push(...searchTypeSuggestions)

    // Add search history matches
    const historyMatches = history
      .filter(item => item.toLowerCase().includes(normalizedQuery))
      .slice(0, 2)
      .map(item => ({
        type: 'recent' as const,
        value: item,
        label: item,
        description: '最近搜索'
      }))
    
    allSuggestions.push(...historyMatches)
    
    // Add TLD suggestions
    const tldMatches = popularTLDs
      .filter(tld => tld.value.toLowerCase().includes(normalizedQuery))
      .slice(0, 2)
      .map(tld => ({
        type: 'tld' as const,
        value: tld.value,
        label: tld.label,
        description: `热门 ${tld.value} 域名后缀`,
        popular: true
      }))
      
    allSuggestions.push(...tldMatches)

    return allSuggestions.slice(0, 8)
  }, [query, history]) // Updated dependency

  const handleInputChange = (value: string) => {
    setQuery(value)
    setDetectedType(detectSearchType(value))
    // Always show suggestions when there's content or when focused
    setIsOpen(true)
  }

  const handleSearch = useCallback((searchQuery: string = query, searchType: SearchType = detectedType) => {
    if (!searchQuery.trim()) return
    
    // Add to search history
    addToHistory(searchQuery)
    
    // Save user preference for search type if manually selected
    if (searchType !== 'auto') {
      setPreference('preferred_search_type', searchType)
    }
    
    // Check cache first
    const cachedResult = getCachedSearchResult(searchQuery, searchType)
    if (cachedResult) {
      console.log('✅ Using cached search result')
    }
    
    onSearch(searchQuery, searchType)
    setIsOpen(false)
  }, [query, detectedType, onSearch, addToHistory, setPreference, getCachedSearchResult])

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value)
    
    // Determine search type based on suggestion type
    let searchType: SearchType = 'auto'
    if (suggestion.type === 'domain') {
      searchType = 'domain'
    } else if (suggestion.type === 'keyword') {
      searchType = 'prefix'
    } else if (suggestion.type === 'tld') {
      searchType = 'suffix'
    }
    
    handleSearch(suggestion.value, searchType)
  }

  const getIcon = () => {
    switch (detectedType) {
      case 'domain':
        return <Globe className="h-4 w-4" />
      case 'prefix':
        return <Hash className="h-4 w-4" />
      case 'suffix':
        return <DollarSign className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeText = () => {
    switch (detectedType) {
      case 'domain':
        return t('common.fullDomain')
      case 'prefix':
        return t('common.domainPrefix')
      case 'suffix':
        return t('common.domainSuffix')
      default:
        return t('common.autoDetect')
    }
  }

  const getSuggestionIcon = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'tld':
        return <DollarSign className="h-4 w-4" />
      case 'domain':
        return <Globe className="h-4 w-4" />
      case 'recent':
        return <Clock className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <div className="relative flex items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={placeholder || t('common.searchPlaceholder')}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
                if (e.key === 'Escape') {
                  setIsOpen(false)
                }
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => setIsOpen(false), 200)
              }}
              className="w-full h-14 pl-12 pr-32 text-lg rounded-full border-2 border-input bg-background hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
              autoComplete="off"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search className="h-5 w-5" />
            </div>
          </div>
          <div className="absolute right-2 flex items-center space-x-2">
            <Button
              onClick={() => handleSearch()}
              className="h-10 rounded-full"
              disabled={!query.trim()}
            >
              {t('common.search')}
            </Button>
          </div>
        </div>
        
        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {recentSearches.length > 0 && query === '' && (
              <div className="border-b">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">Recent Searches</div>
                {suggestions.filter(s => s.type === 'recent').map((suggestion) => (
                  <div
                    key={suggestion.value}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{suggestion.label}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground">
                {query ? "Suggestions" : "搜索建议"}
              </div>
              {suggestions.filter(s => s.type !== 'recent').map((suggestion) => (
                <div
                  key={suggestion.value}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getSuggestionIcon(suggestion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{suggestion.label}</span>
                      {suggestion.popular && <Star className="h-3 w-3 text-yellow-500" />}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {query && (
        <div className="text-sm text-muted-foreground text-center">
          {t('search.searchTypeDetected')} <span className="font-medium text-foreground">{getTypeText()}</span>
          {detectedType === 'domain' && ` ${t('search.willCheckAvailability')}`}
          {detectedType === 'prefix' && ` ${t('search.willCheckTlds')}`}
          {detectedType === 'suffix' && ` ${t('search.willShowPriceComparison')}`}
        </div>
      )}
    </div>
  )
}