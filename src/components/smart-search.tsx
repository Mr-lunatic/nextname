"use client"

import { useState, useCallback } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { Search, Globe, Hash, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type SearchType = 'auto' | 'domain' | 'prefix' | 'suffix'

interface SmartSearchProps {
  onSearch: (query: string, type: SearchType) => void
  placeholder?: string
}

export function SmartSearch({ onSearch, placeholder }: SmartSearchProps) {
  const { t } = useTranslations()
  const [query, setQuery] = useState('')
  const [detectedType, setDetectedType] = useState<SearchType>('auto')

  const detectSearchType = useCallback((input: string): SearchType => {
    if (!input) return 'auto'
    
    // 完整域名检测 (包含点且不以点开头或结尾)
    if (input.includes('.') && !input.startsWith('.') && !input.endsWith('.')) {
      const parts = input.split('.')
      if (parts.length >= 2 && parts.every(part => part.length > 0)) {
        return 'domain'
      }
    }
    
    // 后缀检测 (以点开头)
    if (input.startsWith('.')) {
      return 'suffix'
    }
    
    // 默认为前缀
    return 'prefix'
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setDetectedType(detectSearchType(value))
  }

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim(), detectedType)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="relative">
        <div className="relative flex items-center">
          <Input
            type="text"
            placeholder={placeholder || t('common.searchPlaceholder')}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="h-14 pl-12 pr-32 text-lg rounded-full border-2 focus:border-primary"
          />
          <div className="absolute left-4 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <div className="absolute right-2 flex items-center space-x-2">
            <Card className="px-3 py-1 bg-secondary">
              <CardContent className="p-0 flex items-center space-x-1 text-xs">
                {getIcon()}
                <span>{getTypeText()}</span>
              </CardContent>
            </Card>
            <Button
              onClick={handleSearch}
              className="h-10 rounded-full"
              disabled={!query.trim()}
            >
              {t('common.search')}
            </Button>
          </div>
        </div>
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