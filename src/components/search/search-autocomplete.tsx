"use client"

import { useMemo } from 'react'
import Fuse from 'fuse.js'
import { AutocompleteOption } from './search-types'
import { getPopularDomains, getPopularTLDs, getPopularKeywords, highlightMatch } from './search-utils'
import { useTranslations } from '@/hooks/useTranslations'

interface SearchAutocompleteProps {
  query: string
  onSelect: (option: AutocompleteOption) => void
  maxOptions?: number
  enableFuzzySearch?: boolean
  className?: string
}

/**
 * 生成自动补全选项
 */
function generateAutocompleteOptions(
  query: string,
  enableFuzzySearch: boolean = true,
  maxOptions: number = 8
): AutocompleteOption[] {
  if (!query || query.length < 1) return []

  const options: AutocompleteOption[] = []
  const lowerQuery = query.toLowerCase()

  // 域名补全
  const domains = getPopularDomains()
  const domainOptions: AutocompleteOption[] = domains
    .filter(domain => domain.domain.toLowerCase().includes(lowerQuery))
    .map(domain => ({
      value: domain.domain,
      label: domain.domain,
      type: 'domain' as const,
      score: domain.popularity
    }))

  // TLD补全
  const tlds = getPopularTLDs()
  const tldOptions: AutocompleteOption[] = []
  
  // 如果查询以点开头，匹配TLD
  if (lowerQuery.startsWith('.')) {
    const tldQuery = lowerQuery.substring(1)
    tlds
      .filter(tld => tld.tld.substring(1).toLowerCase().includes(tldQuery))
      .forEach(tld => {
        tldOptions.push({
          value: tld.tld,
          label: `${tld.tld} - ${tld.name}`,
          type: 'tld',
          score: tld.popularity
        })
      })
  } else {
    // 否则为前缀添加流行TLD
    tlds.slice(0, 5).forEach(tld => {
      tldOptions.push({
        value: `${lowerQuery}${tld.tld}`,
        label: `${query}${tld.tld}`,
        type: 'domain',
        score: tld.popularity,
        highlight: query
      })
    })
  }

  // 关键词补全
  const keywords = getPopularKeywords()
  const keywordOptions: AutocompleteOption[] = keywords
    .filter(keyword => keyword.keyword.toLowerCase().includes(lowerQuery))
    .map(keyword => ({
      value: keyword.keyword,
      label: keyword.keyword,
      type: 'keyword' as const,
      score: keyword.popularity
    }))

  // 合并所有选项
  options.push(...domainOptions, ...tldOptions, ...keywordOptions)

  // 如果启用模糊搜索
  if (enableFuzzySearch && options.length < maxOptions) {
    const allData = [
      ...domains.map(d => ({ ...d, searchType: 'domain' as const })),
      ...tlds.map(t => ({ ...t, searchType: 'tld' as const })),
      ...keywords.map(k => ({ ...k, searchType: 'keyword' as const }))
    ]

    const fuse = new Fuse(allData, {
      keys: [
        { name: 'domain', weight: 0.4 },
        { name: 'tld', weight: 0.3 },
        { name: 'keyword', weight: 0.3 },
        { name: 'name', weight: 0.2 },
        { name: 'description', weight: 0.1 }
      ],
      threshold: 0.4,
      includeScore: true
    })

    const fuzzyResults = fuse.search(query)
    fuzzyResults.forEach(result => {
      const item = result.item
      const score = (1 - (result.score || 0)) * 100

      if (item.searchType === 'domain' && 'domain' in item) {
        const existing = options.find(opt => opt.value === item.domain)
        if (!existing) {
          options.push({
            value: item.domain,
            label: item.domain,
            type: 'domain',
            score
          })
        }
      } else if (item.searchType === 'tld' && 'tld' in item) {
        const existing = options.find(opt => opt.value === item.tld)
        if (!existing) {
          options.push({
            value: item.tld,
            label: `${item.tld} - ${item.name}`,
            type: 'tld',
            score
          })
        }
      } else if (item.searchType === 'keyword' && 'keyword' in item) {
        const existing = options.find(opt => opt.value === item.keyword)
        if (!existing) {
          options.push({
            value: item.keyword,
            label: item.keyword,
            type: 'keyword',
            score
          })
        }
      }
    })
  }

  // 按分数排序并限制数量
  return options
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, maxOptions)
}

/**
 * 获取选项类型图标
 */
function getOptionTypeIcon(type: 'domain' | 'tld' | 'keyword'): string {
  switch (type) {
    case 'domain':
      return '🌐'
    case 'tld':
      return '🏷️'
    case 'keyword':
      return '🔤'
    default:
      return '🔍'
  }
}

/**
 * 搜索自动补全组件
 */
export function SearchAutocomplete({
  query,
  onSelect,
  maxOptions = 8,
  enableFuzzySearch = true,
  className = ''
}: SearchAutocompleteProps) {
  const { t } = useTranslations()

  // 生成自动补全选项
  const options = useMemo(() => {
    return generateAutocompleteOptions(query, enableFuzzySearch, maxOptions)
  }, [query, enableFuzzySearch, maxOptions])

  const handleSelect = (option: AutocompleteOption) => {
    onSelect(option)
  }

  if (options.length === 0) {
    return null
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        {t('search.autocomplete')}
      </div>
      <div className="space-y-1 p-1">
        {options.map((option, index) => (
          <div
            key={`${option.type}-${option.value}-${index}`}
            onClick={() => handleSelect(option)}
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-secondary cursor-pointer transition-colors group"
          >
            {/* 类型图标 */}
            <div className="flex-shrink-0 text-sm">
              {getOptionTypeIcon(option.type)}
            </div>

            {/* 选项内容 */}
            <div className="flex-1 min-w-0">
              <span 
                className="text-sm font-medium truncate"
                dangerouslySetInnerHTML={{ 
                  __html: highlightMatch(option.label, option.highlight || query) 
                }}
              />
            </div>

            {/* 类型标签 */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                {option.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 内联自动补全组件（显示在输入框中）
 */
export function InlineAutocomplete({
  query,
  onComplete,
  className = ''
}: {
  query: string
  onComplete: (completion: string) => void
  className?: string
}) {
  const completion = useMemo(() => {
    if (!query || query.length < 2) return ''

    const options = generateAutocompleteOptions(query, false, 1)
    if (options.length === 0) return ''

    const bestMatch = options[0]
    const lowerQuery = query.toLowerCase()
    const lowerValue = bestMatch.value.toLowerCase()

    // 只有当匹配项以查询开头时才显示补全
    if (lowerValue.startsWith(lowerQuery) && lowerValue !== lowerQuery) {
      return bestMatch.value.substring(query.length)
    }

    return ''
  }, [query])

  if (!completion) return null

  return (
    <span 
      className={`pointer-events-none text-muted-foreground ${className}`}
      onClick={() => onComplete(completion)}
    >
      {completion}
    </span>
  )
}

/**
 * 自动补全Hook
 */
export function useAutocomplete(
  query: string,
  maxOptions: number = 8,
  enableFuzzySearch: boolean = true
) {
  const options = useMemo(() => {
    return generateAutocompleteOptions(query, enableFuzzySearch, maxOptions)
  }, [query, enableFuzzySearch, maxOptions])

  const getBestCompletion = () => {
    if (!query || query.length < 2 || options.length === 0) return ''

    const bestMatch = options[0]
    const lowerQuery = query.toLowerCase()
    const lowerValue = bestMatch.value.toLowerCase()

    if (lowerValue.startsWith(lowerQuery) && lowerValue !== lowerQuery) {
      return bestMatch.value
    }

    return ''
  }

  const completeWith = (option: AutocompleteOption) => {
    return option.value
  }

  return {
    options,
    getBestCompletion,
    completeWith,
    hasOptions: options.length > 0
  }
}
