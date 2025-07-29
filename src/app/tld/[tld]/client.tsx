"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Globe, Building, Users, Shield, Check, X,
  TrendingUp, DollarSign, Info, ExternalLink,
  Star, Clock, Award, AlertCircle, Tag
} from 'lucide-react'
import Link from 'next/link'
import { tldManager, TLDDetails } from '@/lib/tld-manager'
import { NextNameLogo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { Footer } from '@/components/footer'
import { TLDStructuredData } from '@/components/tld-structured-data'
import { notFound } from 'next/navigation'

interface TLDPageClientProps {
  params: {
    tld: string
  }
}

export default function TLDPageClient({ params }: TLDPageClientProps) {
  const [tldDetails, setTldDetails] = useState<TLDDetails | null>(null)
  const [relatedTLDs, setRelatedTLDs] = useState<TLDDetails[]>([])
  const [loading, setLoading] = useState(true)

  const tld = decodeURIComponent(params.tld)

  useEffect(() => {
    const loadTLDData = async () => {
      try {
        const details = await tldManager.getTLDDetails(tld)
        if (!details) {
          notFound()
          return
        }
        
        setTldDetails(details)
        
        const related = await tldManager.getRelatedTLDs(tld, 6)
        setRelatedTLDs(related)
      } catch (error) {
        console.error('Failed to load TLD data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    loadTLDData()
  }, [tld])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'generic': return <Globe className="h-5 w-5" />
      case 'country': return <Building className="h-5 w-5" />
      case 'sponsored': return <Users className="h-5 w-5" />
      default: return <Globe className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generic': return '通用顶级域名'
      case 'country': return '国家代码顶级域名'
      case 'sponsored': return '赞助顶级域名'
      case 'infrastructure': return '基础设施顶级域名'
      default: return '其他类型域名'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="cursor-pointer">
                <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity" />
              </Link>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">加载TLD详情中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!tldDetails) {
    return notFound()
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <TLDStructuredData
        tld={tldDetails}
        url={`https://nextname.app/tld${tld}`}
      />

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="cursor-pointer">
              <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity" />
            </Link>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">首页</Link></li>
            <li>/</li>
            <li><Link href="/tlds" className="hover:text-primary">顶级域名</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{tld}域名</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getTypeIcon(tldDetails.type)}
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold font-mono">{tld}</h1>
                      <p className="text-muted-foreground">{getTypeLabel(tldDetails.type)}</p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-muted-foreground mb-4">
                    {tldDetails.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tldDetails.category}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getTypeIcon(tldDetails.type)}
                      {getTypeLabel(tldDetails.type)}
                    </Badge>
                    {tldDetails.restrictions && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        有限制
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-medium text-muted-foreground mb-2">
                    {tldDetails.type === 'generic' ? '通用顶级域名' :
                     tldDetails.type === 'country' ? '国家代码域名' :
                     tldDetails.type === 'sponsored' ? '赞助域名' : '二级域名'}
                  </div>
                  <Button className="mt-4" asChild>
                    <Link href={`/search?q=${tld}&type=suffix`}>
                      查找注册商
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">域名</label>
                      <p className="font-medium font-mono">{tldDetails.tld}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">分类</label>
                      <p className="font-medium">{tldDetails.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">域名类型</label>
                      <p className="font-medium">{getTypeLabel(tldDetails.type)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">状态</label>
                      <Badge variant={tldDetails.status === 'active' ? 'default' : 'secondary'}>
                        {tldDetails.status === 'active' ? '活跃' : '非活跃'}
                      </Badge>
                    </div>
                  </div>
                  
                  {tldDetails.restrictions && (
                    <>
                      <Separator />
                    </>
                  )}

                  {tldDetails.restrictions && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">使用限制</label>
                      <p className="mt-1 text-orange-600">{tldDetails.restrictions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Usage Examples */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    适用场景
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">使用示例</h4>
                      <ul className="space-y-2">
                        {tldDetails.usageExamples.map((example, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">目标用户</h4>
                      <ul className="space-y-2">
                        {tldDetails.targetAudience.map((audience, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>{audience}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pros and Cons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    使用信息
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-blue-600">目标用户</h4>
                      <ul className="space-y-2">
                        {tldDetails.targetAudience.map((audience, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span className="text-sm">{audience}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 text-green-600">使用示例</h4>
                      <ul className="space-y-2">
                        {tldDetails.usageExamples.map((example, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-green-600 mt-0.5" />
                            <span className="text-sm font-mono">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {tldDetails.restrictions && (
                    <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-orange-600 mb-1">注册限制</h4>
                          <span className="text-sm text-orange-700 dark:text-orange-300">{tldDetails.restrictions}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">快速操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href={`/search?q=${tld}&type=suffix`}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      查看注册商价格
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/search?q=example${tld}&type=domain`}>
                      <Globe className="mr-2 h-4 w-4" />
                      检查域名可用性
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/tlds">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      浏览所有TLD
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Related TLDs */}
            {relatedTLDs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">相关域名后缀</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {relatedTLDs.map((relatedTLD) => (
                        <Link
                          key={relatedTLD.tld}
                          href={`/tld${relatedTLD.tld}`}
                          className="block p-3 rounded-lg border hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-mono font-medium">{relatedTLD.tld}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {relatedTLD.description}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {relatedTLD.type}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
