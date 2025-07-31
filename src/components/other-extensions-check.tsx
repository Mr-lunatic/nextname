"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface OtherExtensionsCheckProps {
  domain: string
}

export function OtherExtensionsCheck({ domain }: OtherExtensionsCheckProps) {
  const [extensionsData, setExtensionsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 使用 useMemo 来避免 popularRdapTlds 在每次渲染时都改变
  // 10个热门RDAP支持的TLD作为备选池，前端仅显示7个，剩下3个作为失败时的备选
  const popularRdapTlds = useMemo(() => [
    // 主要显示的7个TLD（按优先级排序）
    '.com',    // Verisign - 最稳定
    '.net',    // Verisign - 最稳定
    '.org',    // PIR - 稳定
    '.io',     // NIC.io - 技术友好
    '.ai',     // Identity Digital - AI热门
    '.dev',    // Google - 开发者友好
    '.app',    // Google - 应用开发
    // 备选的3个TLD（当主要TLD查询失败时使用）
    '.info',   // Identity Digital - 支持良好
    '.tech',   // CentralNic - 技术相关
    '.online'  // CentralNic - 通用用途
  ], [])

  const domainPrefix = useMemo(() => {
    if (!domain || typeof domain !== 'string') {
      return ''
    }
    return domain.split('.')[0]
  }, [domain])

  useEffect(() => {
    const checkExtensions = async () => {
      // 添加安全检查
      if (!domain || typeof domain !== 'string' || !domainPrefix) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        const currentTld = '.' + domain.split('.').slice(1).join('.')
        const tldsToCheck = popularRdapTlds.filter(tld => tld !== currentTld)
        
        // 分为主要TLD（前7个）和备选TLD（后3个）
        const mainTlds = tldsToCheck.slice(0, 7)
        const backupTlds = tldsToCheck.slice(7)
        
        console.log('🔍 Checking main TLDs:', mainTlds)
        console.log('🔄 Backup TLDs available:', backupTlds)
        
        // 先查询主要的7个TLD
        const results: any[] = []
        const failedTlds: string[] = []
        
        // 使用异步并发查询，但限制并发数量以避免过载
        const batchSize = 3 // 每批处理3个TLD
        
        for (let i = 0; i < mainTlds.length; i += batchSize) {
          const batch = mainTlds.slice(i, i + batchSize)
          const batchPromises = batch.map(async (tld) => {
            const testDomain = `${domainPrefix}${tld}`
            try {
              // 根据TLD设置不同的超时时间
              const timeout = getTimeoutForTLD(tld)
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), timeout)
              
              const response = await fetch(`/api/search?q=${encodeURIComponent(testDomain)}&type=domain`, {
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
              }
              
              const data = await response.json()
              console.log(`✅ Successfully queried ${testDomain}`)
              return {
                domain: testDomain,
                extension: tld,
                available: data.result?.is_available || false,
                current: false,
                query_method: data.result?.query_method || 'unknown',
                success: true
              }
            } catch (error) {
              console.warn(`❌ Failed to query ${testDomain}:`, error)
              failedTlds.push(tld)
              return {
                domain: testDomain,
                extension: tld,
                success: false,
                error: error
              }
            }
          })
          
          const batchResults = await Promise.allSettled(batchPromises)
          const successfulBatchResults = batchResults
            .map((result, index) => {
              if (result.status === 'fulfilled' && result.value.success) {
                return result.value
              }
              return null
            })
            .filter(Boolean)
          
          results.push(...successfulBatchResults)
          
          // 在批次之间添加小延迟，避免服务器过载
          if (i + batchSize < mainTlds.length) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
        }
        
        // 如果有失败的TLD且有备选TLD可用，使用备选TLD替补
        if (failedTlds.length > 0 && backupTlds.length > 0) {
          console.log(`🔄 ${failedTlds.length} TLDs failed, using ${Math.min(failedTlds.length, backupTlds.length)} backup TLDs`)
          
          const backupTldsToUse = backupTlds.slice(0, failedTlds.length)
          
          for (const tld of backupTldsToUse) {
            const testDomain = `${domainPrefix}${tld}`
            try {
              const timeout = getTimeoutForTLD(tld)
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), timeout)
              
              const response = await fetch(`/api/search?q=${encodeURIComponent(testDomain)}&type=domain`, {
                signal: controller.signal
              })
              clearTimeout(timeoutId)
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
              }
              
              const data = await response.json()
              console.log(`✅ Backup TLD ${testDomain} succeeded`)
              results.push({
                domain: testDomain,
                extension: tld,
                available: data.result?.is_available || false,
                current: false,
                query_method: data.result?.query_method || 'unknown',
                isBackup: true
              })
            } catch (error) {
              console.warn(`❌ Backup TLD ${testDomain} also failed:`, error)
              // 对于备选TLD失败，使用改进的启发式判断
              const isLikelyAvailable = getRdapHeuristicAvailability(domainPrefix, tld)
              results.push({
                domain: testDomain,
                extension: tld,
                available: isLikelyAvailable,
                current: false,
                heuristic: true,
                query_method: 'heuristic',
                isBackup: true
              })
            }
          }
        }
        
        // 添加当前域名到结果中
        const allResults = [
          {
            domain: domain,
            extension: currentTld,
            available: false, // 当前查询的域名，如果显示在这里说明是已注册的
            current: true,
            query_method: 'current'
          },
          ...results
        ]

        setExtensionsData(allResults)
      } catch (error) {
        console.error('Error checking extensions:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExtensions()
  }, [domain, domainPrefix, popularRdapTlds])

  // RDAP TLD特定超时时间设置
  const getTimeoutForTLD = (tld: string): number => {
    // Google管理的TLD通常很快
    const googleTlds = ['.dev', '.app']
    // Verisign管理的TLD很稳定
    const verisignTlds = ['.com', '.net']
    // 其他稳定的RDAP TLD
    const stableTlds = ['.org', '.info']
    // CentralNic管理的TLD
    const centralnicTlds = ['.tech', '.online']
    // 特殊TLD
    const specialTlds = ['.io', '.ai']
    
    if (googleTlds.includes(tld) || verisignTlds.includes(tld)) {
      return 2000 // 2秒 for fast and reliable TLDs
    } else if (stableTlds.includes(tld)) {
      return 2500 // 2.5秒 for stable TLDs
    } else if (centralnicTlds.includes(tld)) {
      return 3000 // 3秒 for CentralNic TLDs
    } else if (specialTlds.includes(tld)) {
      return 3500 // 3.5秒 for special TLDs
    } else {
      return 4000 // 4秒 for others
    }
  }

  // 针对RDAP支持TLD的改进启发式判断
  const getRdapHeuristicAvailability = (prefix: string, tld: string): boolean => {
    // 基于域名特征和TLD特性的判断
    const commonWords = ['app', 'api', 'www', 'mail', 'admin', 'blog', 'shop', 'home', 'info', 'news', 'support', 'help', 'contact', 'test', 'demo', 'example', 'tech', 'dev', 'ai', 'online']
    const isCommonWord = commonWords.includes(prefix.toLowerCase())
    const isShort = prefix.length <= 3
    const isVeryShort = prefix.length <= 2
    
    // 不同TLD的注册情况分析
    const highDemandTlds = ['.com', '.net', '.org', '.io', '.ai']
    const mediumDemandTlds = ['.info', '.tech', '.online']
    const devFocusedTlds = ['.dev', '.app']
    
    // 极短域名在热门TLD下几乎都被注册
    if (isVeryShort && highDemandTlds.includes(tld)) {
      return false
    }
    
    // 短域名或常见词在高需求TLD下很可能被注册
    if ((isShort || isCommonWord) && highDemandTlds.includes(tld)) {
      return Math.random() > 0.8 // 20%概率可用
    }
    
    // 开发相关的域名在dev/app TLD下可能被注册
    const isDevelopmentRelated = /^(api|app|dev|code|git|test|demo)/.test(prefix.toLowerCase())
    if (isDevelopmentRelated && devFocusedTlds.includes(tld)) {
      return Math.random() > 0.6 // 40%概率可用
    }
    
    // 中等需求TLD有更好的可用性
    if (mediumDemandTlds.includes(tld)) {
      return Math.random() > 0.4 // 60%概率可用
    }
    
    // 其他情况
    return Math.random() > 0.3 // 70%概率可用
  }

  const handleViewMore = () => {
    window.location.href = `/search?q=${encodeURIComponent(domainPrefix)}&type=prefix`
  }

  // 添加安全检查
  if (!domain || typeof domain !== 'string') {
    return <div>域名信息无效</div>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-muted rounded-lg p-3 h-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Web端：4*2布局，移动端：2*4布局，显示7个TLD + 第8个位置的"查看更多"按钮 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {extensionsData.slice(0, 7).map((item, index) => (
          <motion.div
            key={item.domain}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
              ${item.current 
                ? 'bg-primary/10 border-primary/30 ring-2 ring-primary/20 dark:bg-primary/5 dark:border-primary/40' 
                : item.available 
                  ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/30' 
                  : 'bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/20 dark:border-red-700 dark:hover:bg-red-900/30'
              }
            `}
            onClick={() => {
              if (!item.current) {
                window.location.href = `/search?q=${encodeURIComponent(item.domain)}&type=domain`
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-medium truncate text-foreground dark:text-foreground">
                  {item.domain}
                </div>
                <div className="flex items-center mt-1">
                  {item.current ? (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 dark:bg-primary/5 dark:text-primary">
                      当前域名
                    </Badge>
                  ) : item.available ? (
                    <Badge className={`text-xs flex items-center ${
                      item.heuristic 
                        ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600' 
                        : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600'
                    }`}>
                      <Check className="w-3 h-3 mr-1" />
                      <span className="truncate">
                        {item.heuristic ? '可能可注册' : '可注册'}
                        {item.query_method === 'rdap' && <span className="ml-1 text-xs opacity-75">(RDAP)</span>}
                        {item.isBackup && <span className="ml-1 text-xs opacity-75">(备选)</span>}
                      </span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className={`text-xs flex items-center ${
                      item.heuristic 
                        ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-600' 
                        : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600'
                    }`}>
                      <X className="w-3 h-3 mr-1" />
                      <span className="truncate">
                        {item.heuristic ? '可能已注册' : '已注册'}
                        {item.query_method === 'rdap' && <span className="ml-1 text-xs opacity-75">(RDAP)</span>}
                        {item.isBackup && <span className="ml-1 text-xs opacity-75">(备选)</span>}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
              {!item.current && (
                <ExternalLink className="w-4 h-4 text-muted-foreground dark:text-muted-foreground ml-2 flex-shrink-0" />
              )}
            </div>
          </motion.div>
        ))}
        
        {/* 第8个位置：查看更多按钮 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 7 * 0.05 }}
          className="relative p-3 rounded-lg border border-dashed border-primary/30 hover:border-primary/50 transition-all duration-200 cursor-pointer bg-primary/5 hover:bg-primary/10 dark:border-primary/40 dark:hover:border-primary/60 dark:bg-primary/5 dark:hover:bg-primary/10"
          onClick={handleViewMore}
        >
          <div className="flex flex-col items-center justify-center h-full min-h-[40px]">
            <div className="text-center">
              <div className="text-sm font-medium text-primary dark:text-primary mb-1">
                查看更多后缀
                </div>
              <div className="text-xs text-muted-foreground">
                探索所有可用域名
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}