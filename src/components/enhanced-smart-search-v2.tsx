"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { usePreFetch, useSearchHistory, useUserPreferences } from '@/hooks/usePreFetch'
import { Search, Globe, Hash, DollarSign, Clock, Star } from 'lucide-react'
import Fuse from 'fuse.js'
import { Button } from '@/components/ui/button'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { Card, CardContent } from '@/components/ui/card'

// Type definitions for better type safety
export type SearchType = 'auto' | 'domain' | 'prefix' | 'suffix'

export type SuggestionType = 'domain' | 'tld' | 'keyword' | 'recent' | 'prefix' | 'suffix'

export interface SearchSuggestion {
  type: SuggestionType
  value: string
  label: string
  description?: string
  popular?: boolean
}

export interface EnhancedSmartSearchV2Props {
  onSearch: (query: string, type: SearchType) => void
  placeholder?: string
}

export interface PopularTLD {
  value: string
  label: string
  description: string
  popular: boolean
}

const popularTLDs: PopularTLD[] = [
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

const keywordSuggestions: readonly string[] = [
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
    // Start prefetching TLD list after a short delay
    const timer = setTimeout(() => {
      preFetchTldList() // Keep TLD prefetch as it's less intensive
    }, 1000)

    return () => clearTimeout(timer)
  }, [preFetchTldList])

  // Load recent searches using the hook
  useEffect(() => {
    // Recent searches are now handled by useSearchHistory hook
    // This effect can be removed if no additional logic is needed
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
        description: t('common.recentSearch')
      }))

      // Usage examples to guide users
      const usageExamples: SearchSuggestion[] = [
        {
          type: 'domain',
          value: 'nextname.app',
          label: 'nextname.app',
          description: t('search.inputFullDomain')
        },
        {
          type: 'prefix',
          value: 'nextname',
          label: 'nextname',
          description: t('search.inputDomainPrefix')
        },
        {
          type: 'suffix',
          value: '.app',
          label: '.app',
          description: t('search.inputDomainSuffix')
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
        description: t('search.fullDomainQuery')
      },
      {
        type: 'keyword',
        value: query.replace(/^\.+/, ''),
        label: query.replace(/^\.+/, ''),
        description: t('search.domainPrefixSearch')
      },
      {
        type: 'tld',
        value: query.startsWith('.') ? query : `.${query}`,
        label: query.startsWith('.') ? query : `.${query}`,
        description: t('search.domainSuffixSearch')
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
        description: t('common.recentSearch')
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
        description: `${t('search.popularTld')} ${tld.value} ${t('search.domainSuffix')}`,
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
    } else if (suggestion.type === 'prefix') {
      searchType = 'prefix'
    } else if (suggestion.type === 'suffix' || suggestion.type === 'tld') {
      searchType = 'suffix'
    } else if (suggestion.type === 'keyword') {
      searchType = 'prefix'
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
      case 'suffix':
        return <DollarSign className="h-4 w-4 text-muted-foreground" />
      case 'domain':
        return <Globe className="h-4 w-4 text-muted-foreground" />
      case 'prefix':
        return <Search className="h-4 w-4 text-muted-foreground" />
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return <Hash className="h-4 w-4 text-muted-foreground" />
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
              className="w-full h-12 md:h-14 pl-10 md:pl-12 pr-24 md:pr-32 text-base md:text-lg rounded-full border-2 transition-all duration-300 focus:outline-none"
              style={{
                backgroundColor: 'var(--color-surface-secondary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)'
              }}
              onFocus={(e) => {
                setIsOpen(true);
                e.target.style.borderColor = 'var(--color-accent-default)';
                e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
              }}
              onBlur={(e) => {
                setTimeout(() => setIsOpen(false), 200);
                e.target.style.borderColor = 'var(--color-border-default)';
                e.target.style.boxShadow = 'none';
              }}
              autoComplete="off"
            />
            <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
          <div className="absolute right-1 md:right-2 flex items-center space-x-2">
            <EnhancedButton
              onClick={() => handleSearch()}
              className="h-8 md:h-10 px-3 md:px-4 rounded-full text-sm md:text-base"
              disabled={!query.trim()}
              variant="primary"
              size="sm"
            >
              <span className="hidden sm:inline">{t('common.search')}</span>
              <Search className="h-4 w-4 sm:hidden" />
            </EnhancedButton>
          </div>
        </div>
        
        {/* Suggestions dropdown - 移动端优化 */}
        {isOpen && suggestions.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg z-50 max-h-64 md:max-h-80 overflow-y-auto"
            style={{
              backgroundColor: 'var(--color-surface-secondary)',
              border: '1px solid var(--color-border-default)'
            }}
          >
            {recentSearches.length > 0 && query === '' && (
              <div className="border-b">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground">{t('search.recentSearches')}</div>
                {suggestions.filter(s => s.type === 'recent').map((suggestion) => (
                  <div
                    key={suggestion.value}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex items-center gap-2 px-3 py-3 md:py-2 hover:bg-secondary cursor-pointer active:bg-secondary/80 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{suggestion.label}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div>
              <div className="px-3 py-2 text-xs font-bold text-muted-foreground">
                {query ? t('common.suggestions') : t('common.searchSuggestions')}
              </div>
              {suggestions.filter(s => s.type !== 'recent').map((suggestion) => (
                <div
                  key={suggestion.value}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-3 hover:bg-secondary cursor-pointer transition-colors active:bg-secondary/80"
                >
                  <div className="flex-shrink-0">
                    {getSuggestionIcon(suggestion)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="font-medium text-sm text-foreground truncate">{suggestion.label}</span>
                      {suggestion.popular && <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}}
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