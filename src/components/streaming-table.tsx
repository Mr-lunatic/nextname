"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ExternalLink, Search, ShoppingCart, Globe, Eye, AlertCircle, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, SortAsc } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RegistrarLogo } from '@/components/registrar-logos'
import { getRegistrarOfficialUrl } from '@/lib/registrar-urls'

interface StreamingTableResult {
  domain: string
  tld: string
  is_available: boolean | null
  registrar?: string
  expiry_date?: string
  estimated_price?: number
  market_share: number
  category: string
  popularity: number
  top_registrars?: any[]
  query_time_ms?: number
  error?: string
}

interface StreamingTableProps {
  query: string
  type: string
  page?: number
  limit?: number
  prefix: string
  fallbackData: any[]
  pagination: any
  filter: string
  sortBy: string
  availabilityFilter: 'all' | 'available' | 'registered'
  onPageChange: (page: number) => void
  getTldString: (item: any) => string
}

interface StreamEvent {
  type: 'init' | 'query_start' | 'query_result' | 'query_error' | 'progress' | 'complete' | 'error'
  data: any
}

export function StreamingSearchTable({
  query,
  type,
  page = 1,
  limit = 10,
  prefix,
  fallbackData,
  pagination,
  filter,
  sortBy,
  availabilityFilter,
  onPageChange,
  getTldString
}: StreamingTableProps) {
  const [streamResults, setStreamResults] = useState<StreamingTableResult[]>([])
  const [streamProgress, setStreamProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamComplete, setStreamComplete] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const resultsMapRef = useRef<Map<string, StreamingTableResult>>(new Map())

  // 启动流式查询
  const startStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    setStreamResults([])
    setStreamProgress({ completed: 0, total: 0, percentage: 0 })
    setStreamError(null)
    setStreamComplete(false)
    setIsStreaming(true)
    resultsMapRef.current.clear()

    const params = new URLSearchParams({
      q: query,
      type: type,
      page: page.toString(),
      limit: limit.toString()
    })

    const streamUrl = `/api/search/stream?${params.toString()}`
    console.log(`🚀 Starting streaming for table: ${streamUrl}`)

    const eventSource = new EventSource(streamUrl)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const streamEvent: StreamEvent = JSON.parse(event.data)

        switch (streamEvent.type) {
          case 'init':
            setStreamProgress({ completed: 0, total: streamEvent.data.pagination?.per_page || limit, percentage: 0 })
            break

          case 'query_result':
            const resultData: StreamingTableResult = {
              domain: streamEvent.data.domain,
              tld: streamEvent.data.tld,
              is_available: streamEvent.data.is_available,
              registrar: streamEvent.data.registrar,
              expiry_date: streamEvent.data.expiry_date,
              estimated_price: streamEvent.data.estimated_price,
              market_share: streamEvent.data.market_share,
              category: streamEvent.data.category,
              popularity: streamEvent.data.popularity,
              top_registrars: streamEvent.data.top_registrars || [],
              query_time_ms: streamEvent.data.query_time_ms
            }

            resultsMapRef.current.set(resultData.domain, resultData)
            setStreamResults(prev => {
              const updated = [...prev]
              const existingIndex = updated.findIndex(r => r.domain === resultData.domain)
              if (existingIndex >= 0) {
                updated[existingIndex] = resultData
              } else {
                updated.push(resultData)
              }
              return updated.sort((a, b) => a.domain.localeCompare(b.domain))
            })
            break

          case 'query_error':
            const errorResult: StreamingTableResult = {
              domain: streamEvent.data.domain,
              tld: streamEvent.data.tld,
              is_available: null,
              error: streamEvent.data.error,
              market_share: streamEvent.data.market_share || 0,
              category: streamEvent.data.category || 'generic',
              popularity: streamEvent.data.popularity || 50,
              top_registrars: streamEvent.data.top_registrars || [],
              query_time_ms: streamEvent.data.query_time_ms,
              estimated_price: streamEvent.data.estimated_price
            }

            resultsMapRef.current.set(errorResult.domain, errorResult)
            setStreamResults(prev => {
              const updated = [...prev]
              const existingIndex = updated.findIndex(r => r.domain === errorResult.domain)
              if (existingIndex >= 0) {
                updated[existingIndex] = errorResult
              } else {
                updated.push(errorResult)
              }
              return updated.sort((a, b) => a.domain.localeCompare(b.domain))
            })
            break

          case 'progress':
            setStreamProgress({
              completed: streamEvent.data.completed,
              total: streamEvent.data.total,
              percentage: streamEvent.data.percentage
            })
            break

          case 'complete':
            setStreamComplete(true)
            setIsStreaming(false)
            break

          case 'error':
            setStreamError(streamEvent.data.error)
            setStreamComplete(true)
            setIsStreaming(false)
            break
        }
      } catch (error) {
        console.error('Error parsing stream event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('Stream connection error:', error)
      setStreamError('连接到服务器失败，将使用静态数据')
      setIsStreaming(false)
      setStreamComplete(true)
    }
  }, [query, type, page, limit])

  // 启动流式查询
  useEffect(() => {
    if (query && type === 'prefix') {
      startStreaming()
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [query, type, page, limit, startStreaming])

  // 决定使用哪个数据源
  const useStreamResults = streamResults.length > 0 || streamComplete
  const dataSource = useStreamResults ? streamResults : fallbackData.map(item => ({
    domain: item.domain,
    tld: item.tld || getTldString(item),
    is_available: item.is_available,
    registrar: item.registrar,
    expiry_date: item.expiry_date,
    estimated_price: item.estimated_price,
    market_share: item.market_share,
    category: item.category,
    popularity: item.popularity,
    top_registrars: item.top_registrars || [],
    query_time_ms: item.response_time || item.query_time_ms,
    error: item.error
  }))

  // 应用筛选和排序
  const filteredResults = dataSource.filter((item: any) => {
    const tldString = item.tld
    const matchesTextFilter = tldString && typeof tldString === 'string' && tldString.toLowerCase().includes(filter.toLowerCase())

    let matchesAvailabilityFilter = true
    if (availabilityFilter === 'available') {
      matchesAvailabilityFilter = item.is_available === true
    } else if (availabilityFilter === 'registered') {
      matchesAvailabilityFilter = item.is_available === false
    }

    return matchesTextFilter && matchesAvailabilityFilter
  })
  
  const sortedResults = [...filteredResults].sort((a: any, b: any) => {
    if (sortBy === 'price') {
      return (a.estimated_price || 999) - (b.estimated_price || 999)
    } else if (sortBy === 'popularity') {
      return (b.popularity || 0) - (a.popularity || 0)
    } else if (sortBy === 'marketShare') {
      return (b.market_share || 0) - (a.market_share || 0)
    }
    return a.domain.localeCompare(b.domain)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Enhanced Header with streaming status */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gradient-premium">
              &quot;{prefix}&quot; 域名建议
            </h2>
            
            {/* 流式查询状态 */}
            {(isStreaming || useStreamResults) && (
              <div className="flex items-center space-x-2 text-sm">
                {isStreaming ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600">实时查询中... ({streamProgress.completed}/{streamProgress.total})</span>
                  </>
                ) : streamComplete ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600">实时查询完成 ⚡</span>
                  </>
                ) : null}
              </div>
            )}

            {pagination?.tld_stats && (
              <p className="text-xs text-muted-foreground">
                系统支持 {pagination.tld_stats.total_supported} 个TLD，数据更新于 {new Date(pagination.tld_stats.last_updated).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Pagination Info */}
        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <div>
              显示第 {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} 项，共 {pagination.total_items} 项
            </div>
            <div>
              第 {pagination.current_page} 页，共 {pagination.total_pages} 页
            </div>
          </div>
        )}
      </div>
      
      {/* 桌面端表格布局 - 保持原有样式 */}
      <div className="hidden lg:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* 表头 */}
              <thead className="table-header border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">域名</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">注册商</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">注册商</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">注册商</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">状态</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">操作</th>
                </tr>
              </thead>

              {/* 表体 */}
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {sortedResults.map((item: any, index: number) => (
                    <motion.tr
                      key={item.domain || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="search-table-row group table-row"
                    >
                      {/* 域名列 */}
                      <td className="px-6 py-6">
                        <div className="font-mono text-lg font-bold text-primary group-hover:text-primary/80">
                          {item.domain}
                        </div>
                      </td>

                      {/* 注册商价格列 */}
                      {[0, 1, 2].map((registrarIndex) => (
                        <td key={registrarIndex} className="px-4 py-6 text-center">
                          {item.top_registrars && item.top_registrars[registrarIndex] ? (
                            <div
                              className={`card-interactive rounded-lg p-3 min-h-[80px] flex flex-col justify-center ${
                                registrarIndex === 0
                                  ? 'bg-ds-accent/10 border border-ds-accent/20 text-ds-accent'
                                  : 'bg-ds-surface-secondary border border-ds-border-default'
                              }`}
                              onClick={() => {
                                const registrarCode = item.top_registrars[registrarIndex].registrarCode ||
                                                   item.top_registrars[registrarIndex].registrar.toLowerCase();
                                const registrarUrl = getRegistrarOfficialUrl(registrarCode, '');
                                window.open(registrarUrl, '_blank');
                              }}
                            >
                              <div className="font-medium text-foreground text-sm mb-2 truncate">
                                {item.top_registrars[registrarIndex].registrar}
                              </div>
                              <div className="space-y-1">
                                {item.is_available === true ? (
                                  <>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">注册:</span>
                                      <span className="price-highlight ml-1">
                                        ${item.top_registrars[registrarIndex].registrationPrice}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">续费:</span>
                                      <span className="text-orange-600 font-semibold ml-1">
                                        ${item.top_registrars[registrarIndex].renewalPrice}
                                      </span>
                                    </div>
                                  </>
                                ) : item.is_available === false ? (
                                  <>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">转入:</span>
                                      <span className="text-blue-600 font-semibold ml-1">
                                        ${item.top_registrars[registrarIndex].transferPrice || item.top_registrars[registrarIndex].registrationPrice}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      <span className="font-medium">续费:</span>
                                      <span className="text-orange-600 font-semibold ml-1">
                                        ${item.top_registrars[registrarIndex].renewalPrice}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-center text-muted-foreground">
                                    查询中...
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-3 min-h-[80px] flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">
                                {item.is_available === true ? '暂无数据' : item.is_available === false ? '-' : '查询中'}
                              </span>
                            </div>
                          )}
                        </td>
                      ))}

                      {/* 状态列 */}
                      <td className="px-4 py-6 text-center">
                        <Badge
                          variant={item.is_available === true ? "default" : item.is_available === false ? "secondary" : "outline"}
                          className={`status-badge inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            item.is_available === true
                              ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                              : item.is_available === false
                              ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                          }`}
                        >
                          {item.is_available === true ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              可注册
                            </>
                          ) : item.is_available === false ? (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              已注册
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 mr-1" />
                              查询中
                            </>
                          )}
                        </Badge>
                      </td>

                      {/* 操作列 */}
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {item.is_available === true ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                              onClick={() => {
                                if (item.top_registrars && item.top_registrars[0]) {
                                  const registrarName = item.top_registrars[0].registrar.toLowerCase()
                                  let registrarUrl = ''

                                  switch (registrarName) {
                                    case 'cloudflare':
                                      registrarUrl = 'https://www.cloudflare.com/products/registrar/'
                                      break
                                    case 'porkbun':
                                      registrarUrl = 'https://porkbun.com/'
                                      break
                                    case 'namecheap':
                                      registrarUrl = 'https://www.namecheap.com/'
                                      break
                                    case 'godaddy':
                                      registrarUrl = 'https://www.godaddy.com/'
                                      break
                                    case 'spaceship':
                                      registrarUrl = 'https://www.spaceship.com/'
                                      break
                                    default:
                                      registrarUrl = `https://www.${registrarName}.com/`
                                  }

                                  window.open(registrarUrl, '_blank')
                                } else {
                                  window.open('https://www.cloudflare.com/products/registrar/', '_blank')
                                }
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              注册
                            </Button>
                          ) : item.is_available === false ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.location.href = `/domain/${encodeURIComponent(item.domain)}`
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              WHOIS
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled
                            >
                              <Search className="w-4 h-4 mr-1" />
                              查询中
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 移动端卡片布局 */}
      <div className="lg:hidden space-y-3">
        {/* 移动端分页信息 */}
        {pagination && (
          <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg py-2 px-4">
            <div className="flex flex-col gap-1">
              <div>
                显示第 {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} 项，共 {pagination.total_items} 项
              </div>
              <div className="text-xs">
                第 {pagination.current_page} 页，共 {pagination.total_pages} 页
              </div>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {sortedResults.map((item: any, index: number) => (
            <motion.div
              key={item.domain || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="mobile-domain-card overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* 域名和状态 */}
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg font-bold text-primary">
                        {item.domain}
                      </div>
                      <Badge
                        variant={item.is_available === true ? "default" : item.is_available === false ? "secondary" : "outline"}
                        className={
                          item.is_available === true
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : item.is_available === false
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                        }
                      >
                        {item.is_available === true ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            可注册
                          </>
                        ) : item.is_available === false ? (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            已注册
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            查询中
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* 注册商价格 - 移动端简化显示 */}
                    {item.top_registrars && item.top_registrars.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-medium">最优价格对比</div>
                        <div className="grid grid-cols-1 gap-2">
                          {item.top_registrars.slice(0, 2).map((registrar: any, registrarIndex: number) => (
                            <div
                              key={registrar.registrar}
                              className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                                registrarIndex === 0
                                  ? 'border-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                                  : 'border-border bg-muted/50 hover:bg-muted/70'
                              }`}
                              onClick={() => {
                                const registrarCode = registrar.registrarCode || registrar.registrar.toLowerCase();
                                const registrarUrl = getRegistrarOfficialUrl(registrarCode, '');
                                window.open(registrarUrl, '_blank');
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-sm">{registrar.registrar}</div>
                                {registrarIndex === 0 && (
                                  <Badge className="bg-green-600 text-white text-xs">
                                    <span className="hidden sm:inline">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                    </span>
                                    <span className="sm:hidden w-1 h-1 bg-white rounded-full mr-1"></span>
                                    最低价
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2 text-xs">
                                <span>注册: <span className="font-semibold text-primary">${registrar.registrationPrice}</span></span>
                                <span>续费: <span className="font-semibold text-orange-600">${registrar.renewalPrice}</span></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      {item.is_available === true ? (
                        <Button
                          size="sm"
                          className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            if (item.top_registrars && item.top_registrars[0]) {
                              const registrarName = item.top_registrars[0].registrar.toLowerCase()
                              let registrarUrl = ''

                              switch (registrarName) {
                                case 'cloudflare':
                                  registrarUrl = 'https://www.cloudflare.com/products/registrar/'
                                  break
                                case 'porkbun':
                                  registrarUrl = 'https://porkbun.com/'
                                  break
                                case 'namecheap':
                                  registrarUrl = 'https://www.namecheap.com/'
                                  break
                                case 'godaddy':
                                  registrarUrl = 'https://www.godaddy.com/'
                                  break
                                case 'spaceship':
                                  registrarUrl = 'https://www.spaceship.com/'
                                  break
                                default:
                                  registrarUrl = `https://www.${registrarName}.com/`
                              }

                              window.open(registrarUrl, '_blank')
                            } else {
                              window.open('https://www.cloudflare.com/products/registrar/', '_blank')
                            }
                          }}
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          立即注册
                        </Button>
                      ) : item.is_available === false ? (
                        <div className="flex gap-2 flex-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => {
                              window.location.href = `/domain/${encodeURIComponent(item.domain)}`
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            已注册
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-muted-foreground"
                            disabled
                          >
                            到期时间
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 text-xs"
                          disabled
                        >
                          <Search className="w-3 h-3 mr-1" />
                          查询中
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 底部统计信息 */}
      {sortedResults.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  {availabilityFilter === 'all' ? '共查询' : availabilityFilter === 'available' ? '可注册' : '已注册'}
                  <span className="font-semibold text-foreground ml-1">{sortedResults.length}</span> 个域名
                </span>
                {availabilityFilter === 'all' && (
                  <>
                    <span className="hidden sm:inline">|</span>
                    <span>
                      其中 <span className="font-semibold text-green-600">{sortedResults.filter((item: any) => item.is_available === true).length}</span> 个可注册
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  导出结果
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedResults.length === 0 && (
        <Card className="mt-6">
          <CardContent className="text-center py-20">
            <div className="space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-semibold">未找到匹配的域名</h3>
              <p className="text-muted-foreground">
                尝试调整筛选条件或搜索其他关键词
              </p>
              <Button onClick={() => {}} variant="outline">
                清除筛选条件
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 分页保持不变 */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_prev_page}
            onClick={() => onPageChange(pagination.current_page - 1)}
          >
            上一页
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(pagination.current_page - 2, pagination.total_pages - 4)) + i
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.current_page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={pageNum === pagination.current_page ? "bg-primary text-primary-foreground" : ""}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.has_next_page}
            onClick={() => onPageChange(pagination.current_page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </motion.div>
  )
}