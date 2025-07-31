"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Globe, Hash, DollarSign, Loader2 } from 'lucide-react'
import { UnifiedSearchBoxProps, SearchState, SearchSuggestion, AutocompleteOption, SearchType, DEFAULT_SEARCH_CONFIG, KEYBOARD_SHORTCUTS } from './search-types'
import { detectSearchType, sanitizeQuery, debounce, formatSearchTypeText, getSearchTypeIcon } from './search-utils'
import { useSearchHistory } from './search-history'
import { CompactSearchHistory } from './search-history'
import { CompactSearchSuggestions } from './search-suggestions'
import { SearchAutocomplete, InlineAutocomplete } from './search-autocomplete'
import { useTranslations } from '@/hooks/useTranslations'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * 统一搜索框组件
 *
 * 功能特性：
 * - 智能搜索类型检测
 * - 搜索建议和自动补全
 * - 搜索历史记录
 * - 键盘导航支持
 * - 响应式设计
 * - 主题适配
 */
export function UnifiedSearchBox({
  placeholder,
  onSearch,
  showSuggestions = true,
  showHistory = true,
  showAutocomplete = true,
  maxSuggestions = 8,
  className = '',
  size = 'md',
  variant = 'default',
  disabled = false,
  loading = false,
  initialValue = '',
  config = {}
}: UnifiedSearchBoxProps) {
  const { t } = useTranslations()
  const { addToHistory } = useSearchHistory()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 合并配置
  const finalConfig = { ...DEFAULT_SEARCH_CONFIG, ...config }
  
  // 搜索状态
  const [state, setState] = useState<SearchState>({
    query: initialValue,
    type: detectSearchType(initialValue),
    isOpen: false,
    suggestions: [],
    history: [],
    autocomplete: [],
    selectedIndex: -1,
    loading: false
  })

  // 处理输入变化
  const handleInputChange = useCallback((value: string) => {
    const sanitized = sanitizeQuery(value)
    const detectedType = detectSearchType(sanitized)

    setState(prev => ({
      ...prev,
      query: sanitized,
      type: detectedType,
      isOpen: sanitized.length > 0 || showHistory,
      selectedIndex: -1,
      loading: sanitized.length > 0
    }))

    // 简单的防抖处理
    if (sanitized.trim()) {
      setTimeout(() => {
        setState(prev => ({ ...prev, loading: false }))
      }, finalConfig.debounceMs)
    }
  }, [finalConfig.debounceMs, showHistory])

  // 处理搜索
  const handleSearch = useCallback((searchQuery?: string, searchType?: typeof state.type) => {
    const query = searchQuery || state.query
    const type = searchType || state.type
    
    if (!query.trim() || disabled || loading) return

    // 添加到搜索历史
    addToHistory(query, type)
    
    // 执行搜索
    onSearch(query, type)
    
    // 关闭下拉框
    setState(prev => ({ ...prev, isOpen: false, selectedIndex: -1 }))
    
    // 失去焦点
    inputRef.current?.blur()
  }, [state.query, state.type, disabled, loading, addToHistory, onSearch])

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    handleSearch(suggestion.value, detectSearchType(suggestion.value))
  }, [handleSearch])

  // 处理历史选择
  const handleHistorySelect = useCallback((query: string, type: SearchType) => {
    handleSearch(query, type)
  }, [handleSearch])

  // 处理自动补全选择
  const handleAutocompleteSelect = useCallback((option: AutocompleteOption) => {
    setState(prev => ({ ...prev, query: option.value, type: detectSearchType(option.value) }))
    handleSearch(option.value, detectSearchType(option.value))
  }, [handleSearch])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case KEYBOARD_SHORTCUTS.SEARCH:
        e.preventDefault()
        handleSearch()
        break
      case KEYBOARD_SHORTCUTS.CLOSE:
        setState(prev => ({ ...prev, isOpen: false, selectedIndex: -1 }))
        inputRef.current?.blur()
        break
      case KEYBOARD_SHORTCUTS.NEXT:
        e.preventDefault()
        setState(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, maxSuggestions - 1)
        }))
        break
      case KEYBOARD_SHORTCUTS.PREV:
        e.preventDefault()
        setState(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1)
        }))
        break
      case KEYBOARD_SHORTCUTS.SELECT:
        if (state.selectedIndex >= 0) {
          e.preventDefault()
          // 这里可以实现Tab选择建议的逻辑
        }
        break
    }
  }, [handleSearch, maxSuggestions, state.selectedIndex])

  // 处理焦点事件
  const handleFocus = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isOpen: prev.query.length > 0 || showHistory 
    }))
  }, [showHistory])

  const handleBlur = useCallback(() => {
    // 延迟关闭，允许点击下拉选项
    setTimeout(() => {
      setState(prev => ({ ...prev, isOpen: false, selectedIndex: -1 }))
    }, 200)
  }, [])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setState(prev => ({ ...prev, isOpen: false, selectedIndex: -1 }))
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 获取搜索类型图标
  const getTypeIcon = () => {
    switch (state.type) {
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

  // 获取尺寸样式
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'h-9 sm:h-10 text-sm'
      case 'lg':
        return 'h-14 sm:h-16 text-lg sm:text-xl'
      default:
        return 'h-11 sm:h-12 md:h-14 text-base md:text-lg'
    }
  }

  // 获取变体样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return 'border-2 border-primary/20 bg-background/80 backdrop-blur-sm shadow-lg'
      case 'compact':
        return 'border border-input bg-background'
      default:
        return 'border-2 border-input bg-background hover:border-primary focus-within:border-primary'
    }
  }

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-4 ${className}`}>
      <div className="relative">
        {/* 搜索输入框 */}
        <div className={`relative flex items-center rounded-full transition-all duration-300 ${getSizeStyles()} ${getVariantStyles()}`}>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder || t('common.searchPlaceholder')}
              value={state.query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              className="w-full h-full pl-9 sm:pl-10 md:pl-12 pr-20 sm:pr-24 md:pr-32 bg-transparent rounded-full focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
            />
            
            {/* 搜索图标 */}
            <div className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5" />
            </div>

            {/* 内联自动补全 - 暂时禁用以避免覆盖问题 */}
            {false && showAutocomplete && state.query && (
              <div className="absolute left-9 sm:left-10 md:left-12 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <InlineAutocomplete
                  query={state.query}
                  onComplete={(completion) => {
                    const fullValue = state.query + completion
                    setState(prev => ({
                      ...prev,
                      query: fullValue,
                      type: detectSearchType(fullValue)
                    }))
                  }}
                />
              </div>
            )}
          </div>

          {/* 右侧控件 */}
          <div className="absolute right-1.5 sm:right-2 flex items-center space-x-1 sm:space-x-2">
            {/* 搜索类型指示器 */}
            <Card className="px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-secondary">
              <CardContent className="p-0 flex items-center space-x-0.5 sm:space-x-1 text-xs">
                {getTypeIcon()}
                <span className="hidden md:inline text-xs">
                  {formatSearchTypeText(state.type, t)}
                </span>
              </CardContent>
            </Card>

            {/* 搜索按钮 */}
            <Button
              onClick={() => handleSearch()}
              className="h-7 sm:h-8 md:h-10 px-2 sm:px-3 md:px-4 rounded-full text-xs sm:text-sm md:text-base"
              disabled={!state.query.trim() || disabled}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {loading || state.loading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden md:inline">{t('common.search')}</span>
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 md:hidden" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 下拉建议面板 */}
        {state.isOpen && (showSuggestions || showHistory || showAutocomplete) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 sm:mt-2 rounded-lg shadow-lg border bg-background z-50 max-h-80 sm:max-h-96 overflow-y-auto"
          >
            {/* 搜索历史 */}
            {showHistory && !state.query && (
              <CompactSearchHistory
                onSelect={handleHistorySelect}
                maxItems={10}
              />
            )}

            {/* 自动补全 */}
            {showAutocomplete && state.query && (
              <SearchAutocomplete
                query={state.query}
                onSelect={handleAutocompleteSelect}
                maxOptions={3}
              />
            )}

            {/* 搜索建议 */}
            {showSuggestions && (
              <CompactSearchSuggestions
                query={state.query}
                onSelect={handleSuggestionSelect}
                maxSuggestions={maxSuggestions}
              />
            )}
          </div>
        )}
      </div>

      {/* 搜索类型提示 */}
      {state.query && (
        <div className="text-xs sm:text-sm text-muted-foreground text-center px-4">
          <span className="hidden sm:inline">{t('search.searchTypeDetected')} </span>
          <span className="font-medium text-foreground">{formatSearchTypeText(state.type, t)}</span>
          <div className="mt-1 sm:mt-0 sm:inline">
            {state.type === 'domain' && (
              <span className="block sm:inline"> - {t('search.willCheckAvailability')}</span>
            )}
            {state.type === 'prefix' && (
              <span className="block sm:inline"> - {t('search.willCheckTlds')}</span>
            )}
            {state.type === 'suffix' && (
              <span className="block sm:inline"> - {t('search.willShowPriceComparison')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
