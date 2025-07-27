"use client"

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  BarChart3,
  ExternalLink,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SpinnerLoader } from '@/components/ui/loading-skeleton'
import { EnhancedWhoisResult } from '@/components/enhanced-whois-result'
import { useTranslations } from '@/hooks/useTranslations'
import { Footer } from '@/components/footer'
import { NextNameLogo } from '@/components/logo'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { ScrollToTop } from '@/components/scroll-to-top'
import { EnhancedSmartSearchV2 } from '@/components/enhanced-smart-search-v2'
import { RegistrarLogo } from '@/components/registrar-logos'

interface RegistrarPrice {
  registrar: string
  logo: string
  registrationPrice: number
  renewalPrice: number
  transferPrice: number
  currency: string
  specialOffer?: string
  rating: number
  features: string[]
  affiliateLink: string
}

interface DomainDetail {
  domain: string
  isAvailable: boolean
  whoisInfo?: any
  prices: RegistrarPrice[]
  recommendations: Array<{
    domain: string
    price: number
    reason: string
  }>
}

interface DomainPageClientProps {
  domain: string
  pageType?: 'domain' | 'whois' | 'price'
}

// Mock registrar prices (same as search page) - 移到组件外部避免重新创建
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

export default function DomainPageClient({ domain, pageType = 'domain' }: DomainPageClientProps) {
  const [detail, setDetail] = useState<DomainDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pricingPage, setPricingPage] = useState(1)
  const [pricingData, setPricingData] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(false)
  const { t } = useTranslations()

  const fetchPricingData = useCallback(async (domainName: string) => {
    if (!domainName || loadingPricing) return

    setLoadingPricing(true)
    try {
      const tld = domainName.split('.').pop()
      if (!tld) {
        throw new Error('Invalid domain format')
      }

      const response = await fetch(`/api/pricing?domain=${encodeURIComponent(tld)}&order=new&page=1&pageSize=20`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setPricingData(data)

    } catch (error) {
      console.error('Failed to fetch pricing data:', error)
      setPricingData(null)
    } finally {
      setLoadingPricing(false)
    }
  }, [loadingPricing])

  const fetchDomainDetail = useCallback(async () => {
    if (!domain) return

    setLoading(true)
    setError(null)

    try {
      console.log(`🔍 Fetching domain information for: ${domain}`)

      // Fetch domain information
      const domainResponse = await fetch(`/api/domain/${encodeURIComponent(domain)}`)
      const domainData = await domainResponse.json()

      console.log(`📡 Domain API response:`, {
        status: domainResponse.status,
        ok: domainResponse.ok,
        isAvailable: domainData.is_available,
        hasWhoisData: !domainData.is_available && !!domainData.registrar
      })

      if (!domainResponse.ok) {
        console.error(`❌ Domain API error:`, domainData)
        throw new Error(domainData.error || 'Failed to fetch domain information')
      }

      // 检查WHOIS数据的完整性
      if (!domainData.is_available) {
        console.log(`📋 WHOIS data check:`, {
          hasRegistrar: !!domainData.registrar,
          hasCreatedDate: !!domainData.created_date,
          hasExpiryDate: !!domainData.expiry_date,
          hasNameServers: !!(domainData.name_servers && domainData.name_servers.length > 0),
          hasStatus: !!(domainData.status && domainData.status.length > 0)
        })
      }

      setDetail({
        domain,
        isAvailable: domainData.is_available,
        whoisInfo: domainData.is_available ? null : domainData,
        prices: [], // 将通过智能数据源获取
        recommendations: []
      })

      // 获取价格数据
      fetchPricingData(domain)

    } catch (err) {
      console.error('❌ Error fetching domain detail:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [domain, fetchPricingData])

  useEffect(() => {
    fetchDomainDetail()
  }, [fetchDomainDetail])

  const handleSearch = (query: string, type: string) => {
    // Navigate to search page with new query
    window.location.href = `/search?q=${encodeURIComponent(query)}&type=${type}`
  }

  // 获取价格数据（智能数据源或兜底数据）
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
    registrarPrices = mockRegistrarPrices
  }

  // Pagination logic
  const pageSize = 5
  const startIndex = (pricingPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPagePrices = registrarPrices.slice(startIndex, endIndex)
  const totalPages = Math.ceil(registrarPrices.length / pageSize)
  const hasNextPage = pricingPage < totalPages
  const hasPrevPage = pricingPage > 1

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
              <LanguageSwitcher currentLocale="zh" />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <EnhancedSmartSearchV2
              onSearch={handleSearch}
              placeholder="搜索域名或关键词..."
            />
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <SpinnerLoader size="lg" />
              <p className="text-lg font-medium">正在查询域名信息...</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">正在查询: &quot;{domain}&quot;</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* Header - Same as search page */}
      <header className="container-magazine py-4 relative z-[10000]" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <div className="flex justify-between items-center backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <Link href="/" className="flex items-center">
              <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity cursor-pointer" />
            </Link>
          </motion.div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLocale="zh" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Search Bar - Same as search page */}
        <div className="mb-8">
          <EnhancedSmartSearchV2
            onSearch={handleSearch}
            placeholder="搜索域名或关键词..."
          />
        </div>

        <div className="space-y-8">
          {/* Domain Information Card - Same style as search page */}
          {detail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className={`border-l-4 ${detail.isAvailable ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="font-semibold tracking-tight text-xl sm:text-2xl font-mono break-words break-all max-w-full overflow-hidden">{detail.domain}</h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Badge
                        className={`text-lg px-4 py-2 ${
                          detail.isAvailable
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {detail.isAvailable ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            可注册
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            已注册
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          )}

          {/* Price Comparison Table - Same style as search page */}
          {detail && (pageType === 'price' || (detail.isAvailable && pageType !== 'whois')) && (
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
                        {currentPagePrices.map((price: any, index: number) => (
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
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-lg text-green-600">
                                  ${price.registrationPrice}
                                </span>
                                {index === 0 && (
                                  <div className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                    {/* 移动端隐藏图标，只显示文字 */}
                                    <span className="hidden sm:inline">
                                      <Sparkles className="w-3 h-3 mr-1" />
                                    </span>
                                    <span className="sm:hidden w-1 h-1 bg-green-600 rounded-full mr-1"></span>
                                    最低价
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="text-orange-600 font-semibold">
                                ${price.renewalPrice}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="text-blue-600 font-semibold">
                                ${price.transferPrice}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <Button
                                size="sm"
                                className={index === 0 ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                onClick={() => window.open(price.affiliateLink, '_blank')}
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

                  {/* Pagination - Same as search page */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        显示 {startIndex + 1}-{Math.min(endIndex, registrarPrices.length)} 共 {registrarPrices.length} 个注册商
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPricingPage(prev => Math.max(1, prev - 1))}
                          disabled={!hasPrevPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          上一页
                        </Button>
                        <span className="text-sm">
                          {pricingPage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPricingPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={!hasNextPage}
                        >
                          下一页
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* WHOIS Information - Only show for registered domains and not on price page */}
          {detail && !detail.isAvailable && detail.whoisInfo && (pageType !== 'price') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <EnhancedWhoisResult
                domain={detail.domain}
                whoisInfo={detail.whoisInfo}
                isAvailable={detail.isAvailable}
                showDomainHeader={false}
              />
            </motion.div>
          )}
        </div>
      </div>

      <Footer />

      {/* 回到顶部按钮 */}
      <ScrollToTop threshold={400} />
    </div>
  )
}
