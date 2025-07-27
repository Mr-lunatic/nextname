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
        
        const promises = extensionsToCheck.map(async (extension) => {
          const testDomain = `${domainPrefix}${extension}`
          try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(testDomain)}&type=domain`)
            const data = await response.json()
            return {
              domain: testDomain,
              extension,
              available: data.result?.is_available || false,
              current: false
            }
          } catch (error) {
            console.error(`Error checking ${testDomain}:`, error)
            return {
              domain: testDomain,
              extension,
              available: false,
              current: false,
              error: true
            }
          }
        })

        const results = await Promise.all(promises)
        
        // 添加当前域名到结果中
        const allResults = [
          {
            domain: domain,
            extension: currentTld,
            available: false, // 当前查询的域名，如果显示在这里说明是已注册的
            current: true
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
  }, [domain, domainPrefix, commonExtensions])

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, index) => (
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {extensionsData.slice(0, 8).map((item, index) => (
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
                    <Badge className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      可注册
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-600">
                      <X className="w-3 h-3 mr-1" />
                      已注册
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
      </div>
      
      <div className="flex justify-center pt-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewMore}
          className="text-sm dark:border-border dark:text-foreground dark:hover:bg-accent"
        >
          查看更多后缀
        </Button>
      </div>
    </div>
  )
}
