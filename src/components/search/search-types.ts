/**
 * 搜索模块类型定义
 */

// 搜索类型
export type SearchType = 'auto' | 'domain' | 'prefix' | 'suffix'

// 建议类型
export type SuggestionType = 'domain' | 'tld' | 'keyword' | 'recent' | 'prefix' | 'suffix' | 'popular'

// 搜索建议接口
export interface SearchSuggestion {
  type: SuggestionType
  value: string
  label: string
  description?: string
  popular?: boolean
  category?: string
  icon?: string
  priority?: number
}

// 搜索历史项
export interface SearchHistoryItem {
  query: string
  type: SearchType
  timestamp: number
  resultCount?: number
}

// 自动补全选项
export interface AutocompleteOption {
  value: string
  label: string
  type: 'domain' | 'tld' | 'keyword'
  score?: number
  highlight?: string
}

// 搜索配置
export interface SearchConfig {
  maxSuggestions: number
  maxHistory: number
  debounceMs: number
  enableFuzzySearch: boolean
  enableHistory: boolean
  enableAutocomplete: boolean
  showPopularSuggestions: boolean
}

// 统一搜索框属性
export interface UnifiedSearchBoxProps {
  placeholder?: string
  onSearch: (query: string, type: SearchType) => void
  showSuggestions?: boolean
  showHistory?: boolean
  showAutocomplete?: boolean
  maxSuggestions?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'hero' | 'compact'
  disabled?: boolean
  loading?: boolean
  initialValue?: string
  config?: Partial<SearchConfig>
}

// 搜索状态
export interface SearchState {
  query: string
  type: SearchType
  isOpen: boolean
  suggestions: SearchSuggestion[]
  history: SearchHistoryItem[]
  autocomplete: AutocompleteOption[]
  selectedIndex: number
  loading: boolean
}

// 热门域名数据
export interface PopularDomain {
  domain: string
  category: string
  description: string
  popularity: number
}

// 流行TLD数据
export interface PopularTLD {
  tld: string
  name: string
  category: string
  description: string
  popularity: number
  price?: string
}

// 关键词数据
export interface PopularKeyword {
  keyword: string
  category: string
  description: string
  popularity: number
  relatedTlds?: string[]
}

// 搜索事件
export interface SearchEvent {
  type: 'search' | 'suggestion_click' | 'history_click' | 'autocomplete_select'
  query: string
  searchType: SearchType
  timestamp: number
  source?: string
}

// 搜索结果统计
export interface SearchStats {
  totalSearches: number
  successfulSearches: number
  averageResponseTime: number
  popularQueries: string[]
  popularTypes: Record<SearchType, number>
}

// 搜索上下文
export interface SearchContext {
  userAgent?: string
  language?: string
  timezone?: string
  location?: string
  sessionId?: string
}

// 导出默认配置
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxSuggestions: 8,
  maxHistory: 10,
  debounceMs: 300,
  enableFuzzySearch: true,
  enableHistory: true,
  enableAutocomplete: true,
  showPopularSuggestions: true
}

// 搜索类型检测规则
export const SEARCH_TYPE_PATTERNS = {
  domain: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  suffix: /^\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/,
  prefix: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
} as const

// 键盘快捷键
export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'Enter',
  CLOSE: 'Escape',
  NEXT: 'ArrowDown',
  PREV: 'ArrowUp',
  SELECT: 'Tab'
} as const
