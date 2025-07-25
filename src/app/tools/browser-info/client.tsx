"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Monitor, Globe, Shield, Check, RefreshCw } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

interface BrowserInfo {
  userAgent: string
  browser: string
  version: string
  os: string
  platform: string
  language: string
  languages: string[]
  timezone: string
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelDepth: number
  }
  viewport: {
    width: number
    height: number
  }
  cookieEnabled: boolean
  onlineStatus: boolean
  javaEnabled: boolean
  doNotTrack: string | null
  hardwareConcurrency: number
  deviceMemory?: number
  connection?: any
  fingerprint: string
}

export default function BrowserInfoClient() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // 解析User Agent
  const parseUserAgent = (ua: string) => {
    let browser = 'Unknown'
    let version = 'Unknown'
    let os = 'Unknown'

    // 检测浏览器
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      browser = 'Chrome'
      const match = ua.match(/Chrome\/([0-9.]+)/)
      if (match) version = match[1]
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox'
      const match = ua.match(/Firefox\/([0-9.]+)/)
      if (match) version = match[1]
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      browser = 'Safari'
      const match = ua.match(/Version\/([0-9.]+)/)
      if (match) version = match[1]
    } else if (ua.includes('Edg')) {
      browser = 'Edge'
      const match = ua.match(/Edg\/([0-9.]+)/)
      if (match) version = match[1]
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
      browser = 'Opera'
      const match = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)
      if (match) version = match[1]
    }

    // 检测操作系统
    if (ua.includes('Windows NT 10.0')) {
      os = 'Windows 10/11'
    } else if (ua.includes('Windows NT 6.3')) {
      os = 'Windows 8.1'
    } else if (ua.includes('Windows NT 6.2')) {
      os = 'Windows 8'
    } else if (ua.includes('Windows NT 6.1')) {
      os = 'Windows 7'
    } else if (ua.includes('Windows')) {
      os = 'Windows'
    } else if (ua.includes('Mac OS X')) {
      const match = ua.match(/Mac OS X ([0-9_]+)/)
      if (match) {
        os = `macOS ${match[1].replace(/_/g, '.')}`
      } else {
        os = 'macOS'
      }
    } else if (ua.includes('Linux')) {
      os = 'Linux'
    } else if (ua.includes('Android')) {
      const match = ua.match(/Android ([0-9.]+)/)
      if (match) {
        os = `Android ${match[1]}`
      } else {
        os = 'Android'
      }
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS'
    }

    return { browser, version, os }
  }

  // 生成浏览器指纹
  const generateFingerprint = (info: Partial<BrowserInfo>): string => {
    const data = [
      info.userAgent,
      info.language,
      info.timezone,
      info.screen?.width,
      info.screen?.height,
      info.screen?.colorDepth,
      info.platform,
      info.hardwareConcurrency,
      info.deviceMemory,
      info.cookieEnabled,
    ].join('|')

    // 简单的哈希函数
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  // 收集浏览器信息
  const collectBrowserInfo = () => {
    const nav = navigator as any
    const screen = window.screen
    const userAgent = nav.userAgent
    const { browser, version, os } = parseUserAgent(userAgent)

    const info: BrowserInfo = {
      userAgent,
      browser,
      version,
      os,
      platform: nav.platform,
      language: nav.language,
      languages: nav.languages || [],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      cookieEnabled: nav.cookieEnabled,
      onlineStatus: nav.onLine,
      javaEnabled: typeof nav.javaEnabled === 'function' ? nav.javaEnabled() : false,
      doNotTrack: nav.doNotTrack,
      hardwareConcurrency: nav.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory,
      connection: nav.connection,
      fingerprint: ''
    }

    info.fingerprint = generateFingerprint(info)
    setBrowserInfo(info)
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleRefresh = () => {
    collectBrowserInfo()
  }

  useEffect(() => {
    collectBrowserInfo()

    // 监听窗口大小变化
    const handleResize = () => {
      if (browserInfo) {
        setBrowserInfo(prev => prev ? {
          ...prev,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          }
        } : null)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!browserInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
        <div className="text-center">
          <Monitor className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p>正在检测浏览器信息...</p>
        </div>
      </div>
    )
  }

  const infoSections = [
    {
      title: '基本信息',
      icon: Globe,
      items: [
        { label: '浏览器', value: `${browserInfo.browser} ${browserInfo.version}` },
        { label: '操作系统', value: browserInfo.os },
        { label: '平台', value: browserInfo.platform },
        { label: '语言', value: browserInfo.language },
        { label: '时区', value: browserInfo.timezone },
      ]
    },
    {
      title: '屏幕信息',
      icon: Monitor,
      items: [
        { label: '屏幕分辨率', value: `${browserInfo.screen.width} × ${browserInfo.screen.height}` },
        { label: '可用分辨率', value: `${browserInfo.screen.availWidth} × ${browserInfo.screen.availHeight}` },
        { label: '视口大小', value: `${browserInfo.viewport.width} × ${browserInfo.viewport.height}` },
        { label: '颜色深度', value: `${browserInfo.screen.colorDepth} 位` },
        { label: '像素深度', value: `${browserInfo.screen.pixelDepth} 位` },
      ]
    },
    {
      title: '系统信息',
      icon: Shield,
      items: [
        { label: 'CPU 核心数', value: browserInfo.hardwareConcurrency.toString() },
        { label: '设备内存', value: browserInfo.deviceMemory ? `${browserInfo.deviceMemory} GB` : '未知' },
        { label: 'Cookie 启用', value: browserInfo.cookieEnabled ? '是' : '否' },
        { label: '在线状态', value: browserInfo.onlineStatus ? '在线' : '离线' },
        { label: 'Java 启用', value: browserInfo.javaEnabled ? '是' : '否' },
        { label: 'Do Not Track', value: browserInfo.doNotTrack || '未设置' },
      ]
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">浏览器信息检测</h1>
          <p className="text-muted-foreground mb-6">
            检测您的浏览器详细信息和生成浏览器指纹，所有检测都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地检测</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">实时更新</Badge>
            <Badge variant="outline">指纹: {browserInfo.fingerprint}</Badge>
          </div>
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <Button onClick={handleRefresh} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            刷新信息
          </Button>
        </motion.div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {infoSections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <section.icon className="w-5 h-5" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label}:</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* User Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Agent</CardTitle>
                <Button
                  onClick={() => handleCopy(browserInfo.userAgent)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied === browserInfo.userAgent ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                {browserInfo.userAgent}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Languages */}
        {browserInfo.languages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>支持的语言</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {browserInfo.languages.map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Network Info */}
        {browserInfo.connection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>网络信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {browserInfo.connection.effectiveType && (
                    <div>
                      <span className="text-muted-foreground">连接类型:</span>
                      <div className="font-medium">{browserInfo.connection.effectiveType}</div>
                    </div>
                  )}
                  {browserInfo.connection.downlink && (
                    <div>
                      <span className="text-muted-foreground">下行速度:</span>
                      <div className="font-medium">{browserInfo.connection.downlink} Mbps</div>
                    </div>
                  )}
                  {browserInfo.connection.rtt && (
                    <div>
                      <span className="text-muted-foreground">延迟:</span>
                      <div className="font-medium">{browserInfo.connection.rtt} ms</div>
                    </div>
                  )}
                  {browserInfo.connection.saveData !== undefined && (
                    <div>
                      <span className="text-muted-foreground">省流模式:</span>
                      <div className="font-medium">{browserInfo.connection.saveData ? '开启' : '关闭'}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>隐私说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• 所有信息检测都在您的浏览器本地进行</p>
                  <p>• 不会向任何服务器发送您的浏览器信息</p>
                  <p>• 浏览器指纹仅用于演示目的</p>
                </div>
                <div className="space-y-2">
                  <p>• 您可以随时刷新页面重新检测</p>
                  <p>• 信息仅在当前会话中保存</p>
                  <p>• 完全保护您的隐私安全</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
