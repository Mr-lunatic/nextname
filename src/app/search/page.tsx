"use client";

export const runtime = 'edge';

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, X, ExternalLink, Filter, SortAsc, Search, ShoppingCart, Globe, Eye, Star, BarChart3, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SuffixResult } from '@/components/suffix-result'
import { SearchResultsSkeleton, PriceComparisonSkeleton, WhoisSkeleton, SpinnerLoader } from '@/components/ui/loading-skeleton'
import { EnhancedSmartSearchV2 } from '@/components/enhanced-smart-search-v2'
import { EnhancedWhoisResult } from '@/components/enhanced-whois-result'
import { CardSpotlight, BestNameSpotlight } from '@/components/ui/framer-spotlight'
import { NextNameLogo } from '@/components/logo'
import { RegistrarLogo } from '@/components/registrar-logos'
import Image from 'next/image'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { Footer } from '@/components/footer'
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
        console.log(`🔄 Preloading page ${page}`)
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}&lang=zh&page=${page}&limit=10`)
        const data = await response.json()

        // Cache the preloaded result
        searchCache.set(cacheKey, data)
        searchCache.set(`${cacheKey}-time`, Date.now())
        console.log(`✅ Preloaded page ${page}`)
      } catch (error) {
        console.log(`❌ Failed to preload page ${page}:`, error)
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
      console.log('✅ Using cached search result')
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

      console.log(`🚀 Search completed in ${responseTime}ms`)

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
  }, [])

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
  }, [result?.result?.domain, result?.result?.is_available, domainDetails, fetchDomainDetails])

  // Fetch pricing data when we have an available domain search result
  useEffect(() => {
    if (result?.type === 'domain' && result?.result?.domain && result?.result?.is_available) {
      // Only fetch if we don't already have pricing for this domain
      if (!pricingData || pricingData.domain !== result.result.domain.split('.').pop()) {
        fetchPricingData(result.result.domain, pricingPage)
      }
    }
  }, [result?.result?.domain, result?.result?.is_available, pricingPage, pricingData, fetchPricingData])

  const renderDomainResult = () => {
    if (!result?.result) return null

    const { domain, is_available, whois_info } = result.result

    // 添加安全检查
    if (!domain || typeof domain !== 'string') {
      return <div>域名信息无效</div>
    }

    // Mock registrar prices for available domains with more entries for pagination
    const mockRegistrarPrices = [
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
    ].sort((a, b) => a.registrationPrice - b.registrationPrice)

    // 分页逻辑
    const pageSize = 5
    const startIndex = (pricingPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const currentPagePrices = mockRegistrarPrices.slice(startIndex, endIndex)
    const totalPages = Math.ceil(mockRegistrarPrices.length / pageSize)
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
                      <th className="text-center py-3 px-4">首年注册</th>
                      <th className="text-center py-3 px-4">续费价格</th>
                      <th className="text-center py-3 px-4">转入价格</th>
                      <th className="text-center py-3 px-4">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPagePrices.map((price, index) => (
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
                            {startIndex + index === 0 && (
                              <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-muted-foreground">
                            ${price.renewalPrice}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="text-muted-foreground">
                            ${price.transferPrice}
                          </span>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    第 {pricingPage} 页，共 {totalPages} 页 (共 {mockRegistrarPrices.length} 个注册商)
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

        {/* Other Extensions Check */}
        {!is_available && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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



    const filteredResults = checked_tlds.filter((item: any) => {
      const tldString = getTldString(item)
      const matchesTextFilter = tldString && tldString.toLowerCase().includes(filter.toLowerCase())

      // 可用性筛选
      let matchesAvailabilityFilter = true
      if (availabilityFilter === 'available') {
        matchesAvailabilityFilter = item.is_available
      } else if (availabilityFilter === 'registered') {
        matchesAvailabilityFilter = !item.is_available
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
      return a.tld.localeCompare(b.tld)
    })
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Enhanced Header */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gradient-premium">
                &quot;{prefix}&quot; 域名建议
              </h2>

              {pagination?.tld_stats && (
                <p className="text-xs text-muted-foreground">
                  系统支持 {pagination.tld_stats.total_supported} 个TLD，数据更新于 {new Date(pagination.tld_stats.last_updated).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {/* Enhanced Filters */}
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="筛选域名后缀..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setSortBy(sortBy === 'price' ? 'popularity' : sortBy === 'popularity' ? 'marketShare' : 'price')}
                className="flex items-center gap-2"
              >
                <SortAsc className="w-4 h-4" />
                {sortBy === 'price' ? '按价格排序' : sortBy === 'popularity' ? '按人气排序' : '按市场份额排序'}
              </Button>

              {/* 可用性筛选按钮组 */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={availabilityFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setAvailabilityFilter('all')}
                  className="text-xs h-8"
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant={availabilityFilter === 'available' ? 'default' : 'ghost'}
                  onClick={() => setAvailabilityFilter('available')}
                  className="text-xs h-8 text-green-600 hover:text-green-700"
                >
                  <Check className="w-3 h-3 mr-1" />
                  可注册
                </Button>
                <Button
                  size="sm"
                  variant={availabilityFilter === 'registered' ? 'default' : 'ghost'}
                  onClick={() => setAvailabilityFilter('registered')}
                  className="text-xs h-8 text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3 mr-1" />
                  已注册
                </Button>
              </div>
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
        
        {/* 桌面端表格布局 */}
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
                      key={getTldString(item) || item.domain || index}
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
                                // 跳转到注册商官网
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
                                {item.is_available ? (
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
                                ) : (
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
                                )}
                              </div>
                              {registrarIndex === 0 && item.is_available && (
                                <div className="text-xs text-green-600 font-medium mt-1 flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  最低价
                                </div>
                              )}
                              {registrarIndex === 0 && !item.is_available && (
                                <div className="text-xs text-blue-600 font-medium mt-1 flex items-center justify-center">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  转入价
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-muted/30 rounded-lg p-3 min-h-[80px] flex items-center justify-center">
                              <span className="text-muted-foreground text-sm">
                                {item.is_available ? '暂无数据' : '-'}
                              </span>
                            </div>
                          )}
                        </td>
                      ))}

                      {/* 状态列 */}
                      <td className="px-4 py-6 text-center">
                        <Badge
                          variant={item.is_available ? "default" : "secondary"}
                          className={`status-badge inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            item.is_available
                              ? 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                              : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              可注册
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              已注册
                            </>
                          )}
                        </Badge>
                      </td>

                      {/* 操作列 */}
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          {item.is_available ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                              onClick={() => {
                                // 注册逻辑 - 跳转到最低价注册商
                                if (item.top_registrars && item.top_registrars[0]) {
                                  // 构建注册商URL
                                  const registrarName = item.top_registrars[0].registrar.toLowerCase()
                                  let registrarUrl = ''

                                  // 根据注册商名称构建URL
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
                                  // 如果没有注册商数据，跳转到通用注册页面
                                  window.open('https://www.cloudflare.com/products/registrar/', '_blank')
                                }
                              }}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              注册
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // WHOIS查询 - 跳转到域名详情页
                                window.location.href = `/domain/${encodeURIComponent(item.domain)}`
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              WHOIS
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
          <AnimatePresence>
            {sortedResults.map((item: any, index: number) => (
              <motion.div
                key={getTldString(item) || item.domain || index}
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
                          variant={item.is_available ? "default" : "secondary"}
                          className={`${
                            item.is_available
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              可注册
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3 mr-1" />
                              已注册
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
                                  // 跳转到注册商官网
                                  const registrarCode = registrar.registrarCode || registrar.registrar.toLowerCase();
                                  const registrarUrl = getRegistrarOfficialUrl(registrarCode, '');
                                  window.open(registrarUrl, '_blank');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{registrar.registrar}</div>
                                  {registrarIndex === 0 && (
                                    <Badge className="bg-green-600 text-white text-xs">
                                      <Sparkles className="w-3 h-3 mr-1" />
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
                        {item.is_available ? (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              if (item.top_registrars && item.top_registrars[0]) {
                                // 构建注册商URL
                                const registrarName = item.top_registrars[0].registrar.toLowerCase()
                                let registrarUrl = ''

                                // 根据注册商名称构建URL
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
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              // WHOIS查询 - 跳转到域名详情页
                              window.location.href = `/domain/${encodeURIComponent(item.domain)}`
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看WHOIS
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
                        其中 <span className="font-semibold text-green-600">{sortedResults.filter((item: any) => item.is_available).length}</span> 个可注册
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

        {filteredResults.length === 0 && (
          <Card className="mt-6">
            <CardContent className="text-center py-20">
              <div className="space-y-4">
                <div className="text-6xl">🔍</div>
                <h3 className="text-xl font-semibold">未找到匹配的域名</h3>
                <p className="text-muted-foreground">
                  尝试调整筛选条件或搜索其他关键词
                </p>
                <Button onClick={() => setFilter('')} variant="outline">
                  清除筛选条件
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_prev_page}
              onClick={() => handlePageChange(pagination.current_page - 1)}
            >
              上一页
            </Button>
            
            {/* Page Numbers */}
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.current_page - 2, pagination.total_pages - 4)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.current_page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(pagination.current_page + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </motion.div>
    )
  }

  const renderSuffixResult = () => {
    if (!result?.result) return null
    
    const { suffix } = result.result
    
    return (
      <SuffixResult
        suffix={suffix}
        registrarPrices={[]} // This will use mock data
        description={`${suffix} is a popular domain extension suitable for various purposes.`}
        category="Generic"
        popularity={85}
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
            <EnhancedSmartSearchV2 
              onSearch={handleSearch}
              placeholder="搜索域名或关键词..."
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
            <div>
              <NextNameLogo className="text-foreground" />
            </div>
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
          <EnhancedSmartSearchV2 
            onSearch={handleSearch}
            placeholder="搜索域名或关键词..."
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

// Other Extensions Check Component
function OtherExtensionsCheck({ domain }: { domain: string }) {
  const [extensionsData, setExtensionsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 添加安全检查
  if (!domain || typeof domain !== 'string') {
    return <div>域名信息无效</div>
  }

  const domainPrefix = domain.split('.')[0]
  const commonExtensions = ['.com', '.cn', '.net', '.org', '.io', '.co', '.me'] // 只显示7个后缀

  useEffect(() => {
    const checkExtensions = async () => {
      setLoading(true)
      try {
        const results = await Promise.all(
          commonExtensions.map(async (ext) => {
            const fullDomain = `${domainPrefix}${ext}`

            // 如果是当前域名，直接返回当前域名的状态
            if (fullDomain === domain) {
              return {
                domain: fullDomain,
                extension: ext,
                available: false, // 当前域名肯定是已注册的（因为我们在查看它）
                loading: false,
                isCurrent: true
              }
            }

            try {
              const response = await fetch(`/api/search?q=${encodeURIComponent(fullDomain)}&type=domain`)
              const data = await response.json()
              return {
                domain: fullDomain,
                extension: ext,
                available: data.result?.is_available || false,
                loading: false
              }
            } catch {
              return {
                domain: fullDomain,
                extension: ext,
                available: false,
                loading: false,
                error: true
              }
            }
          })
        )

        setExtensionsData(results)
      } catch (error) {
        console.error('Error checking extensions:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExtensions()
  }, [domain, domainPrefix])

  const handleDomainClick = (clickedDomain: string) => {
    window.location.href = `/search?q=${encodeURIComponent(clickedDomain)}&type=domain`
  }

  const handleViewMore = () => {
    window.location.href = `/search?q=${encodeURIComponent(domainPrefix)}&type=prefix`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {extensionsData.map((item, index) => (
        <motion.div
          key={item.domain}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleDomainClick(item.domain)}
          className="cursor-pointer group"
        >
          <Card className={`h-full hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${
            item.isCurrent ? 'ring-2 ring-primary/20 bg-primary/5' : ''
          }`}>
            <CardContent className="p-4 text-center">
              <div className="space-y-2">
                <div className={`font-mono text-sm font-semibold ${
                  item.isCurrent ? 'text-primary' : 'text-primary group-hover:text-primary/80'
                }`}>
                  {item.domain}
                  {item.isCurrent && (
                    <span className="ml-1 text-xs text-muted-foreground">(当前)</span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  {item.available ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
                      <Check className="w-3 h-3 mr-1" />
                      可注册
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
                      <X className="w-3 h-3 mr-1" />
                      已注册
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* 查看更多按钮，与其他卡片大小一致 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: extensionsData.length * 0.05 }}
        onClick={handleViewMore}
        className="cursor-pointer group"
      >
        <Card className="h-full hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-dashed border-2">
          <CardContent className="p-4 text-center h-full flex flex-col justify-center">
            <div className="space-y-2">
              <Search className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                查看更多
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}