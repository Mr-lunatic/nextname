"use client"

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
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

interface EnhancedSmartSearchProps {
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

export function EnhancedSmartSearch({ onSearch, placeholder }: EnhancedSmartSearchProps) {
  const { t } = useTranslations()
  const [query, setQuery] = useState('')
  const [detectedType, setDetectedType] = useState<SearchType>('auto')
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-searches')
    if (stored) {
      setRecentSearches(JSON.parse(stored))
    }
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
  const suggestions = useMemo(() => {
    if (!query) {
      // Show recent searches and popular TLDs when query is empty
      const recentSuggestions: SearchSuggestion[] = recentSearches.slice(0, 5).map(search => ({
        type: 'recent',
        value: search,
        label: search,
        description: 'Recent search'
      }))

      const popularSuggestions: SearchSuggestion[] = popularTLDs
        .filter(tld => tld.popular)
        .map(tld => ({
          type: 'tld',
          value: tld.value,
          label: tld.label,
          description: tld.description,
          popular: true
        }))

      return [...recentSuggestions, ...popularSuggestions]
    }

    const allSuggestions: SearchSuggestion[] = [
      // TLD suggestions
      ...popularTLDs.map(tld => ({
        type: 'tld' as const,
        value: tld.value,
        label: tld.label,
        description: tld.description,
        popular: tld.popular
      })),
      // Keyword suggestions
      ...keywordSuggestions.map(keyword => ({
        type: 'keyword' as const,
        value: keyword,
        label: keyword,
        description: 'Popular domain keyword'
      }))
    ]

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(allSuggestions, {
      keys: ['label', 'value', 'description'],
      threshold: 0.3,
      includeScore: true
    })

    const results = fuse.search(query).slice(0, 8)
    return results.map(result => result.item)
  }, [query, recentSearches])

  const handleInputChange = (value: string) => {
    setQuery(value)
    setDetectedType(detectSearchType(value))
    setIsOpen(value.length > 0 || suggestions.length > 0)
  }

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query
    if (finalQuery.trim()) {
      // Add to recent searches
      const newRecentSearches = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 10)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('recent-searches', JSON.stringify(newRecentSearches))
      
      onSearch(finalQuery.trim(), detectSearchType(finalQuery))
      setIsOpen(false)
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value)
    handleSearch(suggestion.value)
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
            <Card className="px-3 py-1 bg-secondary">
              <CardContent className="p-0 flex items-center space-x-1 text-xs">
                {getIcon()}
                <span>{getTypeText()}</span>
              </CardContent>
            </Card>
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
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                {query ? "Suggestions" : "Popular TLDs"}
              </div>
              {suggestions.filter(s => s.type !== 'recent').map((suggestion) => (
                <div
                  key={suggestion.value}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-secondary cursor-pointer"
                >
                  {getSuggestionIcon(suggestion)}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <span>{suggestion.label}</span>
                      {suggestion.popular && <Star className="h-3 w-3 text-yellow-500" />}
                    </div>
                    {suggestion.description && (
                      <div className="text-xs text-muted-foreground">{suggestion.description}</div>
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