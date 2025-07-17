"use client";

export const runtime = 'edge';

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, X, ExternalLink, Filter, SortAsc, Search, ShoppingCart, Globe, Info, Eye, Star, BarChart3, TrendingUp, Sparkles } from 'lucide-react'
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
import Image from 'next/image'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { ThemeToggle } from '@/components/theme-toggle'

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
  const [currentLocale, setCurrentLocale] = useState('zh-CN')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [paginationInfo, setPaginationInfo] = useState<any>(null)
  const [searchCache, setSearchCache] = useState(new Map())

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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchSearchResults(newPage)
      // Smooth scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

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
  }, [query, type, searchCache])

  useEffect(() => {
    if (query) {
      fetchSearchResults()
    }
  }, [query, type, fetchSearchResults])

  const renderDomainResult = () => {
    if (!result?.result) return null
    
    const { domain, is_available, whois_info } = result.result
    
    // Mock registrar prices for available domains
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
      }
    ].sort((a, b) => a.registrationPrice - b.registrationPrice)
    
    // Enhanced domain result display based on requirements
    return (
      <div className="space-y-8">
        {/* Primary Result Card */}
        <BestNameSpotlight>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-3xl relative overflow-hidden"
          >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          <div className="relative z-10">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold font-mono text-primary">{domain}</h1>
                <div className="flex items-center justify-center space-x-2">
                  {is_available ? (
                    <>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                        <Check className="h-5 w-5" />
                        <span className="font-semibold">可以注册！</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
                        <X className="h-5 w-5" />
                        <span className="font-semibold">已被注册</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {is_available ? (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-primary">
                    最低首年注册价格: <span className="text-green-600">${mockRegistrarPrices[0].registrationPrice}</span>
                    <span className="text-sm text-muted-foreground ml-2">({mockRegistrarPrices[0].registrar})</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleRegisterDomain(mockRegistrarPrices[0].affiliateLink)}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      立即注册
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={scrollToPriceComparison}
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      对比所有价格
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                    <button 
                      onClick={() => handleBrowseOtherSuffixes(domain)}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      浏览其他后缀
                    </button>
                    <span className="text-muted-foreground hidden sm:inline">|</span>
                    <button 
                      onClick={() => handleViewRecommendations(domain)}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      查看建议域名
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={scrollToWhoisInfo}
                    >
                      <Info className="mr-2 h-5 w-5" />
                      查看WHOIS信息
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={() => handleBrowseOtherSuffixes(domain)}
                    >
                      <Globe className="mr-2 h-5 w-5" />
                      浏览其他后缀
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </BestNameSpotlight>

        {/* Price Comparison Table for Available Domains */}
        {is_available && (
          <motion.div
            id="price-comparison"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <CardSpotlight>
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
                        <th className="text-center py-3 px-4">评分</th>
                        <th className="text-center py-3 px-4">首年注册</th>
                        <th className="text-center py-3 px-4">续费价格</th>
                        <th className="text-center py-3 px-4">转入价格</th>
                        <th className="text-center py-3 px-4">特色功能</th>
                        <th className="text-center py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockRegistrarPrices.map((price, index) => (
                        <motion.tr
                          key={price.registrar}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`border-b hover:bg-muted/50 transition-colors ${
                            index === 0 ? 'bg-green-50 dark:bg-green-900/20' : ''
                          }`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Image
                                src={price.logo}
                                alt={`${price.registrar} logo`}
                                width={32}
                                height={32}
                                className="object-contain"
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
                            <div className="flex items-center justify-center space-x-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{price.rating}</span>
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="font-bold text-lg">
                              ${price.registrationPrice}
                              {index === 0 && (
                                <Badge className="ml-2 bg-green-100 text-green-800">最低价</Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className="text-muted-foreground">${price.renewalPrice}</span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className="text-muted-foreground">${price.transferPrice}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {price.features.slice(0, 2).map((feature) => (
                                <Badge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {price.features.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{price.features.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <Button 
                              size="sm"
                              className={index === 0 ? "bg-green-600 hover:bg-green-700" : ""}
                              onClick={() => handleRegisterDomain(price.affiliateLink)}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              注册
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            </CardSpotlight>
          </motion.div>
        )}

        {/* Enhanced WHOIS Display */}
        {!is_available && (
          <div id="whois-info">
            <EnhancedWhoisResult
              domain={domain}
              whoisInfo={{
                domainName: domain,
                registryDomainId: whois_info?.registry_domain_id || 'D123456789-LROR',
                registrarWhoisServer: whois_info?.registrar_whois_server || 'whois.markmonitor.com',
                registrarUrl: whois_info?.registrar_url || 'http://www.markmonitor.com',
                updatedDate: whois_info?.updated_date || '2019-09-09T15:39:04Z',
                creationDate: whois_info?.creation_date || '1997-09-15T04:00:00Z',
                registryExpiryDate: whois_info?.registry_expiry_date || '2028-09-14T04:00:00Z',
                registrar: whois_info?.registrar || 'MarkMonitor Inc.',
                registrarIanaId: whois_info?.registrar_iana_id || '292',
                registrarAbuseContactEmail: whois_info?.registrar_abuse_contact_email || 'abusecomplaints@markmonitor.com',
                registrarAbuseContactPhone: whois_info?.registrar_abuse_contact_phone || '+1.2086851750',
                domainStatus: whois_info?.domain_status || [
                  'clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited',
                  'clientTransferProhibited https://icann.org/epp#clientTransferProhibited',
                  'clientUpdateProhibited https://icann.org/epp#clientUpdateProhibited'
                ],
                nameServers: whois_info?.name_servers || [
                  'NS1.GOOGLE.COM',
                  'NS2.GOOGLE.COM',
                  'NS3.GOOGLE.COM',
                  'NS4.GOOGLE.COM'
                ],
                dnssec: whois_info?.dnssec || 'unsigned',
                lastUpdateOfWhoisDatabase: whois_info?.last_update_of_whois_database || '2025-07-10T09:52:50Z'
              }}
              isAvailable={is_available}
            />
          </div>
        )}
      </div>
    )
  }

  const renderPrefixResults = () => {
    if (!result?.result?.checked_tlds) return null
    
    const { prefix, checked_tlds, pagination } = result.result
    const filteredResults = checked_tlds.filter((item: any) => 
      item.tld.toLowerCase().includes(filter.toLowerCase())
    )
    
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
              <p className="text-muted-foreground">
                找到 {sortedResults.length} 个域名选项
                {pagination && (
                  <span>，从 {pagination.total_items} 个RDAP支持的TLD中筛选</span>
                )}
              </p>
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
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                筛选选项
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {sortedResults.filter(item => item.is_available).length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">可注册</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {sortedResults.filter(item => item.market_share > 1).length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">热门后缀</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {sortedResults.filter(item => item.category === 'tech').length}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">科技类</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${Math.min(...sortedResults.filter(item => item.estimated_price).map(item => item.estimated_price)) || 0}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">最低价格</div>
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
        
        {/* List-style Layout */}
        <div className="space-y-4">
          <AnimatePresence>
            {sortedResults.map((item: any, index: number) => (
              <motion.div
                key={item.tld}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <CardSpotlight>
                  <Card className={`transition-all duration-300 border-2 ${
                    item.is_available 
                      ? 'border-green-200 hover:border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
                      : 'border-slate-200 hover:border-slate-400 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/20 dark:to-gray-800/20'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left side - Domain info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-2xl font-bold text-primary group-hover:text-primary/80">
                              {item.domain}
                            </span>
                            <Badge 
                              variant={item.is_available ? "default" : "secondary"} 
                              className={item.is_available ? "bg-green-100 text-green-800 border-green-200" : ""}
                            >
                              {item.is_available ? '可注册' : '已注册'}
                            </Badge>
                            {item.market_share > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {item.market_share.toFixed(1)}% 市场份额
                              </Badge>
                            )}
                          </div>
                          
                          {item.is_available && item.estimated_price && (
                            <div className="text-sm text-muted-foreground">
                              预估注册价格: <span className="font-semibold text-primary">${item.estimated_price}</span>
                            </div>
                          )}
                        </div>

                        {/* Right side - Top 3 Registrars */}
                        {item.is_available && item.top_registrars && item.top_registrars.length > 0 && (
                          <div className="flex-shrink-0 lg:w-2/3">
                            <div className="text-sm font-medium text-muted-foreground mb-3">
                              最低价格的三家注册商
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {item.top_registrars.map((registrar: any, regIndex: number) => (
                                <div
                                  key={registrar.registrar}
                                  className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                                    regIndex === 0 
                                      ? 'border-green-300 bg-green-50 dark:bg-green-900/30' 
                                      : 'border-slate-200 bg-white dark:bg-slate-800/50'
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-sm">{registrar.registrar}</span>
                                      {regIndex === 0 && (
                                        <Badge className="text-xs bg-green-100 text-green-700">
                                          最低价
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">注册:</span>
                                        <span className="font-semibold">${registrar.registrationPrice}</span>
                                      </div>
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>续费:</span>
                                        <span>${registrar.renewalPrice}</span>
                                      </div>
                                    </div>
                                    {registrar.discountPercent && (
                                      <Badge variant="secondary" className="text-xs">
                                        优惠 {registrar.discountPercent}%
                                      </Badge>
                                    )}
                                    <Button size="sm" className="w-full text-xs">
                                      <ShoppingCart className="mr-1 h-3 w-3" />
                                      注册
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* For unavailable domains */}
                        {!item.is_available && (
                          <div className="flex-shrink-0">
                            <Button size="sm" variant="outline">
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CardSpotlight>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredResults.length === 0 && (
          <div className="text-center py-20">
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
          </div>
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
      <div className="min-h-screen gradient-bg-premium hero-bg-pattern">
        {/* Header */}
        <header className="container-magazine py-4 relative z-[10000]">
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
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="interactive">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
          </div>
          
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
    <div className="min-h-screen gradient-bg-premium hero-bg-pattern">
      {/* Header */}
      <header className="container-magazine py-4 relative z-[10000]">
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
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

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