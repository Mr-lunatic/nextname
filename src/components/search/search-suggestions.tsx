"use client"

import { useMemo } from 'react'
import { Globe, Hash, DollarSign, Star, TrendingUp, Zap } from 'lucide-react'
import { SearchSuggestion, SuggestionType } from './search-types'
import { generateSuggestions, highlightMatch } from './search-utils'
import { useTranslations } from '@/hooks/useTranslations'

interface SearchSuggestionsProps {
  query: string
  onSelect: (suggestion: SearchSuggestion) => void
  maxSuggestions?: number
  showCategories?: boolean
  className?: string
}

/**
 * 获取建议类型图标
 */
function getSuggestionIcon(type: SuggestionType, popular?: boolean) {
  if (popular) {
    return <Star className="h-4 w-4 text-yellow-500" />
  }

  switch (type) {
    case 'domain':
      return <Globe className="h-4 w-4 text-blue-500" />
    case 'tld':
      return <Hash className="h-4 w-4 text-green-500" />
    case 'keyword':
      return <Zap className="h-4 w-4 text-purple-500" />
    case 'prefix':
      return <Hash className="h-4 w-4 text-orange-500" />
    case 'suffix':
      return <DollarSign className="h-4 w-4 text-red-500" />
    case 'popular':
      return <TrendingUp className="h-4 w-4 text-pink-500" />
    default:
      return <Hash className="h-4 w-4 text-muted-foreground" />
  }
}

/**
 * 获取建议类型显示文本
 */
function getSuggestionTypeText(type: SuggestionType, t: (key: string) => string): string {
  switch (type) {
    case 'domain':
      return t('search.suggestion.domain')
    case 'tld':
      return t('search.suggestion.tld')
    case 'keyword':
      return t('search.suggestion.keyword')
    case 'prefix':
      return t('search.suggestion.prefix')
    case 'suffix':
      return t('search.suggestion.suffix')
    case 'popular':
      return t('search.suggestion.popular')
    default:
      return t('search.suggestion.general')
  }
}

/**
 * 获取类别颜色
 */
function getCategoryColor(category?: string): string {
  switch (category) {
    case 'tech':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'social':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    case 'ecommerce':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'media':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'professional':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    case 'gTLD':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
    case 'ccTLD':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

/**
 * 搜索建议组件
 */
export function SearchSuggestions({
  query,
  onSelect,
  maxSuggestions = 8,
  showCategories = true,
  className = ''
}: SearchSuggestionsProps) {
  const { t } = useTranslations()

  // 生成建议列表
  const suggestions = useMemo(() => {
    return generateSuggestions(query, 'all', maxSuggestions)
  }, [query, maxSuggestions])

  // 按类型分组建议
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, SearchSuggestion[]> = {}
    
    suggestions.forEach(suggestion => {
      const groupKey = suggestion.popular ? 'popular' : suggestion.type
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(suggestion)
    })
    
    return groups
  }, [suggestions])

  const handleSelect = (suggestion: SearchSuggestion) => {
    onSelect(suggestion)
  }

  if (suggestions.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('search.noSuggestions')}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 核心功能建议 */}
      {!query && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <Star className="h-3 w-3" />
            <span>{t('search.coreFunctions')}</span>
          </div>
          <div className="space-y-1">
            {suggestions.filter(s => s.category === 'core').map((suggestion, index) => (
              <SuggestionItem
                key={`core-${index}`}
                suggestion={suggestion}
                query={query}
                onSelect={handleSelect}
                showCategories={false}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* 热门建议 */}
      {groupedSuggestions.popular && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{t('search.popularSuggestions')}</span>
          </div>
          <div className="space-y-1">
            {groupedSuggestions.popular.filter(s => s.category !== 'core').map((suggestion, index) => (
              <SuggestionItem
                key={`popular-${index}`}
                suggestion={suggestion}
                query={query}
                onSelect={handleSelect}
                showCategories={showCategories}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* 域名建议 */}
      {groupedSuggestions.domain && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>{t('search.domainSuggestions')}</span>
          </div>
          <div className="space-y-1">
            {groupedSuggestions.domain.map((suggestion, index) => (
              <SuggestionItem
                key={`domain-${index}`}
                suggestion={suggestion}
                query={query}
                onSelect={handleSelect}
                showCategories={showCategories}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* TLD建议 */}
      {groupedSuggestions.tld && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>{t('search.tldSuggestions')}</span>
          </div>
          <div className="space-y-1">
            {groupedSuggestions.tld.map((suggestion, index) => (
              <SuggestionItem
                key={`tld-${index}`}
                suggestion={suggestion}
                query={query}
                onSelect={handleSelect}
                showCategories={showCategories}
                t={t}
              />
            ))}
          </div>
        </div>
      )}

      {/* 关键词建议 */}
      {groupedSuggestions.keyword && (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>{t('search.keywordSuggestions')}</span>
          </div>
          <div className="space-y-1">
            {groupedSuggestions.keyword.map((suggestion, index) => (
              <SuggestionItem
                key={`keyword-${index}`}
                suggestion={suggestion}
                query={query}
                onSelect={handleSelect}
                showCategories={showCategories}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 单个建议项组件
 */
function SuggestionItem({
  suggestion,
  query,
  onSelect,
  showCategories,
  t
}: {
  suggestion: SearchSuggestion
  query: string
  onSelect: (suggestion: SearchSuggestion) => void
  showCategories: boolean
  t: (key: string) => string
}) {
  // 对于核心功能建议，使用特殊的显示方式
  if (suggestion.category === 'core') {
    return (
      <div
        onClick={() => onSelect(suggestion)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors group"
      >
        {/* 图标 */}
        <div className="flex-shrink-0 text-lg">
          {suggestion.icon || getSuggestionIcon(suggestion.type, suggestion.popular)}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium text-foreground"
            dangerouslySetInnerHTML={{
              __html: highlightMatch(suggestion.label, query)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelect(suggestion)}
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors group"
    >
      {/* 图标 */}
      <div className="flex-shrink-0">
        {getSuggestionIcon(suggestion.type, suggestion.popular)}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium truncate"
            dangerouslySetInnerHTML={{
              __html: highlightMatch(suggestion.label, query)
            }}
          />
          {suggestion.popular && (
            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
              {t('common.popular')}
            </span>
          )}
          {showCategories && suggestion.category && suggestion.category !== 'core' && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(suggestion.category)}`}>
              {suggestion.category}
            </span>
          )}
        </div>
        {suggestion.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {suggestion.description}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * 紧凑版搜索建议组件（用于下拉建议）
 */
export function CompactSearchSuggestions({
  query,
  onSelect,
  maxSuggestions = 6,
  className = ''
}: Omit<SearchSuggestionsProps, 'showCategories'>) {
  const suggestions = useMemo(() => {
    return generateSuggestions(query, 'all', maxSuggestions)
  }, [query, maxSuggestions])

  if (suggestions.length === 0) return null

  return (
    <div className={`space-y-1 p-1 ${className}`}>
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          onClick={() => onSelect(suggestion)}
          className="flex items-center gap-2 px-2 py-2 rounded hover:bg-secondary cursor-pointer transition-colors"
        >
          <div className="flex-shrink-0">
            {getSuggestionIcon(suggestion.type, suggestion.popular)}
          </div>
          <div className="flex-1 min-w-0">
            <span 
              className="text-sm truncate"
              dangerouslySetInnerHTML={{ 
                __html: highlightMatch(suggestion.label, query) 
              }}
            />
            {suggestion.description && (
              <p className="text-xs text-muted-foreground truncate">
                {suggestion.description}
              </p>
            )}
          </div>
          {suggestion.popular && (
            <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  )
}
