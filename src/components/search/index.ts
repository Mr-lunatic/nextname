/**
 * 搜索模块统一导出
 */

// 主要组件
export { UnifiedSearchBox } from './unified-search-box'
export { SearchSuggestions, CompactSearchSuggestions } from './search-suggestions'
export { SearchAutocomplete, InlineAutocomplete, useAutocomplete } from './search-autocomplete'
export { SearchHistory, CompactSearchHistory, useSearchHistory } from './search-history'

// 类型定义
export type {
  SearchType,
  SuggestionType,
  SearchSuggestion,
  SearchHistoryItem,
  AutocompleteOption,
  SearchConfig,
  UnifiedSearchBoxProps,
  SearchState,
  PopularDomain,
  PopularTLD,
  PopularKeyword,
  SearchEvent,
  SearchStats,
  SearchContext
} from './search-types'

// 工具函数
export {
  detectSearchType,
  isValidDomain,
  isValidTLD,
  sanitizeQuery,
  highlightMatch,
  escapeRegExp,
  debounce,
  getPopularDomains,
  getPopularTLDs,
  getPopularKeywords,
  generateSuggestions,
  formatSearchTypeText,
  getSearchTypeIcon
} from './search-utils'

// 常量
export {
  DEFAULT_SEARCH_CONFIG,
  SEARCH_TYPE_PATTERNS,
  KEYBOARD_SHORTCUTS
} from './search-types'
