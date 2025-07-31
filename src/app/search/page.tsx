"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'

// 开发环境兜底处理framer-motion
let motion: any, AnimatePresence: any
try {
  const framerMotion = require('framer-motion')
  motion = framerMotion.motion
  AnimatePresence = framerMotion.AnimatePresence
} catch (error) {
  console.warn('framer-motion not available, using fallback')
  motion = {
    div: 'div' as any,
    button: 'button' as any
  }
  AnimatePresence = function AnimatePresence({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }
}
import { ArrowLeft, Check, X, ExternalLink, Filter, SortAsc, Search, ShoppingCart, Globe, Eye, Star, BarChart3, TrendingUp, Sparkles, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SuffixResult } from '@/components/suffix-result'
import { SearchResultsSkeleton, PriceComparisonSkeleton, WhoisSkeleton, SpinnerLoader } from '@/components/ui/loading-skeleton'
import { StreamingSearchTable } from '@/components/streaming-table'

// 安全导入可能有framer-motion依赖的组件
let UnifiedSearchBox: any, EnhancedWhoisResult: any, OtherExtensionsCheck: any, CardSpotlight: any, BestNameSpotlight: any
try {
  UnifiedSearchBox = require('@/components/search').UnifiedSearchBox
  EnhancedWhoisResult = require('@/components/enhanced-whois-result').EnhancedWhoisResult
  OtherExtensionsCheck = require('@/components/other-extensions-check').OtherExtensionsCheck
  
  try {
    const spotlightComponents = require('@/components/ui/framer-spotlight')
    CardSpotlight = spotlightComponents.CardSpotlight
    BestNameSpotlight = spotlightComponents.BestNameSpotlight
  } catch {
    CardSpotlight = function CardSpotlight({ children }: { children: React.ReactNode }) {
      return <div>{children}</div>
    }
    BestNameSpotlight = function BestNameSpotlight({ children }: { children: React.ReactNode }) {
      return <div>{children}</div>
    }
  }
} catch (error) {
  console.warn('Some components not available, using fallbacks:', error)
  
  // 简化的搜索框组件
  UnifiedSearchBox = function UnifiedSearchBox({ onSearch, placeholder }: { 
    onSearch: (query: string, type: string) => void
    placeholder: string 
  }) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <input 
          type="text" 
          placeholder={placeholder}
          className="w-full p-4 border rounded-lg"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement
              onSearch(target.value, 'auto')
            }
          }}
        />
      </div>
    )
  }
  
  // 简化的WHOIS结果组件
  EnhancedWhoisResult = function EnhancedWhoisResult({ domain, whoisInfo }: { domain: string, whoisInfo: any }) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-bold">{domain}</h3>
        <p>WHOIS信息已加载</p>
      </div>
    )
  }
  
  // 简化的其他扩展组件
  OtherExtensionsCheck = function OtherExtensionsCheck({ domain }: { domain: string }) {
    return (
      <div className="p-4 border rounded-lg">
        <p>检查其他扩展: {domain}</p>
      </div>
    )
  }
  
  CardSpotlight = function CardSpotlight({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
  BestNameSpotlight = function BestNameSpotlight({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
}
import { NextNameLogo } from '@/components/logo'
import { RegistrarLogo } from '@/components/registrar-logos'
import Image from 'next/image'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import { trackDomainSearch, trackWhoisQuery } from '@/lib/analytics'
import { getRegistrarOfficialUrl } from '@/lib/registrar-urls'
import '@/styles/search-table.css'

interface SearchResult {
  query: string
  type: string
  result: any
}



function SearchPageContent() {
  const searchParams = useSearchParams()
  const t = useTranslations()
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('price')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'registered'>('all')
  const [currentLocale, setCurrentLocale] = useState('zh-CN')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<any>(null)
  const [searchCache, setSearchCache] = useState(new Map())
  const [domainDetails, setDomainDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [pricingData, setPricingData] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  const [pricingPage, setPricingPage] = useState(1)

  // 价格排序状态
  const [priceSortColumn, setPriceSortColumn] = useState<'registration' | 'renewal' | 'transfer'>('registration')
  const [priceSortDirection, setPriceSortDirection] = useState<'asc' | 'desc'>('asc')

  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'auto'

  const handleSearch = (newQuery: string, newType: string) => {
    window.location.href = `/search?q=${encodeURIComponent(newQuery)}&type=${newType}`
  }

  // 按钮功能处理函数
  const handleRegisterDomain = (registrarUrl: string) => {
    window.open(registrarUrl, '_blank')
  }

  const scrollToPriceComparison = () => {
    const element = document.getElementById('price-comparison')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToWhoisInfo = () => {
    const element = document.getElementById('whois-info')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 价格排序处理函数
  const handlePriceSort = (column: 'registration' | 'renewal' | 'transfer') => {
    if (priceSortColumn === column) {
      // 如果点击的是当前排序列，切换排序方向
      setPriceSortDirection(priceSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果点击的是新列，设置为该列并默认升序
      setPriceSortColumn(column)
      setPriceSortDirection('asc')
    }
  }

  // 获取排序图标
  const getPriceSortIcon = (column: 'registration' | 'renewal' | 'transfer') => {
    if (priceSortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return priceSortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 text-primary" /> :
      <ArrowDown className="w-4 h-4 text-primary" />
  }

  const handleBrowseOtherSuffixes = (domain: string) => {
    const domainPrefix = domain.split('.')[0]
    handleSearch(domainPrefix, 'prefix')
  }

  const handleViewRecommendations = (domain: string) => {
    // 跳转到域名详情页查看更多推荐
    const domainName = domain.replace(/\./g, '-')
    window.location.href = `/domain/${encodeURIComponent(domain)}`
  }

  const handleDetailsClick = (item: any) => {
    if (item.is_available) {
      // 未注册域名：跳转到后缀价格对比页
      const tld = getTldString(item)
      if (tld) {
        handleSearch(tld, 'suffix')
      }
    } else {
      // 已注册域名：跳转到WHOIS查询页
      handleSearch(item.domain, 'domain')
    }
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchSearchResults(newPage)
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const preloadNextPage = useCallback(async (query: string, type: string, page: number) => {
    const cacheKey = `${query}-${type}-${page}`
    const cachedResult = searchCache.get(cacheKey)

    // Only preload if not already cached
    if (!cachedResult) {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&lang=zh&page=${page}&limit=10`)
        const data = await response.json()

        // Cache the preloaded result
        searchCache.set(cacheKey, data)
        searchCache.set(`${cacheKey}-time`, Date.now())
      } catch (error) {
        // Silently fail preloading
      }
    }
  }, [searchCache])

  const fetchSearchResults = useCallback(async (page: number = 1) => {
    setLoading(true)

    // Check cache first
    const cacheKey = `${query}-${type}-${page}`
    const cachedResult = searchCache.get(cacheKey)
    const cacheTime = searchCache.get(`${cacheKey}-time`)
    const cacheAge = Date.now() - (cacheTime || 0)

    if (cachedResult && cacheAge < 10 * 60 * 1000) { // Extended to 10 minutes cache for better pagination performance
      setResult(cachedResult)
      if (cachedResult.type === 'prefix' && cachedResult.result.pagination) {
        setPaginationInfo(cachedResult.result.pagination)
        setTotalPages(cachedResult.result.pagination.total_pages)
        setCurrentPage(cachedResult.result.pagination.current_page)
      }
      setLoading(false)
      return
    }

    try {
      // Track search event
      trackDomainSearch(query, type)

      const startTime = Date.now()
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&lang=zh&page=${page}&limit=10`)
      const data = await response.json()
      const responseTime = Date.now() - startTime

      setResult(data)

      // Cache the result
      searchCache.set(cacheKey, data)
      searchCache.set(`${cacheKey}-time`, Date.now())

      // Update pagination info if this is a prefix search
      if (data.type === 'prefix' && data.result.pagination) {
        setPaginationInfo(data.result.pagination)
        setTotalPages(data.result.pagination.total_pages)
        setCurrentPage(data.result.pagination.current_page)

        // Preload next page for faster navigation
        const nextPage = data.result.pagination.current_page + 1
        if (nextPage <= data.result.pagination.total_pages) {
          preloadNextPage(query, type, nextPage)
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [query, type, searchCache, preloadNextPage])

  const fetchDomainDetails = useCallback(async (domain: string) => {
    if (!domain || loadingDetails) return

    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/domain/${encodeURIComponent(domain)}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setDomainDetails(data)

    } catch (error) {
      console.error('Failed to fetch domain details:', error)
      setDomainDetails(null)
    } finally {
      setLoadingDetails(false)
    }
  }, [loadingDetails])

  const fetchPricingData = useCallback(async (domain: string, page: number = 1) => {
    if (!domain || loadingPricing) return

    setLoadingPricing(true)
    try {
      const tld = domain.split('.').pop()
      if (!tld) {
        throw new Error('Invalid domain format')
      }
      const response = await fetch(`/api/pricing?domain=${encodeURIComponent(tld)}&order=new&page=${page}&pageSize=10`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // 检查数据源和数量，决定是否使用API数据还是兜底数据
      if (data.pricing && data.pricing.length >= 8) {
        // 如果API返回足够多的数据（>=8条），使用API数据
        setPricingData(data)
      } else {
        // 如果API数据不足，使用兜底数据但保留分页信息
        setPricingData({
          ...data,
          usesFallback: true,
          originalApiData: data.pricing || []
        })
      }

    } catch (error) {
      console.error('Failed to fetch pricing data:', error)
      // API失败时也使用兜底数据
      setPricingData({
        usesFallback: true,
        originalApiData: [],
        pagination: {
          page: page,
          pageSize: 10,
          totalPages: 1,
          totalRecords: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      })
    } finally {
      setLoadingPricing(false)
    }
  }, [loadingPricing])

  useEffect(() => {
    if (query) {
      fetchSearchResults()
    }
  }, [query, type, fetchSearchResults])

  // Fetch domain details when we have a domain search result
  useEffect(() => {
    if (result?.type === 'domain' && result?.result?.domain && !result?.result?.is_available) {
      // Only fetch if we don't already have details for this domain
      if (!domainDetails || domainDetails.domain !== result.result.domain) {
        fetchDomainDetails(result.result.domain)
      }
    }
  }, [result?.type, result?.result?.domain, result?.result?.is_available, domainDetails, fetchDomainDetails])

  // Fetch pricing data when we have an available domain search result
  useEffect(() => {
    if (result?.type === 'domain' && result?.result?.domain && result?.result?.is_available) {
      // Only fetch if we don't already have pricing for this domain
      if (!pricingData || pricingData.domain !== result.result.domain.split('.').pop()) {
        fetchPricingData(result.result.domain, pricingPage)
      }
    }
  }, [result?.type, result?.result?.domain, result?.result?.is_available, pricingPage, pricingData, fetchPricingData])

  const renderDomainResult = () => {
    if (!result?.result) return null

    const { domain, is_available, whois_info } = result.result

    // 添加安全检查
    if (!domain || typeof domain !== 'string') {
      return <div>域名信息无效</div>
    }

    // 使用智能数据源获取的价格数据，如果没有则使用兜底数据
    let registrarPrices = []

    if (pricingData && pricingData.pricing && pricingData.pricing.length > 0) {
      // 使用智能数据源的数据
      registrarPrices = pricingData.pricing.map((item: any) => ({
        registrar: item.registrar,
        registrarCode: item.registrarCode,
        registrarUrl: item.registrarUrl,
        registrationPrice: item.registrationPrice,
        renewalPrice: item.renewalPrice,
        transferPrice: item.transferPrice,
        currency: item.currency || 'USD',
        rating: item.rating || 4.0,
        features: item.features || [],
        affiliateLink: item.registrarUrl || '#',
        hasPromo: item.hasPromo,
        specialOffer: item.hasPromo ? '优惠中' : undefined
      }))
    } else {
      // 兜底数据
      registrarPrices = [
        {
          registrar: 'Cloudflare',
          logo: '/logos/cloudflare.svg',
          registrationPrice: 8.57,
          renewalPrice: 8.57,
          transferPrice: 8.57,
          currency: 'USD',
          rating: 4.8,
          features: ['批发价格', '免费SSL', 'DNSSEC'],
          affiliateLink: 'https://cloudflare.com'
        },
      {
        registrar: 'Porkbun',
        logo: '/logos/porkbun.svg',
        registrationPrice: 9.13,
        renewalPrice: 11.98,
        transferPrice: 9.13,
        currency: 'USD',
        rating: 4.6,
        features: ['免费WHOIS隐私', '免费SSL', 'API访问'],
        affiliateLink: 'https://porkbun.com'
      },
      {
        registrar: 'Namecheap',
        logo: '/logos/namecheap.svg',
        registrationPrice: 10.69,
        renewalPrice: 13.99,
        transferPrice: 10.69,
        currency: 'USD',
        rating: 4.5,
        features: ['免费WHOIS隐私', 'DNS管理', '邮箱转发'],
        affiliateLink: 'https://namecheap.com'
      },
      {
        registrar: 'Google Domains',
        logo: '/logos/google.svg',
        registrationPrice: 12.00,
        renewalPrice: 12.00,
        transferPrice: 12.00,
        currency: 'USD',
        rating: 4.3,
        features: ['Google集成', '免费隐私保护', '简洁界面'],
        affiliateLink: 'https://domains.google'
      },
      {
        registrar: 'GoDaddy',
        logo: '/logos/godaddy.svg',
        registrationPrice: 12.99,
        renewalPrice: 17.99,
        transferPrice: 12.99,
        currency: 'USD',
        specialOffer: '首年特价',
        rating: 4.2,
        features: ['免费WHOIS隐私', '24/7客服', '域名转发'],
        affiliateLink: 'https://godaddy.com'
      },
      {
        registrar: 'Name.com',
        logo: '/logos/name.svg',
        registrationPrice: 13.99,
        renewalPrice: 13.99,
        transferPrice: 13.99,
        currency: 'USD',
        rating: 4.1,
        features: ['免费WHOIS隐私', '邮箱转发', 'DNS管理'],
        affiliateLink: 'https://name.com'
      },
      {
        registrar: 'Dynadot',
        logo: '/logos/dynadot.svg',
        registrationPrice: 14.99,
        renewalPrice: 14.99,
        transferPrice: 14.99,
        currency: 'USD',
        rating: 4.0,
        features: ['域名停放', 'DNS管理', '批量工具'],
        affiliateLink: 'https://dynadot.com'
      },
      {
        registrar: 'Hover',
        logo: '/logos/hover.svg',
        registrationPrice: 15.99,
        renewalPrice: 15.99,
        transferPrice: 15.99,
        currency: 'USD',
        rating: 3.9,
        features: ['简洁界面', '免费WHOIS隐私', '邮箱转发'],
        affiliateLink: 'https://hover.com'
      },
      {
        registrar: 'Domain.com',
        logo: '/logos/domain.svg',
        registrationPrice: 16.99,
        renewalPrice: 16.99,
        transferPrice: 16.99,
        currency: 'USD',
        rating: 3.8,
        features: ['网站建设工具', '邮箱服务', 'SSL证书'],
        affiliateLink: 'https://domain.com'
      },
      {
        registrar: 'Gandi',
        logo: '/logos/gandi.svg',
        registrationPrice: 17.99,
        renewalPrice: 17.99,
        transferPrice: 17.99,
        currency: 'USD',
        rating: 3.7,
        features: ['隐私保护', '邮箱服务', '网站托管'],
        affiliateLink: 'https://gandi.net'
      }
      ]
    }

    // 应用排序
    const sortedPrices = [...registrarPrices].sort((a, b) => {
      let priceA: number, priceB: number

      switch (priceSortColumn) {
        case 'registration':
          priceA = a.registrationPrice
          priceB = b.registrationPrice
          break
        case 'renewal':
          priceA = a.renewalPrice
          priceB = b.renewalPrice
          break
        case 'transfer':
          priceA = a.transferPrice
          priceB = b.transferPrice
          break
        default:
          priceA = a.registrationPrice
          priceB = b.registrationPrice
      }

      return priceSortDirection === 'asc' ? priceA - priceB : priceB - priceA
    })

    // 分页逻辑
    const pageSize = 5
    const startIndex = (pricingPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const currentPagePrices = sortedPrices.slice(startIndex, endIndex)
    const totalPages = Math.ceil(registrarPrices.length / pageSize)
    const hasNextPage = pricingPage < totalPages
    const hasPrevPage = pricingPage > 1

    return (
      <div className="space-y-8">

        {/* Domain Information for Available Domains */}
        {is_available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold tracking-tight text-2xl font-mono">{domain}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-600 text-white hover:bg-green-700 text-lg px-4 py-2">
                      <Check className="w-4 h-4 mr-2" />
                      可注册
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>
        )}

        {/* Price Comparison Table for Available Domains */}
        {is_available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <span>注册商价格对比</span>
                  </div>
                  {pricingData && (
                    <div className="text-sm text-muted-foreground">
                      {pricingData.usesFallback ? '使用兜底数据' : `数据源: ${pricingData.source || '智能选择'}`}
                    </div>
                  )}
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
                          onClick={() => handlePriceSort('registration')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>首年注册</span>
                          {getPriceSortIcon('registration')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">
                        <button
                          onClick={() => handlePriceSort('renewal')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>续费价格</span>
                          {getPriceSortIcon('renewal')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">
                        <button
                          onClick={() => handlePriceSort('transfer')}
                          className="flex items-center justify-center space-x-1 hover:text-primary transition-colors w-full"
                        >
                          <span>转入价格</span>
                          {getPriceSortIcon('transfer')}
                        </button>
                      </th>
                      <th className="text-center py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPagePrices.map((price, index) => {
                      // 计算各列的最低价
                      const isLowestRegistration = price.registrationPrice === Math.min(...sortedPrices.map(p => p.registrationPrice))
                      const isLowestRenewal = price.renewalPrice === Math.min(...sortedPrices.map(p => p.renewalPrice))
                      const isLowestTransfer = price.transferPrice === Math.min(...sortedPrices.map(p => p.transferPrice))

                      return (
                      <tr
                        key={price.registrar}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <RegistrarLogo
                              registrar={price.registrar}
                              size={32}
                              className="flex-shrink-0"
                            />
                            <div>
                              <div className="font-semibold">{price.registrar}</div>
                              {price.specialOffer && (
                                <Badge variant="secondary" className="text-xs">
                                  {price.specialOffer}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="font-bold text-lg">
                            ${price.registrationPrice}
                            {isLowestRegistration && (
                              <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="font-bold text-lg text-orange-600">
                            ${price.renewalPrice}
                            {isLowestRenewal && (
                              <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <div className="font-bold text-lg text-blue-600">
                            ${price.transferPrice}
                            {isLowestTransfer && (
                              <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <Button
                            size="sm"
                            className={startIndex + index === 0 ? "bg-green-600 hover:bg-green-700" : ""}
                            onClick={() => handleRegisterDomain(price.affiliateLink)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            注册
                          </Button>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    第 {pricingPage} 页，共 {totalPages} 页 (共 {sortedPrices.length} 个注册商)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasPrevPage}
                      onClick={() => setPricingPage(pricingPage - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!hasNextPage}
                      onClick={() => setPricingPage(pricingPage + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        )}

        {/* Other Extensions Check for Available Domains */}
        {is_available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-6 w-6 text-primary" />
                  <span>其它后缀可用性</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OtherExtensionsCheck domain={domain} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* WHOIS Information for registered domains */}
        {!is_available && whois_info && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <EnhancedWhoisResult
              domain={domain}
              whoisInfo={whois_info}
              isAvailable={is_available}
            />
          </motion.div>
        )}




      </div>
    )
  }

  // 辅助函数：从item中获取TLD字符串
  const getTldString = (item: any): string => {
    if (typeof item.tld === 'string') {
      return item.tld
    } else if (item.tld && typeof item.tld.tld === 'string') {
      return item.tld.tld
    } else if (typeof item.domain === 'string') {
      // 从完整域名中提取TLD
      const parts = item.domain.split('.')
      return parts.length > 1 ? '.' + parts.slice(1).join('.') : ''
    }
    return ''
  }

  const renderPrefixResults = () => {
    if (!result?.result?.checked_tlds) return null

    const { prefix, checked_tlds, pagination } = result.result

    // 使用混合组件：保持原有样式，后台使用流式查询
    return (
      <StreamingSearchTable
        query={query}
        type={type}
        page={currentPage}
        limit={10}
        prefix={prefix}
        fallbackData={checked_tlds}
        pagination={pagination}
        filter={filter}
        sortBy={sortBy}
        availabilityFilter={availabilityFilter}
        onPageChange={handlePageChange}
        getTldString={getTldString}
      />
    )
  }

  const renderSuffixResult = () => {
    if (!result?.result) return null
    
    const { suffix } = result.result
    
    return (
      <SuffixResult
        suffix={suffix}
        registrarPrices={[]} // This will use mock data
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Header */}
        <header className="container-magazine py-4 relative z-[10000]" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          <div className="flex justify-between items-center backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <Link href="/" className="cursor-pointer">
                <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity" />
              </Link>
            </motion.div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher 
                currentLocale={currentLocale}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Enhanced Search Bar */}
          <div className="mb-8">
            <UnifiedSearchBox
              onSearch={handleSearch}
              placeholder="搜索域名或关键词..."
              variant="default"
              size="md"
              showSuggestions={true}
              showHistory={true}
              showAutocomplete={true}
              maxSuggestions={6}
            />
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <SpinnerLoader size="lg" />
                <p className="text-lg font-medium">正在搜索中...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">正在查询: &quot;{query}&quot;</p>
              </div>
            </div>
            
            {/* Show skeleton based on search type */}
            {type === 'domain' && <WhoisSkeleton />}
            {type === 'prefix' && <SearchResultsSkeleton count={6} />}
            {type === 'suffix' && <PriceComparisonSkeleton count={8} />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* Header */}
      <header className="container-magazine py-4 relative z-[10000]" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <div className="flex justify-between items-center backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <Link href="/" className="cursor-pointer">
              <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity" />
            </Link>
          </motion.div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher 
              currentLocale={currentLocale}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">


        {/* Enhanced Search Bar */}
        <div className="mb-8">
          <UnifiedSearchBox
            onSearch={handleSearch}
            placeholder="搜索域名或关键词..."
            variant="default"
            size="md"
            showSuggestions={true}
            showHistory={true}
            showAutocomplete={true}
            maxSuggestions={6}
          />
        </div>

        {result?.type === 'domain' && renderDomainResult()}
        {result?.type === 'prefix' && renderPrefixResults()}
        {result?.type === 'suffix' && renderSuffixResult()}

        {!result && (
          <div className="text-center py-20">
            <div className="space-y-4">
              <div className="text-6xl">🔍</div>
              <h3 className="text-xl font-semibold">请输入搜索关键词</h3>
              <p className="text-muted-foreground">输入域名、关键词或后缀开始搜索</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
      
      {/* 返回顶部按钮 */}
      <ScrollToTop threshold={400} />
    </div>
  )
}



export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <SpinnerLoader size="lg" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}


