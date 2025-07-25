"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { motion } from 'framer-motion'
import { ExternalLink, Loader2, BarChart3, Shield, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RegistrarLogo } from '@/components/registrar-logos'

interface RegistrarPrice {
  registrar: string
  registrarCode?: string
  registrarLogo?: string
  registrarUrl?: string
  registrationPrice: number | null
  renewalPrice: number | null
  transferPrice: number | null
  currency: string
  features: string[]
  rating: number
  isPopular?: boolean
  isPremium?: boolean
  hasPromo?: boolean
  updatedTime?: string
}

interface SuffixResultProps {
  suffix: string
  registrarPrices?: RegistrarPrice[]
}

export function SuffixResult({ suffix, registrarPrices = [] }: SuffixResultProps) {
  const t = useTranslations()
  const [pricing, setPricing] = useState<RegistrarPrice[]>(registrarPrices)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const pageSize = 10

  // 排序状态
  const [sortColumn, setSortColumn] = useState<'registration' | 'renewal' | 'transfer'>('registration')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const fetchPricingData = useCallback(async (page: number = currentPage) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/pricing?domain=${encodeURIComponent(suffix)}&order=new&page=${page}&pageSize=${pageSize}`)
      const data = await response.json()

      if (response.ok) {
        setPricing(data.pricing || [])
        setPagination(data.pagination || null)
      } else {
        setError(data.error || '获取价格信息失败')
        setPricing([])
        setPagination(null)
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      setPricing([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }, [suffix, currentPage, pageSize])

  useEffect(() => {
    fetchPricingData()
  }, [fetchPricingData])

  // 分页处理函数
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchPricingData(newPage)
  }

  // 排序处理函数
  const handleSort = (column: 'registration' | 'renewal' | 'transfer') => {
    if (sortColumn === column) {
      // 如果点击的是当前排序列，切换排序方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果点击的是新列，设置为该列并默认升序
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // 获取排序图标
  const getSortIcon = (column: 'registration' | 'renewal' | 'transfer') => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 text-primary" /> :
      <ArrowDown className="w-4 h-4 text-primary" />
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'N/A'
    const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency
    return `${symbol}${price.toFixed(2)}`
  }

  const getSortedPrices = () => {
    return [...pricing].sort((a, b) => {
      let priceA: number, priceB: number

      switch (sortColumn) {
        case 'registration':
          priceA = a.registrationPrice || 999
          priceB = b.registrationPrice || 999
          break
        case 'renewal':
          priceA = a.renewalPrice || 999
          priceB = b.renewalPrice || 999
          break
        case 'transfer':
          priceA = a.transferPrice || 999
          priceB = b.transferPrice || 999
          break
        default:
          priceA = a.registrationPrice || 999
          priceB = b.registrationPrice || 999
      }

      return sortDirection === 'asc' ? priceA - priceB : priceB - priceA
    })
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-12">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-lg">正在获取 {suffix} 的价格信息...</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-lg">获取价格信息失败</div>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8 space-y-6"
      >
        {/* Header */}
        <Card className="border-l-4 surface" style={{ borderLeftColor: 'var(--color-accent-default)' }}>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <CardTitle className="text-h1" style={{ color: 'var(--color-text-primary)' }}>
                  {suffix}
                </CardTitle>
                {error && (
                  <div className="mt-2">
                    <Badge variant="destructive">
                      ⚠️ 价格数据暂时不可用
                    </Badge>
                  </div>
                )}
              </div>
              <div className="text-center md:text-right">
                <div className="text-sm text-muted-foreground">最低价格</div>
                <div className="text-h2" style={{ color: 'var(--color-accent-default)' }}>
                  {pricing.length > 0 ? formatPrice(
                    Math.min(...pricing.map(r => r.registrationPrice || 999).filter(p => p !== 999)), 
                    pricing[0]?.currency || 'USD'
                  ) : 'N/A'}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Price Comparison Table */}
        {pricing.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span>注册商价格对比</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">注册商</th>
                      <th className="text-center py-3 px-4">
                        <button
                          onClick={() => handleSort('registration')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>首年注册</span>
                          {getSortIcon('registration')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">
                        <button
                          onClick={() => handleSort('renewal')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>续费价格</span>
                          {getSortIcon('renewal')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">
                        <button
                          onClick={() => handleSort('transfer')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>转入价格</span>
                          {getSortIcon('transfer')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedPrices().map((registrar, index) => {
                      const isLowestRegistration = registrar.registrationPrice === Math.min(...pricing.map(p => p.registrationPrice || 999).filter(p => p !== 999))
                      const isLowestRenewal = registrar.renewalPrice === Math.min(...pricing.map(p => p.renewalPrice || 999).filter(p => p !== 999))
                      const isLowestTransfer = registrar.transferPrice === Math.min(...pricing.map(p => p.transferPrice || 999).filter(p => p !== 999))
                      
                      return (
                        <tr key={registrar.registrar} className="border-b hover:bg-muted/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <RegistrarLogo
                                registrar={registrar.registrar}
                                size={32}
                                className="flex-shrink-0"
                              />
                              <div>
                                <div className="font-semibold">{registrar.registrar}</div>
                                {registrar.hasPromo && (
                                  <Badge variant="secondary" className="text-xs">
                                    优惠中
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="font-bold text-lg">
                              {formatPrice(registrar.registrationPrice, registrar.currency)}
                              {isLowestRegistration && (
                                <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="font-bold text-lg text-orange-600">
                              {formatPrice(registrar.renewalPrice, registrar.currency)}
                              {isLowestRenewal && (
                                <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="font-bold text-lg text-blue-600">
                              {formatPrice(registrar.transferPrice, registrar.currency)}
                              {isLowestTransfer && (
                                <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Button size="sm" asChild>
                              <a href={registrar.registrarUrl || '#'} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                注册
                              </a>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分页控件 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-small" style={{ color: 'var(--color-text-secondary)' }}>
              显示第 {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalRecords)} 条，
              共 {pagination.totalRecords} 条记录
            </div>
            <div className="flex items-center space-x-2">
              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                上一页
              </EnhancedButton>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(
                    pagination.totalPages - 4,
                    Math.max(1, currentPage - 2)
                  )) + i;

                  if (pageNum > pagination.totalPages) return null;

                  return (
                    <EnhancedButton
                      key={pageNum}
                      variant={pageNum === currentPage ? "primary" : "secondary"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </EnhancedButton>
                  );
                })}
              </div>

              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                下一页
              </EnhancedButton>
            </div>
          </div>
        )}

        {/* 重要提醒卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>重要提醒</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-small" style={{ color: 'var(--color-text-secondary)' }}>
              <p>• 价格可能因促销活动和地区差异而有所变动</p>
              <p>• 首年注册价格通常与续费价格不同</p>
              <p>• 请注意可能的额外费用，如ICANN费用或隐私保护费用</p>
              <p>• 价格数据来源于nazhumi.com API</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
