"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, TrendingUp, TrendingDown, Star, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

  const fetchPricing = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/pricing?domain=${encodeURIComponent(domain)}&order=${sortBy}&currency=${currency}`)
      const data = await response.json()
      setPricing(data.pricing || [])
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
    } finally {
      setLoading(false)
    }
  }, [domain, sortBy, currency])

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
            <CardDescription>
              对比 {pricing.length} 家注册商的价格
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">注册价格</SelectItem>
                <SelectItem value="renew">续费价格</SelectItem>
                <SelectItem value="transfer">转入价格</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="CNY">CNY</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
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
                                <Award className="w-3 h-3 mr-1" />
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
