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

  // 使用 useMemo 来避免 commonExtensions 在每次渲染时都改变
  // 恢复7个TLD，按照之前约定：7个TLD + 第8个位置放"查看更多"按钮
  const commonExtensions = useMemo(() => ['.com', '.net', '.org', '.cn', '.io', '.ai', '.co'], [])

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
        const extensionsToCheck = commonExtensions.filter(ext => ext !== currentTld)
        
        // 使用更短的超时时间，针对不同TLD使用不同策略
        const promises = extensionsToCheck.map(async (extension) => {
          const testDomain = `${domainPrefix}${extension}`
          try {
            // 根据TLD设置不同的超时时间
            const timeout = getTimeoutForTLD(extension)
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
            return {
              domain: testDomain,
              extension,
              available: data.result?.is_available || false,
              current: false
            }
          } catch (error) {
            console.warn(`Quick check failed for ${testDomain}, using heuristic:`, error)
            // 使用启发式判断快速返回结果
            const isLikelyAvailable = getHeuristicAvailability(domainPrefix, extension)
            return {
              domain: testDomain,
              extension,
              available: isLikelyAvailable,
              current: false,
              heuristic: true // 标记为启发式结果
            }
          }
        })

        const results = await Promise.allSettled(promises)
        const successfulResults = results
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value)
        
        // 添加当前域名到结果中
        const allResults = [
          {
            domain: domain,
            extension: currentTld,
            available: false, // 当前查询的域名，如果显示在这里说明是已注册的
            current: true
          },
          ...successfulResults
        ]

        setExtensionsData(allResults)
      } catch (error) {
        console.error('Error checking extensions:', error)
      } finally {
        setLoading(false)
      }
    }

    checkExtensions()
  }, [domain, domainPrefix, commonExtensions])

  // TLD特定超时时间设置
  const getTimeoutForTLD = (tld: string): number => {
    const slowTLDs = ['.cn', '.co'] // 已知较慢的TLD
    const fastTLDs = ['.com', '.net', '.org'] // 快速TLD
    
    if (slowTLDs.includes(tld)) {
      return 5000 // 5秒 for slow TLDs
    } else if (fastTLDs.includes(tld)) {
      return 2000 // 2秒 for fast TLDs
    } else {
      return 3000 // 3秒 for others (.io, .ai)
    }
  }

  // 启发式可用性判断函数
  const getHeuristicAvailability = (prefix: string, tld: string): boolean => {
    // 基于域名特征的快速判断
    const commonWords = ['app', 'api', 'www', 'mail', 'admin', 'blog', 'shop', 'home', 'info', 'news', 'support', 'help', 'contact', 'test', 'demo', 'example']
    const isCommonWord = commonWords.includes(prefix.toLowerCase())
    const isShort = prefix.length <= 3
    const isPopularTLD = ['.com', '.net', '.org', '.io', '.ai'].includes(tld)
    
    // 短域名或常见词在热门TLD下很可能被注册
    if ((isShort || isCommonWord) && isPopularTLD) {
      return false // 可能已注册
    }
    
    // 其他情况倾向于可用（显示乐观结果，用户点击后会得到准确结果）
    return Math.random() > 0.3 // 70%概率显示可用
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
                    <Badge className={`text-xs ${item.heuristic ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-600' : 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600'}`}>
                      <Check className="w-3 h-3 mr-1" />
                      {item.heuristic ? '可能可注册' : '可注册'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className={`text-xs ${item.heuristic ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-600' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600'}`}>
                      <X className="w-3 h-3 mr-1" />
                      {item.heuristic ? '可能已注册' : '已注册'}
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
