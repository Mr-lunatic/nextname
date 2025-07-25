"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Grid, List, TrendingUp, Globe, Building, Users } from 'lucide-react'
import Link from 'next/link'
import { tldManager, TLDDetails } from '@/lib/tld-manager'
import { NextNameLogo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { Footer } from '@/components/footer'
import { TLDListStructuredData } from '@/components/tld-structured-data'
import { ScrollToTop } from '@/components/scroll-to-top'

export default function TLDsPageClient() {
  const [tlds, setTlds] = useState<TLDDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('popularity')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const loadTLDs = async () => {
      try {
        const allTLDs = await tldManager.getAllTLDs()
        setTlds(allTLDs)
      } catch (error) {
        console.error('Failed to load TLDs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTLDs()
  }, [])

  const filteredAndSortedTLDs = useMemo(() => {
    let filtered = tlds

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(tld => 
        tld.tld.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tld.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 类型过滤
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tld => tld.type === typeFilter)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularityScore - a.popularityScore
        case 'price':
          return (a.averagePrice || 999) - (b.averagePrice || 999)
        case 'alphabetical':
          return a.tld.localeCompare(b.tld)
        default:
          return 0
      }
    })

    return filtered
  }, [tlds, searchQuery, typeFilter, sortBy])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'generic': return <Globe className="h-4 w-4" />
      case 'country': return <Building className="h-4 w-4" />
      case 'sponsored': return <Users className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generic': return '通用域名'
      case 'country': return '国家域名'
      case 'sponsored': return '赞助域名'
      case 'infrastructure': return '基础设施'
      default: return '其他'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <header className="backdrop-blur" style={{ borderBottom: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-surface-secondary)' }}>
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
            <p className="mt-4 text-muted-foreground">加载TLD数据中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <TLDListStructuredData
        tlds={filteredAndSortedTLDs}
        totalCount={tlds.length}
      />

      {/* Header */}
      <header className="backdrop-blur" style={{ borderBottom: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-surface-secondary)' }}>
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
        {/* Page Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            顶级域名大全
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8"
          >
            探索所有可注册的顶级域名，找到最适合您的域名后缀
          </motion.p>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{tlds.length}</div>
                <div className="text-sm text-muted-foreground">总TLD数量</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tlds.filter(t => t.type === 'generic').length}
                </div>
                <div className="text-sm text-muted-foreground">通用域名</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {tlds.filter(t => t.type === 'country').length}
                </div>
                <div className="text-sm text-muted-foreground">国家域名</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ${Math.min(...tlds.filter(t => t.averagePrice).map(t => t.averagePrice!))}
                </div>
                <div className="text-sm text-muted-foreground">最低价格</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索TLD或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    <SelectItem value="generic">通用域名</SelectItem>
                    <SelectItem value="country">国家域名</SelectItem>
                    <SelectItem value="sponsored">赞助域名</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">按热度排序</SelectItem>
                    <SelectItem value="price">按价格排序</SelectItem>
                    <SelectItem value="alphabetical">按字母排序</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {filteredAndSortedTLDs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">没有找到匹配的TLD</p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredAndSortedTLDs.map((tld, index) => (
                <motion.div
                  key={tld.tld}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/tld${tld.tld}`}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-mono">{tld.tld}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(tld.type)}
                            <Badge variant="secondary">
                              {getTypeLabel(tld.type)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {tld.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              热度: {tld.popularityScore}
                            </span>
                          </div>
                          {tld.averagePrice && (
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">起价</div>
                              <div className="font-semibold text-primary">
                                ${tld.averagePrice}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />

      {/* 回到顶部按钮 */}
      <ScrollToTop threshold={400} />
    </div>
  )
}
