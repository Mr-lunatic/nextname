"use client"

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  Clock, 
  ExternalLink, 
  Star, 
  TrendingUp, 
  ShoppingCart,
  Copy,
  Check,
  Info,
  BarChart3,
  Calendar,
  Server,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SpinnerLoader } from '@/components/ui/loading-skeleton'
import { EnhancedWhoisResult } from '@/components/enhanced-whois-result'
import { BestNameSpotlight, CardSpotlight } from '@/components/ui/framer-spotlight'
import { useTranslations } from '@/hooks/useTranslations'
import { Footer } from '@/components/footer'

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
  prices?: RegistrarPrice[]
  recommendations?: string[]
}

function DomainDetailContent() {
  const params = useParams()
  const domain = params.domain as string
  const [detail, setDetail] = useState<DomainDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { t } = useTranslations()

  const fetchDomainDetail = useCallback(async () => {
    setLoading(true)
    try {
      // Real API call to get domain information
      const response = await fetch(`/api/domain/${encodeURIComponent(domain)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch domain data')
      }

      const domainDetail: DomainDetail = {
        domain: data.domain,
        isAvailable: data.is_available,
        whoisInfo: data.is_available ? undefined : {
          domainName: data.domain,
          registryDomainId: data.registry_domain_id || null,
          registrarWhoisServer: data.registrar_whois_server || null,
          registrarUrl: data.registrar_url || null,
          updatedDate: data.updated_date || null,
          creationDate: data.created_date || null,
          registryExpiryDate: data.expiry_date || null,
          transferDate: data.transfer_date || null,
          registrar: data.registrar || null,
          registrarIanaId: data.registrar_iana_id || null,
          registrarAbuseContactEmail: data.registrar_abuse_contact_email || null,
          registrarAbuseContactPhone: data.registrar_abuse_contact_phone || null,
          domainStatus: data.status || [],
          nameServers: data.name_servers || [],
          dnssec: data.dnssec || 'unsigned',
          lastUpdateOfWhoisDatabase: data.last_update_of_whois_database || new Date().toISOString()
        },
        prices: [
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
            registrar: 'Google Domains',
            logo: '/logos/google.svg',
            registrationPrice: 12.00,
            renewalPrice: 12.00,
            transferPrice: 12.00,
            currency: 'USD',
            rating: 4.3,
            features: ['Google集成', '免费隐私保护', '简洁界面'],
            affiliateLink: 'https://domains.google'
          }
        ],
        recommendations: [
          `${data.domain.split('.')[0]}.net`,
          `${data.domain.split('.')[0]}.org`,
          `${data.domain.split('.')[0]}.io`,
          `get${data.domain.split('.')[0]}.com`,
          `${data.domain.split('.')[0]}app.com`
        ]
      }

      setDetail(domainDetail)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch domain detail:', error)
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    if (domain) {
      fetchDomainDetail()
    }
  }, [domain, fetchDomainDetail])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link href="/search">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回搜索
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <SpinnerLoader size="lg" />
              <p className="text-lg font-medium">{t('domain.loadingDetails')}</p>
              <p className="text-sm text-muted-foreground">正在查询: {decodeURIComponent(domain)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="space-y-4">
              <div className="text-6xl">❌</div>
              <h3 className="text-xl font-semibold">{t('domain.loadingFailed')}</h3>
              <p className="text-muted-foreground">{t('errors.pleaseTryAgain')}</p>
              <Button onClick={fetchDomainDetail}>{t('common.reload')}</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/search">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回搜索
            </Button>
          </Link>
        </div>

        {/* Domain Header */}
        <BestNameSpotlight>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden"
          >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-4xl font-bold font-mono text-primary">{detail.domain}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(detail.domain)}
                    className="opacity-70 hover:opacity-100"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  {detail.isAvailable ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                      <Check className="h-4 w-4 mr-2" />
                      可以注册
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 px-4 py-2">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      已被注册
                    </Badge>
                  )}
                </div>

                {detail.isAvailable && detail.prices && (
                  <div className="text-lg">
                    最低注册价格: 
                    <span className="font-bold text-green-600 ml-2">
                      ${Math.min(...detail.prices.map(p => p.registrationPrice))}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({detail.prices.find(p => p.registrationPrice === Math.min(...detail.prices!.map(pr => pr.registrationPrice)))?.registrar})
                    </span>
                  </div>
                )}
              </div>

              {detail.isAvailable && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    立即注册
                  </Button>
                  <Button size="lg" variant="outline">
                    <Star className="mr-2 h-5 w-5" />
                    收藏域名
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        </BestNameSpotlight>

        {/* Price Comparison Table */}
        {detail.isAvailable && detail.prices && (
          <motion.div
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
                      {detail.prices
                        .sort((a, b) => a.registrationPrice - b.registrationPrice)
                        .map((price, index) => (
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
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                <Globe className="h-4 w-4" />
                              </div>
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

        {/* WHOIS Information */}
        {!detail.isAvailable && detail.whoisInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <EnhancedWhoisResult
              domain={detail.domain}
              whoisInfo={detail.whoisInfo}
              isAvailable={detail.isAvailable}
            />
          </motion.div>
        )}

        {/* Domain Recommendations */}
        {detail.recommendations && detail.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <CardSpotlight>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <span>相关域名推荐</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {detail.recommendations.map((recommendation, index) => (
                      <motion.div
                        key={recommendation}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CardSpotlight>
                          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-primary/30">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-semibold">{recommendation}</span>
                                <Badge className="bg-green-100 text-green-800">可注册</Badge>
                              </div>
                              <div className="mt-2 text-sm text-muted-foreground">
                                预估价格: $12.99
                              </div>
                            </CardContent>
                          </Card>
                        </CardSpotlight>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardSpotlight>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function DomainDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <SpinnerLoader size="lg" />
          <p className="text-lg font-medium">加载中...</p>
        </div>
      </div>
    }>
      <DomainDetailContent />
    </Suspense>
  )
}