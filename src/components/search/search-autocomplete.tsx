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
 * 获取类型样式
 */
function getTypeStyles(type: string): string {
  switch (type) {
    case 'domain':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'tld':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'keyword':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }
}

/**
 * 获取类型图标
 */
function getTypeIcon(type: string): string {
  switch (type) {
    case 'domain':
      return '🌐'
    case 'tld':
      return '🏷️'
    case 'keyword':
      return '🔍'
    default:
      return '📄'
  }
}

/**
 * 获取类型标签
 */
function getTypeLabel(type: string): string {
  switch (type) {
    case 'domain':
      return '域名'
    case 'tld':
      return '后缀'
    case 'keyword':
      return '关键词'
    default:
      return '其他'
  }
}

/**
 * 获取类型描述
 */
function getTypeDescription(type: string): string {
  switch (type) {
    case 'domain':
      return '点击查看域名详情'
    case 'tld':
      return '顶级域名后缀'
    case 'keyword':
      return '热门搜索关键词'
    default:
      return ''
  }
}

/**
 * 获取热门推荐 (无查询时显示)
 */
function getPopularRecommendations(maxOptions: number = 8): AutocompleteOption[] {
  const recommendations: AutocompleteOption[] = [
    // 热门域名后缀
    { value: '.com', label: '.com - 商业域名', type: 'tld', score: 100 },
    { value: '.net', label: '.net - 网络域名', type: 'tld', score: 90 },
    { value: '.org', label: '.org - 组织域名', type: 'tld', score: 85 },
    { value: '.cn', label: '.cn - 中国域名', type: 'tld', score: 80 },
    { value: '.io', label: '.io - 科技域名', type: 'tld', score: 75 },
    { value: '.ai', label: '.ai - 人工智能', type: 'tld', score: 70 },

    // 热门关键词
    { value: 'tech', label: 'tech - 科技相关', type: 'keyword', score: 65 },
    { value: 'app', label: 'app - 应用程序', type: 'keyword', score: 60 },
    { value: 'shop', label: 'shop - 购物商城', type: 'keyword', score: 55 },
    { value: 'blog', label: 'blog - 博客网站', type: 'keyword', score: 50 }
  ]

  return recommendations.slice(0, maxOptions)
}

/**
 * 生成自动补全选项
 */
function generateAutocompleteOptions(
  query: string,
  enableFuzzySearch: boolean = true,
  maxOptions: number = 8
): AutocompleteOption[] {
  if (!query || query.length < 1) {
    // 无查询时返回热门推荐
    return getPopularRecommendations(maxOptions)
  }

  const options: AutocompleteOption[] = []
  const lowerQuery = query.toLowerCase()

  // 1. 智能域名后缀建议 (优先级最高)
  if (!lowerQuery.includes('.')) {
    const popularTlds = ['.com', '.net', '.org', '.cn', '.io', '.ai', '.co']
    popularTlds.forEach((tld, index) => {
      options.push({
        value: `${query}${tld}`,
        label: `${query}${tld}`,
        type: 'domain',
        score: 100 - index * 5, // 按流行度排序
        highlight: query
      })
    })
  }

  // 2. 热门域名匹配
  const domains = getPopularDomains()
  const domainOptions: AutocompleteOption[] = domains
    .filter(domain => {
      const domainLower = domain.domain.toLowerCase()
      return domainLower.startsWith(lowerQuery) || domainLower.includes(lowerQuery)
    })
    .slice(0, 3) // 限制数量
    .map(domain => ({
      value: domain.domain,
      label: domain.domain,
      type: 'domain' as const,
      score: domain.popularity + (domain.domain.toLowerCase().startsWith(lowerQuery) ? 50 : 0) // 前缀匹配加分
    }))

  // 3. TLD补全 (当输入包含点时)
  const tlds = getPopularTLDs()
  if (lowerQuery.includes('.')) {
    const tldOptions: AutocompleteOption[] = []

    if (lowerQuery.startsWith('.')) {
      // 直接搜索TLD
      const tldQuery = lowerQuery.substring(1)
      tlds
        .filter(tld => tld.tld.substring(1).toLowerCase().includes(tldQuery))
        .slice(0, 3)
        .forEach(tld => {
          tldOptions.push({
            value: tld.tld,
            label: `${tld.tld} - ${tld.name}`,
            type: 'tld',
            score: tld.popularity
          })
        })
    }
    options.push(...tldOptions)
  }

  // 4. 关键词补全
  const keywords = getPopularKeywords()
  const keywordOptions: AutocompleteOption[] = keywords
    .filter(keyword => keyword.keyword.toLowerCase().includes(lowerQuery))
    .slice(0, 2) // 限制关键词数量
    .map(keyword => ({
      value: keyword.keyword,
      label: keyword.keyword,
      type: 'keyword' as const,
      score: keyword.popularity
    }))

  // 合并所有选项
  options.push(...domainOptions, ...keywordOptions)

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
    <div className={`${className}`}>
      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b">
        💡 智能建议
      </div>
      <div className="p-2 space-y-1">
        {options.map((option, index) => (
          <div
            key={`${option.type}-${option.value}-${index}`}
            onClick={() => handleSelect(option)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-200 group hover:shadow-sm"
          >
            {/* 类型图标 (左侧) */}
            <div className="flex-shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${getTypeStyles(option.type)}`}>
                {getTypeIcon(option.type)}
              </div>
            </div>

            {/* 选项内容 */}
            <div className="flex-1 min-w-0">
              <span
                className="text-sm font-medium text-foreground group-hover:text-primary transition-colors"
                dangerouslySetInnerHTML={{
                  __html: highlightMatch(option.label, option.highlight || query)
                }}
              />
              {option.type === 'domain' && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {getTypeDescription(option.type)}
                </div>
              )}
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
