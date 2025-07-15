"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Star, Shield, TrendingUp, Globe, Crown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  description?: string
  category?: string
  popularity?: number
}

export function SuffixResult({ suffix, registrarPrices = [], description, category, popularity }: SuffixResultProps) {
  const t = useTranslations()
  const [activeTab, setActiveTab] = useState('registration')
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity'>('price')
  const [pricing, setPricing] = useState<RegistrarPrice[]>(registrarPrices)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch pricing data on component mount
  useEffect(() => {
    fetchPricingData()
  }, [suffix])

  const fetchPricingData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const cleanSuffix = suffix.startsWith('.') ? suffix.substring(1) : suffix
      const response = await fetch(`/api/pricing?domain=${encodeURIComponent(cleanSuffix)}&order=new`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pricing: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.pricing && Array.isArray(data.pricing)) {
        const transformedPricing = data.pricing.map((item: any) => ({
          registrar: item.registrar,
          registrarCode: item.registrarCode,
          registrarUrl: item.registrarUrl,
          registrationPrice: item.registrationPrice,
          renewalPrice: item.renewalPrice,
          transferPrice: item.transferPrice,
          currency: item.currency || 'USD',
          features: item.features || [],
          rating: item.rating || 4.0,
          isPopular: item.isPopular,
          isPremium: item.isPremium,
          hasPromo: item.hasPromo
        }))
        
        setPricing(transformedPricing)
        console.log(`✅ Loaded ${transformedPricing.length} pricing entries for ${suffix}`)
      } else {
        throw new Error('Invalid pricing data format')
      }
    } catch (err) {
      console.error('Error fetching pricing:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch pricing data')
      
      // Use fallback mock data
      setPricing([
        {
          registrar: "Namecheap",
          registrationPrice: 8.88,
          renewalPrice: 13.98,
          transferPrice: 8.98,
          currency: "USD",
          features: ["免费隐私保护", "邮件转发", "DNS管理", "性价比高"],
          rating: 4.5,
          isPopular: true
        },
        {
          registrar: "GoDaddy", 
          registrationPrice: 12.99,
          renewalPrice: 17.99,
          transferPrice: 8.99,
          currency: "USD",
          features: ["24/7客服", "网站建设工具", "邮箱服务", "全球化服务"],
          rating: 4.2,
          isPremium: true
        },
        {
          registrar: "Cloudflare",
          registrationPrice: 8.57,
          renewalPrice: 8.57,
          transferPrice: 8.57,
          currency: "USD",
          features: ["无加价定价", "免费隐私保护", "安全防护", "全球CDN"],
          rating: 4.8,
          isPopular: true
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getSortedPrices = (priceType: 'registration' | 'renewal' | 'transfer') => {
    const prices = [...pricing]
    
    return prices.sort((a, b) => {
      if (sortBy === 'price') {
        const priceA = priceType === 'registration' ? (a.registrationPrice || 999) : 
                      priceType === 'renewal' ? (a.renewalPrice || 999) : (a.transferPrice || 999)
        const priceB = priceType === 'registration' ? (b.registrationPrice || 999) : 
                      priceType === 'renewal' ? (b.renewalPrice || 999) : (b.transferPrice || 999)
        return priceA - priceB
      } else if (sortBy === 'rating') {
        return b.rating - a.rating
      } else {
        // Sort by popularity (popular items first)
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
      }
    })
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'N/A'
    const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency
    return `${symbol}${price.toFixed(2)}`
  }

  const getPopularityBadge = (registrar: RegistrarPrice) => {
    if (registrar.isPopular) {
      return <Badge variant="secondary" className="ml-2"><Star className="w-3 h-3 mr-1" />热门</Badge>
    }
    if (registrar.isPremium) {
      return <Badge variant="outline" className="ml-2"><Crown className="w-3 h-3 mr-1" />优质</Badge>
    }
    if (registrar.hasPromo) {
      return <Badge variant="destructive" className="ml-2">🎁 优惠</Badge>
    }
    return null
  }

  const renderPriceListItem = (registrar: RegistrarPrice, index: number) => {
    return (
      <motion.div
        key={registrar.registrar}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="border rounded-lg hover:shadow-md transition-all duration-200 relative overflow-hidden"
      >
        {registrar.hasPromo && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10">
            优惠中
          </div>
        )}
        
        <div className="p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* 注册商信息 */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold truncate">{registrar.registrar}</h3>
                  {getPopularityBadge(registrar)}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.floor(registrar.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-1">({registrar.rating})</span>
                  </div>
                  {registrar.updatedTime && (
                    <span className="text-xs">更新于: {new Date(registrar.updatedTime).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>
                
                {registrar.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {registrar.features.slice(0, 4).map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {registrar.features.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{registrar.features.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* 价格信息 */}
            <div className="flex flex-col sm:flex-row gap-4 lg:flex-shrink-0">
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                {/* 注册价格 */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">注册</div>
                  <div className="text-lg font-bold text-primary">
                    {formatPrice(registrar.registrationPrice, registrar.currency)}
                  </div>
                </div>
                
                {/* 续费价格 */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">续费</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatPrice(registrar.renewalPrice, registrar.currency)}
                  </div>
                </div>
                
                {/* 转入价格 */}
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">转入</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatPrice(registrar.transferPrice, registrar.currency)}
                  </div>
                </div>
              </div>
              
              {/* 访问按钮 */}
              <div className="flex items-center">
                <Button size="sm" asChild className="whitespace-nowrap">
                  <a href={registrar.registrarUrl || '#'} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    访问官网
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                {suffix} 域名注册
              </CardTitle>
              <div className="flex flex-wrap items-center space-x-4 mt-2">
                {category && (
                  <Badge variant="secondary">
                    <Globe className="w-3 h-3 mr-1" />
                    {category}
                  </Badge>
                )}
                {popularity && (
                  <Badge variant="outline">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    热度: {popularity}%
                  </Badge>
                )}
                {error && (
                  <Badge variant="destructive">
                    ⚠️ 使用备用数据
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-muted-foreground">最低价格</div>
              <div className="text-2xl font-bold text-primary">
                {pricing.length > 0 ? formatPrice(
                  Math.min(...pricing.map(r => r.registrationPrice || 999).filter(p => p !== 999)), 
                  pricing[0]?.currency || 'USD'
                ) : 'N/A'}
              </div>
            </div>
          </div>
        </CardHeader>
        {description && (
          <CardContent>
            <p className="text-muted-foreground">{description}</p>
          </CardContent>
        )}
      </Card>

      {pricing.length > 0 && (
        <>
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
            >
              按价格排序
            </Button>
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('rating')}
            >
              按评分排序
            </Button>
            <Button
              variant={sortBy === 'popularity' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popularity')}
            >
              按热度排序
            </Button>
          </div>

          {/* Price Comparison Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="registration" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>注册</span>
              </TabsTrigger>
              <TabsTrigger value="renewal" className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>续费</span>
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4" />
                <span>转入</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="registration" className="space-y-3">
              <div className="space-y-3">
                <AnimatePresence>
                  {getSortedPrices('registration').map((registrar, index) => 
                    renderPriceListItem(registrar, index)
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="renewal" className="space-y-3">
              <div className="space-y-3">
                <AnimatePresence>
                  {getSortedPrices('renewal').map((registrar, index) => 
                    renderPriceListItem(registrar, index)
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>

            <TabsContent value="transfer" className="space-y-3">
              <div className="space-y-3">
                <AnimatePresence>
                  {getSortedPrices('transfer').map((registrar, index) => 
                    renderPriceListItem(registrar, index)
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>重要提醒</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 价格可能因促销活动和地区差异而有所变动</p>
            <p>• 首年注册价格通常与续费价格不同</p>
            <p>• 部分注册商提供多年注册的批量折扣</p>
            <p>• 请注意可能的额外费用，如ICANN费用或隐私保护费用</p>
            <p>• 价格数据来源于nazhumi.com API，注册商标签基于API返回的registrarname和registrarcode字段</p>
            <p>• 注册商特色功能标签根据registrarcode自动匹配，如阿里云、腾讯云等知名服务商</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}