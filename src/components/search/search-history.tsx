"use client"

import { useState, useEffect, useCallback } from 'react'
import { Clock, X, RotateCcw } from 'lucide-react'
import { SearchHistoryItem, SearchType } from './search-types'
import { formatSearchTypeText, getSearchTypeIcon } from './search-utils'
import { useTranslations } from '@/hooks/useTranslations'

interface SearchHistoryProps {
  onSelect: (query: string, type: SearchType) => void
  onClear?: () => void
  maxItems?: number
  className?: string
}

// 本地存储键名
const STORAGE_KEY = 'nextname_search_history'

/**
 * 搜索历史管理Hook
 */
export function useSearchHistory(maxItems: number = 10) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  // 从本地存储加载历史记录
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[]
        setHistory(parsed.slice(0, maxItems))
      }
    } catch (error) {
      console.warn('Failed to load search history:', error)
    }
  }, [maxItems])

  // 保存历史记录到本地存储
  const saveHistory = useCallback((newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.warn('Failed to save search history:', error)
    }
  }, [])

  // 添加搜索记录
  const addToHistory = useCallback((query: string, type: SearchType, resultCount?: number) => {
    if (!query.trim()) return

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      type,
      timestamp: Date.now(),
      resultCount
    }

    setHistory(prevHistory => {
      // 移除重复项
      const filtered = prevHistory.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase().trim()
      )
      
      // 添加新项到开头
      const newHistory = [newItem, ...filtered].slice(0, maxItems)
      
      // 保存到本地存储
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
      } catch (error) {
        console.warn('Failed to save search history:', error)
      }
      
      return newHistory
    })
  }, [maxItems])

  // 移除单个历史记录
  const removeFromHistory = useCallback((query: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(item => item.query !== query)
      saveHistory(newHistory)
      return newHistory
    })
  }, [saveHistory])

  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear search history:', error)
    }
  }, [])

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}

/**
 * 搜索历史组件
 */
export function SearchHistory({ 
  onSelect, 
  onClear, 
  maxItems = 10, 
  className = '' 
}: SearchHistoryProps) {
  const { t } = useTranslations()
  const { history, removeFromHistory, clearHistory } = useSearchHistory(maxItems)

  const handleSelect = (item: SearchHistoryItem) => {
    onSelect(item.query, item.type)
  }

  const handleRemove = (e: React.MouseEvent, query: string) => {
    e.stopPropagation()
    removeFromHistory(query)
  }

  const handleClear = () => {
    clearHistory()
    onClear?.()
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return t('time.justNow')
    if (minutes < 60) return t('time.minutesAgo', { count: minutes })
    if (hours < 24) return t('time.hoursAgo', { count: hours })
    return t('time.daysAgo', { count: days })
  }

  if (history.length === 0) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{t('search.noHistory')}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 标题和清空按钮 */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {t('search.recentSearches')}
          </span>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={t('search.clearHistory')}
        >
          <RotateCcw className="h-3 w-3" />
          <span className="hidden sm:inline">{t('common.clear')}</span>
        </button>
      </div>

      {/* 历史记录列表 */}
      <div className="space-y-1">
        {history.map((item, index) => (
          <div
            key={`${item.query}-${item.timestamp}`}
            onClick={() => handleSelect(item)}
            className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
          >
            {/* 搜索类型图标 */}
            <div className="flex-shrink-0 text-lg">
              {getSearchTypeIcon(item.type)}
            </div>

            {/* 搜索内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{item.query}</span>
                <span className="text-xs px-2 py-0.5 bg-secondary rounded-full text-muted-foreground">
                  {formatSearchTypeText(item.type, t)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatTimestamp(item.timestamp)}</span>
                {item.resultCount !== undefined && (
                  <>
                    <span>•</span>
                    <span>{t('search.resultCount', { count: item.resultCount })}</span>
                  </>
                )}
              </div>
            </div>

            {/* 删除按钮 */}
            <button
              onClick={(e) => handleRemove(e, item.query)}
              className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
              title={t('search.removeFromHistory')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* 历史记录统计 */}
      {history.length > 0 && (
        <div className="px-3 py-2 text-xs text-muted-foreground text-center border-t">
          {t('search.historyCount', { count: history.length, max: maxItems })}
        </div>
      )}
    </div>
  )
}

/**
 * 紧凑版搜索历史组件（用于下拉建议）
 */
export function CompactSearchHistory({ 
  onSelect, 
  maxItems = 5, 
  className = '' 
}: Omit<SearchHistoryProps, 'onClear'>) {
  const { t } = useTranslations()
  const { history } = useSearchHistory(maxItems)

  if (history.length === 0) return null

  return (
    <div className={className}>
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
        {t('search.recentSearches')}
      </div>
      <div className="space-y-1 p-1">
        {history.slice(0, maxItems).map((item) => (
          <div
            key={`${item.query}-${item.timestamp}`}
            onClick={() => onSelect(item.query, item.type)}
            className="flex items-center gap-2 px-2 py-2 rounded hover:bg-secondary cursor-pointer transition-colors"
          >
            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate flex-1">{item.query}</span>
            <span className="text-xs text-muted-foreground">
              {getSearchTypeIcon(item.type)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
