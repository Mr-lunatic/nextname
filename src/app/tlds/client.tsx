"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, Grid, List, Globe, Building, Users, Tag } from 'lucide-react'
import Link from 'next/link'
import { tldManager, TLDDetails } from '@/lib/tld-manager'
import { NextNameLogo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { Footer } from '@/components/footer'
// import { TLDListStructuredData } from '@/components/tld-structured-data'
import { ScrollToTop } from '@/components/scroll-to-top'
// import { Pagination, PaginationInfo } from '@/components/ui/pagination'

export default function TLDsPageClient() {
  const [tlds, setTlds] = useState<TLDDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('priority')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLoading, setPageLoading] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  // 响应式分页设置：桌面端4列*10行=40，移动端2列*20行=40
  const itemsPerPage = 40

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
        case 'priority':
          // 先按优先级排序，再按字母排序
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          return a.tld.localeCompare(b.tld)
        case 'alphabetical':
          return a.tld.localeCompare(b.tld)
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          // 默认按优先级排序
          if (a.priority !== b.priority) {
            return a.priority - b.priority
          }
          return a.tld.localeCompare(b.tld)
      }
    })

    return filtered
  }, [tlds, searchQuery, typeFilter, sortBy])

  // 分页计算
  const totalPages = Math.ceil(filteredAndSortedTLDs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageTLDs = filteredAndSortedTLDs.slice(startIndex, endIndex)

  // 当过滤条件改变时重置到第一页，并添加防抖
  useEffect(() => {
    setIsFiltering(true)
    setCurrentPage(1)

    // 防抖处理，避免快速筛选时的DOM冲突
    const timer = setTimeout(() => {
      setIsFiltering(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [searchQuery, typeFilter, sortBy])

  // 当页面改变时滚动到顶部并显示加载状态
  useEffect(() => {
    setPageLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // 模拟页面切换的加载时间
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 200) // 减少加载时间，避免动画冲突

    return () => clearTimeout(timer)
  }, [currentPage])

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return // 忽略输入框中的按键

      switch (event.key) {
        case 'ArrowLeft':
          if (currentPage > 1) {
            event.preventDefault()
            setCurrentPage(currentPage - 1)
          }
          break
        case 'ArrowRight':
          if (currentPage < totalPages) {
            event.preventDefault()
            setCurrentPage(currentPage + 1)
          }
          break
        case 'Home':
          if (event.ctrlKey) {
            event.preventDefault()
            setCurrentPage(1)
          }
          break
        case 'End':
          if (event.ctrlKey) {
            event.preventDefault()
            setCurrentPage(totalPages)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages])

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
      {/* <TLDListStructuredData
        tlds={filteredAndSortedTLDs}
        totalCount={tlds.length}
      /> */}

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
            All Domain Extensions (TLDs)
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8"
          >
            Browse all available domain extensions organized by category, with gTLD domains prioritized
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
                <div className="text-sm text-muted-foreground">Total TLDs</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{filteredAndSortedTLDs.length}</div>
                <div className="text-sm text-muted-foreground">Filtered Results</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentPage} / {totalPages}
                </div>
                <div className="text-sm text-muted-foreground">Current Page</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tlds.filter(t => t.type === 'generic').length}
                </div>
                <div className="text-sm text-muted-foreground">gTLD Domains</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold mb-2">Search & Filter Domain Extensions</h2>
          <p className="text-muted-foreground">Find the perfect TLD for your project from our comprehensive database</p>
        </motion.div>

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
                    placeholder="Search TLD or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setIsFiltering(true)
                    setTypeFilter(value)
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="generic">gTLD (Generic)</SelectItem>
                    <SelectItem value="country">ccTLD (Country)</SelectItem>
                    <SelectItem value="sponsored">sTLD/rTLD (Sponsored)</SelectItem>
                    <SelectItem value="second-level">Second Level</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setIsFiltering(true)
                    setSortBy(value)
                  }}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">By Importance</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
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
          className="relative"
        >
          {/* 页面加载覆盖层 */}
          {(pageLoading || isFiltering) && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>
                  {isFiltering ? 'Filtering results...' : `Loading page ${currentPage}...`}
                </span>
              </div>
            </div>
          )}

          {filteredAndSortedTLDs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No matching TLDs found</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${currentPage}-${typeFilter}-${sortBy}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={viewMode === 'grid'
                  ? 'grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'
                  : 'space-y-4'
                }
              >
                {!isFiltering && currentPageTLDs.map((tld, index) => (
                  <motion.div
                    key={tld.tld}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.01, duration: 0.2 }}
                  >
                  <Link href={`/tld${tld.tld}`}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
                        <div className="text-2xl font-mono font-bold text-primary group-hover:text-primary/80 transition-colors mb-3">
                          {tld.tld}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tld.category
                            .replace('Generic Top-Level Domains (gTLD)', 'gTLD')
                            .replace('Country Code Top-Level Domains (ccTLD)', 'ccTLD')
                            .replace('Sponsored/Restricted Top-Level Domains (sTLD/rTLD)', 'sTLD/rTLD')
                            .replace('Second/Third Level Domains', 'Second Level')
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        {/* 简化的分页控件 */}
        {filteredAndSortedTLDs.length > 0 && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 space-y-6"
          >
            {/* 分页信息 */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedTLDs.length)} of {filteredAndSortedTLDs.length} results
                </div>
                <div className="text-xs text-muted-foreground hidden lg:block">
                  Use ← → arrow keys to navigate • Ctrl+Home/End for first/last page
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* 快速跳转按钮 */}
                <div className="hidden md:flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </Button>
                </div>

                {/* 跳转到页面 */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="hidden sm:inline">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const page = parseInt(e.target.value)
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                      }
                    }}
                    className="w-16 border rounded px-2 py-1 bg-background text-center"
                  />
                  <span>/ {totalPages}</span>
                </div>
              </div>
            </div>

            {/* 简化的分页控件 */}
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />

      {/* 回到顶部按钮 */}
      <ScrollToTop threshold={400} />
    </div>
  )
}
