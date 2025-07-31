"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ExternalLink, Search, ShoppingCart, Globe, Eye, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RegistrarLogo } from '@/components/registrar-logos'
import { getRegistrarOfficialUrl } from '@/lib/registrar-urls'

interface StreamingResult {
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

interface StreamingSearchResultsProps {
  query: string
  type: string
  page?: number
  limit?: number
  onComplete?: (results: StreamingResult[]) => void
}

interface StreamEvent {
  type: 'init' | 'query_start' | 'query_result' | 'query_error' | 'progress' | 'complete' | 'error'
  data: any
}

export function StreamingSearchResults({
  query,
  type,
  page = 1,
  limit = 10,
  onComplete
}: StreamingSearchResultsProps) {
  const [results, setResults] = useState<StreamingResult[]>([])
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [currentQuery, setCurrentQuery] = useState<{ index: number; domain: string } | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [pagination, setPagination] = useState<any>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const resultsMapRef = useRef<Map<string, StreamingResult>>(new Map())

  const startStreaming = useCallback(() => {
    // 清理之前的连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    
    // 重置状态
    setResults([])
    setProgress({ completed: 0, total: 0, percentage: 0 })
    setCurrentQuery(null)
    setError(null)
    setIsComplete(false)
    setIsConnected(false)
    resultsMapRef.current.clear()

    // 构建流式API URL
    const params = new URLSearchParams({
      q: query,
      type: type,
      page: page.toString(),
      limit: limit.toString()
    })

    const streamUrl = `/api/search/stream?${params.toString()}`
    console.log(`🚀 Starting SSE stream: ${streamUrl}`)

    // 创建EventSource连接
    const eventSource = new EventSource(streamUrl)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const streamEvent: StreamEvent = JSON.parse(event.data)
        console.log(`📨 SSE event:`, streamEvent.type, streamEvent.data)

        switch (streamEvent.type) {
          case 'init':
            console.log('📋 Stream initialized:', streamEvent.data)
            setPagination(streamEvent.data.pagination)
            setProgress({ completed: 0, total: streamEvent.data.pagination?.per_page || limit, percentage: 0 })
            break

          case 'query_start':
            console.log(`🔍 Query started for ${streamEvent.data.domain}`)
            setCurrentQuery({
              index: streamEvent.data.index,
              domain: streamEvent.data.domain
            })
            break

          case 'query_result':
            console.log(`✅ Query result for ${streamEvent.data.domain}:`, streamEvent.data.is_available)
            const resultData: StreamingResult = {
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

            // 更新结果映射
            resultsMapRef.current.set(resultData.domain, resultData)
            
            // 更新结果数组（保持顺序）
            setResults(prev => {
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
            console.warn(`❌ Query error for ${streamEvent.data.domain}:`, streamEvent.data.error)
            const errorResult: StreamingResult = {
              domain: streamEvent.data.domain,
              tld: streamEvent.data.tld,
              is_available: null,
              error: streamEvent.data.error,
              market_share: 0,
              category: 'generic',
              popularity: 50,
              top_registrars: [],
              query_time_ms: streamEvent.data.query_time_ms
            }

            resultsMapRef.current.set(errorResult.domain, errorResult)
            setResults(prev => {
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
            console.log(`📊 Progress: ${streamEvent.data.completed}/${streamEvent.data.total} (${streamEvent.data.percentage}%)`)
            setProgress({
              completed: streamEvent.data.completed,
              total: streamEvent.data.total,
              percentage: streamEvent.data.percentage
            })
            break

          case 'complete':
            console.log('🎉 Stream complete:', streamEvent.data)
            setIsComplete(true)
            setCurrentQuery(null)
            const finalResults = Array.from(resultsMapRef.current.values())
            if (onComplete) {
              onComplete(finalResults)
            }
            break

          case 'error':
            console.error('💥 Stream error:', streamEvent.data.error)
            setError(streamEvent.data.error)
            setIsComplete(true)
            setCurrentQuery(null)
            break
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      setError('Connection to server lost. Please try again.')
      setIsConnected(false)
      setIsComplete(true)
      setCurrentQuery(null)
    }

    // 清理函数
    return () => {
      eventSource.close()
    }
  }, [query, type, page, limit, onComplete])

  // 启动流式查询
  useEffect(() => {
    if (query && type === 'prefix') {
      const cleanup = startStreaming()
      return cleanup
    }
  }, [query, type, page, limit, startStreaming])

  // 组件卸载时清理连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  // 获取注册商URL的辅助函数
  const getRegistrarUrl = useCallback((registrar: string, registrarCode?: string) => {
    if (registrarCode) {
      return getRegistrarOfficialUrl(registrarCode, '')
    }
    
    const code = registrar.toLowerCase()
    return getRegistrarOfficialUrl(code, '')
  }, [])

  return (
    <div className="space-y-6">
      {/* 进度显示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>实时域名查询</span>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "已连接" : "连接中"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 查询进度 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>查询进度</span>
                <span>{progress.completed}/{progress.total} ({progress.percentage}%)</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>

            {/* 当前查询状态 */}
            {currentQuery && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>正在查询: {currentQuery.domain}</span>
              </div>
            )}

            {/* 分页信息 */}
            {pagination && (
              <div className="text-sm text-muted-foreground">
                第 {pagination.current_page} 页，共 {pagination.total_pages} 页 (总共 {pagination.total_items} 个TLD)
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 错误显示 */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 实时结果显示 */}
      <div className="space-y-3">
        <AnimatePresence>
          {results.map((result, index) => (
            <motion.div
              key={result.domain}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`domain-result-card ${result.is_available === true ? 'border-green-200' : result.is_available === false ? 'border-red-200' : 'border-yellow-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    {/* 域名和状态 */}
                    <div className="flex items-center space-x-3">
                      <div className="font-mono text-lg font-bold">
                        {result.domain}
                      </div>
                      <Badge
                        variant={result.is_available === true ? "default" : result.is_available === false ? "secondary" : "outline"}
                        className={
                          result.is_available === true
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : result.is_available === false
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }
                      >
                        {result.is_available === true ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            可注册
                          </>
                        ) : result.is_available === false ? (
                          <>
                            <X className="w-3 h-3 mr-1" />
                            已注册
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {result.error ? '查询失败' : '查询中'}
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* 查询时间 */}
                    {result.query_time_ms && (
                      <div className="text-xs text-muted-foreground">
                        {result.query_time_ms}ms
                      </div>
                    )}
                  </div>

                  {/* 注册商信息 */}
                  {result.top_registrars && result.top_registrars.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      {result.top_registrars.slice(0, 3).map((registrar, regIndex) => (
                        <div
                          key={registrar.registrar}
                          className={`p-2 rounded border cursor-pointer transition-all hover:shadow-md ${
                            regIndex === 0
                              ? 'border-green-300 bg-green-50'
                              : 'border-border bg-muted/50'
                          }`}
                          onClick={() => {
                            const url = getRegistrarUrl(registrar.registrar, registrar.registrarCode)
                            window.open(url, '_blank')
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-sm">{registrar.registrar}</div>
                            {regIndex === 0 && (
                              <Badge className="bg-green-600 text-white text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                最低价
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>注册: <span className="font-semibold text-primary">${registrar.registrationPrice}</span></span>
                            <span>续费: <span className="font-semibold text-orange-600">${registrar.renewalPrice}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {result.is_available === true ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          if (result.top_registrars && result.top_registrars[0]) {
                            const url = getRegistrarUrl(result.top_registrars[0].registrar, result.top_registrars[0].registrarCode)
                            window.open(url, '_blank')
                          }
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        立即注册
                      </Button>
                    ) : result.is_available === false ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          window.location.href = `/domain/${encodeURIComponent(result.domain)}`
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        查看详情
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1"
                        disabled
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {result.error ? '查询失败' : '查询中'}
                      </Button>
                    )}
                  </div>

                  {/* 错误信息 */}
                  {result.error && (
                    <div className="mt-2 text-xs text-red-600">
                      错误: {result.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 完成状态 */}
      {isComplete && !error && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <Check className="h-5 w-5" />
              <span>查询完成！共查询了 {results.length} 个域名</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}