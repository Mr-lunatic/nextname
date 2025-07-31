/**
 * 搜索模块工具函数
 */

import { SearchType, SearchSuggestion, SuggestionType, SEARCH_TYPE_PATTERNS, PopularDomain, PopularTLD, PopularKeyword } from './search-types'

/**
 * 检测搜索类型
 */
export function detectSearchType(query: string): SearchType {
  if (!query || !query.trim()) return 'auto'
  
  const trimmedQuery = query.trim().toLowerCase()
  
  // 检测域名（包含点且符合域名格式）
  if (SEARCH_TYPE_PATTERNS.domain.test(trimmedQuery)) {
    return 'domain'
  }
  
  // 检测后缀（以点开头）
  if (SEARCH_TYPE_PATTERNS.suffix.test(trimmedQuery)) {
    return 'suffix'
  }
  
  // 检测前缀（不包含点的字符串）
  if (SEARCH_TYPE_PATTERNS.prefix.test(trimmedQuery)) {
    return 'prefix'
  }
  
  return 'auto'
}

/**
 * 验证域名格式
 */
export function isValidDomain(domain: string): boolean {
  return SEARCH_TYPE_PATTERNS.domain.test(domain.toLowerCase())
}

/**
 * 验证TLD格式
 */
export function isValidTLD(tld: string): boolean {
  return SEARCH_TYPE_PATTERNS.suffix.test(tld.toLowerCase())
}

/**
 * 清理搜索查询
 */
export function sanitizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .substring(0, 64) // 限制长度
}

/**
 * 高亮匹配文本
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 获取热门域名建议
 */
export function getPopularDomains(): PopularDomain[] {
  return [
    { domain: 'google.com', category: 'tech', description: '全球最大搜索引擎', popularity: 100 },
    { domain: 'facebook.com', category: 'social', description: '社交网络平台', popularity: 95 },
    { domain: 'apple.com', category: 'tech', description: '苹果公司官网', popularity: 90 },
    { domain: 'microsoft.com', category: 'tech', description: '微软公司官网', popularity: 88 },
    { domain: 'amazon.com', category: 'ecommerce', description: '电商购物平台', popularity: 85 },
    { domain: 'youtube.com', category: 'media', description: '视频分享平台', popularity: 83 },
    { domain: 'twitter.com', category: 'social', description: '社交媒体平台', popularity: 80 },
    { domain: 'instagram.com', category: 'social', description: '图片分享平台', popularity: 78 },
    { domain: 'linkedin.com', category: 'professional', description: '职业社交网络', popularity: 75 },
    { domain: 'github.com', category: 'tech', description: '代码托管平台', popularity: 70 }
  ]
}

/**
 * 获取流行TLD建议
 */
export function getPopularTLDs(): PopularTLD[] {
  return [
    { tld: '.com', name: 'Commercial', category: 'gTLD', description: '最受欢迎的顶级域名', popularity: 100, price: '$10-15/年' },
    { tld: '.net', name: 'Network', category: 'gTLD', description: '网络相关域名', popularity: 80, price: '$12-18/年' },
    { tld: '.org', name: 'Organization', category: 'gTLD', description: '组织机构域名', popularity: 75, price: '$10-16/年' },
    { tld: '.io', name: 'Input/Output', category: 'ccTLD', description: '科技公司首选', popularity: 85, price: '$35-50/年' },
    { tld: '.ai', name: 'Artificial Intelligence', category: 'ccTLD', description: 'AI相关项目', popularity: 70, price: '$80-120/年' },
    { tld: '.app', name: 'Application', category: 'gTLD', description: '应用程序域名', popularity: 65, price: '$18-25/年' },
    { tld: '.dev', name: 'Developer', category: 'gTLD', description: '开发者专用', popularity: 60, price: '$15-20/年' },
    { tld: '.tech', name: 'Technology', category: 'gTLD', description: '科技行业域名', popularity: 55, price: '$20-30/年' },
    { tld: '.online', name: 'Online', category: 'gTLD', description: '在线业务域名', popularity: 50, price: '$8-15/年' },
    { tld: '.store', name: 'Store', category: 'gTLD', description: '电商店铺域名', popularity: 45, price: '$15-25/年' }
  ]
}

/**
 * 获取热门关键词建议
 */
export function getPopularKeywords(): PopularKeyword[] {
  return [
    { keyword: 'app', category: 'tech', description: '应用程序相关', popularity: 90, relatedTlds: ['.app', '.com', '.io'] },
    { keyword: 'api', category: 'tech', description: '接口服务相关', popularity: 85, relatedTlds: ['.io', '.com', '.dev'] },
    { keyword: 'blog', category: 'content', description: '博客网站相关', popularity: 80, relatedTlds: ['.com', '.net', '.blog'] },
    { keyword: 'shop', category: 'ecommerce', description: '购物商店相关', popularity: 88, relatedTlds: ['.shop', '.store', '.com'] },
    { keyword: 'tech', category: 'technology', description: '科技相关', popularity: 75, relatedTlds: ['.tech', '.io', '.com'] },
    { keyword: 'dev', category: 'development', description: '开发相关', popularity: 70, relatedTlds: ['.dev', '.io', '.com'] },
    { keyword: 'design', category: 'creative', description: '设计相关', popularity: 65, relatedTlds: ['.design', '.com', '.studio'] },
    { keyword: 'studio', category: 'creative', description: '工作室相关', popularity: 60, relatedTlds: ['.studio', '.com', '.design'] },
    { keyword: 'media', category: 'content', description: '媒体相关', popularity: 58, relatedTlds: ['.media', '.com', '.tv'] },
    { keyword: 'cloud', category: 'tech', description: '云服务相关', popularity: 55, relatedTlds: ['.cloud', '.com', '.io'] }
  ]
}

/**
 * 获取核心功能建议
 */
export function getCoreFunctionSuggestions(): SearchSuggestion[] {
  return [
    {
      type: 'keyword' as SuggestionType,
      value: 'example.com',
      label: '🌐 域名查询',
      description: '输入完整域名，检查可用性和WHOIS信息',
      popular: true,
      category: 'core',
      priority: 1000
    },
    {
      type: 'keyword' as SuggestionType,
      value: 'mysite',
      label: '🔤 前缀搜索',
      description: '输入域名前缀，批量查询多个后缀的可注册性',
      popular: true,
      category: 'core',
      priority: 999
    },
    {
      type: 'keyword' as SuggestionType,
      value: '.com',
      label: '🏷️ 价格对比',
      description: '输入域名后缀，对比各注册商的价格信息',
      popular: true,
      category: 'core',
      priority: 998
    }
  ]
}

/**
 * 生成搜索建议
 */
export function generateSuggestions(
  query: string,
  type: 'all' | 'domains' | 'tlds' | 'keywords' = 'all',
  maxResults: number = 8
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = []

  if (!query) {
    // 无查询时优先显示核心功能建议
    suggestions.push(...getCoreFunctionSuggestions())

    // 然后显示热门建议
    if (type === 'all' || type === 'domains') {
      suggestions.push(...getPopularDomains().slice(0, 2).map(domain => ({
        type: 'domain' as SuggestionType,
        value: domain.domain,
        label: domain.domain,
        description: domain.description,
        popular: true,
        category: domain.category,
        priority: domain.popularity
      })))
    }

    if (type === 'all' || type === 'tlds') {
      suggestions.push(...getPopularTLDs().slice(0, 2).map(tld => ({
        type: 'tld' as SuggestionType,
        value: tld.tld,
        label: `${tld.tld} - ${tld.name}`,
        description: tld.description,
        popular: true,
        category: tld.category,
        priority: tld.popularity
      })))
    }

    if (type === 'all' || type === 'keywords') {
      suggestions.push(...getPopularKeywords().slice(0, 1).map(keyword => ({
        type: 'keyword' as SuggestionType,
        value: keyword.keyword,
        label: keyword.keyword,
        description: keyword.description,
        popular: true,
        category: keyword.category,
        priority: keyword.popularity
      })))
    }
  } else {
    // 有查询时进行匹配
    const lowerQuery = query.toLowerCase()
    
    if (type === 'all' || type === 'domains') {
      getPopularDomains()
        .filter(domain => domain.domain.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach(domain => {
          suggestions.push({
            type: 'domain',
            value: domain.domain,
            label: domain.domain,
            description: domain.description,
            category: domain.category,
            priority: domain.popularity
          })
        })
    }
    
    if (type === 'all' || type === 'tlds') {
      getPopularTLDs()
        .filter(tld => 
          tld.tld.toLowerCase().includes(lowerQuery) || 
          tld.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 3)
        .forEach(tld => {
          suggestions.push({
            type: 'tld',
            value: tld.tld,
            label: `${tld.tld} - ${tld.name}`,
            description: tld.description,
            category: tld.category,
            priority: tld.popularity
          })
        })
    }
    
    if (type === 'all' || type === 'keywords') {
      getPopularKeywords()
        .filter(keyword => keyword.keyword.toLowerCase().includes(lowerQuery))
        .slice(0, 2)
        .forEach(keyword => {
          suggestions.push({
            type: 'keyword',
            value: keyword.keyword,
            label: keyword.keyword,
            description: keyword.description,
            category: keyword.category,
            priority: keyword.popularity
          })
        })
    }
  }
  
  // 按优先级排序并限制结果数量
  return suggestions
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, maxResults)
}

/**
 * 格式化搜索类型显示文本
 */
export function formatSearchTypeText(type: SearchType, t: (key: string) => string): string {
  switch (type) {
    case 'domain':
      return t('search.type.domain')
    case 'prefix':
      return t('search.type.prefix')
    case 'suffix':
      return t('search.type.suffix')
    default:
      return t('search.type.auto')
  }
}

/**
 * 获取搜索类型图标
 */
export function getSearchTypeIcon(type: SearchType): string {
  switch (type) {
    case 'domain':
      return '🌐'
    case 'prefix':
      return '🔤'
    case 'suffix':
      return '🏷️'
    default:
      return '🔍'
  }
}
