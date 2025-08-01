"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, TrendingUp, TrendingDown, Star, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataSourceIndicator } from '@/components/data-source-indicator'

interface PriceInfo {
  registrar: string
  new_price: number
  renew_price: number
  transfer_price: number
  currency: string
  has_promo: boolean
}

interface PriceComparisonProps {
  domain: string
  onClose?: () => void
}

export function PriceComparison({ domain, onClose }: PriceComparisonProps) {
  const [pricing, setPricing] = useState<PriceInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('new')
  const [currency, setCurrency] = useState('USD')
  const [dataSource, setDataSource] = useState<string>('')
  const [metadata, setMetadata] = useState<any>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const pageSize = 10

  const fetchPricing = useCallback(async (forceSource?: string, page: number = currentPage) => {
    setLoading(true)
    try {
      const url = `/api/pricing?domain=${encodeURIComponent(domain)}&order=${sortBy}&page=${page}&pageSize=${pageSize}${forceSource ? `&source=${forceSource}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setPricing(data.pricing || [])
        setDataSource(data.source || '')
        setMetadata(data.metadata || null)
        setPagination(data.pagination || null)
      } else {
        console.error('API error:', data)
        setPricing([])
        setPagination(null)
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
      setPricing([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [domain, sortBy, currentPage, pageSize])

  // 分页控制函数
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchPricing(undefined, newPage)
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    setCurrentPage(1) // 重置到第一页
  }

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  const getLowestPrice = (type: 'new_price' | 'renew_price' | 'transfer_price') => {
    if (pricing.length === 0) return null
    return Math.min(...pricing.map(p => p[type]))
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(price)
  }

  const getSavings = (price: number, type: 'new_price' | 'renew_price' | 'transfer_price') => {
    const lowest = getLowestPrice(type)
    if (!lowest || price === lowest) return 0
    return ((price - lowest) / lowest * 100)
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>价格对比</span>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>正在获取 {domain} 的价格信息...</p>
        </CardContent>
      </Card>
    )
  }

  if (pricing.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>价格对比</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">暂无 {domain} 的价格信息</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <CardTitle className="text-2xl">
              {domain} 价格对比
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              对比 {pricing.length} 家注册商的价格
              <DataSourceIndicator
                source={dataSource}
                metadata={metadata}
                onRefresh={() => fetchPricing()}
              />
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">注册价格</SelectItem>
                <SelectItem value="renew">续费价格</SelectItem>
                <SelectItem value="transfer">转入价格</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPricing('d1')}
              disabled={loading}
            >
              D1数据
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPricing('nazhumi')}
              disabled={loading}
            >
              实时数据
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pricing.map((price, index) => {
            const isLowestNew = price.new_price === getLowestPrice('new_price')
            const isLowestRenew = price.renew_price === getLowestPrice('renew_price')
            const isLowestTransfer = price.transfer_price === getLowestPrice('transfer_price')
            const savings = getSavings(price[sortBy === 'new' ? 'new_price' : sortBy === 'renew' ? 'renew_price' : 'transfer_price'], sortBy === 'new' ? 'new_price' : sortBy === 'renew' ? 'renew_price' : 'transfer_price')
            
            return (
              <motion.div
                key={price.registrar}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`transition-all hover:shadow-md ${
                  (sortBy === 'new' && isLowestNew) ||
                  (sortBy === 'renew' && isLowestRenew) ||
                  (sortBy === 'transfer' && isLowestTransfer)
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-primary text-sm">
                            {price.registrar.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{price.registrar}</h3>
                          <div className="flex items-center space-x-2">
                            {price.has_promo && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                有优惠
                              </Badge>
                            )}
                            {(
                              (sortBy === 'new' && isLowestNew) ||
                              (sortBy === 'renew' && isLowestRenew) ||
                              (sortBy === 'transfer' && isLowestTransfer)
                            ) && (
                              <Badge className="text-xs">
                                {/* 移动端隐藏图标，只显示文字 */}
                                <span className="hidden sm:inline">
                                  <Award className="w-3 h-3 mr-1" />
                                </span>
                                <span className="sm:hidden w-1 h-1 bg-current rounded-full mr-1"></span>
                                最低价
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
                        <div className="grid grid-cols-3 gap-4 text-center flex-1 sm:flex-none">
                          <div className={`${isLowestNew ? 'text-green-600 font-bold' : ''}`}>
                            <div className="text-xs text-muted-foreground">注册</div>
                            <div className="text-lg">{formatPrice(price.new_price)}</div>
                          </div>
                          <div className={`${isLowestRenew ? 'text-green-600 font-bold' : ''}`}>
                            <div className="text-xs text-muted-foreground">续费</div>
                            <div className="text-lg">{formatPrice(price.renew_price)}</div>
                          </div>
                          <div className={`${isLowestTransfer ? 'text-green-600 font-bold' : ''}`}>
                            <div className="text-xs text-muted-foreground">转入</div>
                            <div className="text-lg">{formatPrice(price.transfer_price)}</div>
                          </div>
                        </div>
                        
                        {savings > 0 && (
                          <div className="flex items-center space-x-1 text-red-500 text-sm">
                            <TrendingUp className="w-4 h-4" />
                            <span>+{savings.toFixed(1)}%</span>
                          </div>
                        )}
                        
                        <Button size="sm" className="w-full sm:w-auto">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          访问
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* 分页控件 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              显示第 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} 条，
              共 {pagination.totalRecords} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                上一页
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    Math.max(1, currentPage - 2)
                  )) + i;

                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">价格说明</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 注册价格：首次注册域名的费用</li>
            <li>• 续费价格：每年续费的标准价格</li>
            <li>• 转入价格：从其他注册商转入的费用</li>
            <li>• 价格会根据汇率和优惠活动实时变动</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
