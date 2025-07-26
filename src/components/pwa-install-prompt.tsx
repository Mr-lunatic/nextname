'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react'
import { useTranslations } from '@/hooks/useTranslations'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [platform, setPlatform] = useState<'desktop' | 'mobile' | 'unknown'>('unknown')

  useEffect(() => {
    // 检查是否已经安装
    const checkIfInstalled = () => {
      // 检查是否在PWA模式下运行
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppMode = (window.navigator as any).standalone === true
      
      if (isInStandaloneMode || isInWebAppMode) {
        setIsInstalled(true)
        return true
      }
      return false
    }

    // 检测平台
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      setPlatform(isMobile ? 'mobile' : 'desktop')
    }

    // 初始检查
    if (checkIfInstalled()) {
      return
    }

    detectPlatform()

    // 监听 beforeinstallprompt 事件
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired')
      
      // 阻止默认的安装横幅
      e.preventDefault()
      
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      setCanInstall(true)
      
      // 延迟显示提示，让用户先体验应用
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true)
        }
      }, 30000) // 30秒后显示
    }

    // 监听应用安装完成
    const handleAppInstalled = () => {
      console.log('PWA: App was installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
      
      // 发送安装事件到分析服务
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'pwa_install', {
          event_category: 'PWA',
          event_label: platform,
        })
      }
    }

    // 监听显示模式变化
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
        setShowPrompt(false)
      }
    }

    // 添加事件监听器
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    displayModeQuery.addListener(handleDisplayModeChange)

    // 清理
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      displayModeQuery.removeListener(handleDisplayModeChange)
    }
  }, [platform])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // 如果没有原生提示，显示手动安装指导
      setShowPrompt(false)
      showManualInstallGuide()
      return
    }

    try {
      // 显示安装提示
      await deferredPrompt.prompt()
      
      // 等待用户响应
      const choiceResult = await deferredPrompt.userChoice
      
      console.log('PWA: User choice:', choiceResult.outcome)
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt')
        
        // 发送接受事件到分析服务
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'pwa_install_accepted', {
            event_category: 'PWA',
            event_label: platform,
          })
        }
      } else {
        console.log('PWA: User dismissed the install prompt')
        
        // 记录用户拒绝，避免频繁提示
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }
      
      // 清理提示
      setDeferredPrompt(null)
      setShowPrompt(false)
      
    } catch (error) {
      console.error('PWA: Install prompt failed:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    
    // 记录用户关闭，24小时内不再显示
    const dismissedUntil = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString())
    
    // 发送关闭事件到分析服务
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        event_category: 'PWA',
        event_label: platform,
      })
    }
  }

  const showManualInstallGuide = () => {
    const isChrome = navigator.userAgent.includes('Chrome')
    const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
    const isFirefox = navigator.userAgent.includes('Firefox')
    
    let instructions = '请使用浏览器菜单中的"安装应用"或"添加到主屏幕"选项。'
    
    if (isChrome && platform === 'desktop') {
      instructions = '点击地址栏右侧的安装图标，或者使用浏览器菜单中的"安装 NextName"选项。'
    } else if (isChrome && platform === 'mobile') {
      instructions = '点击浏览器菜单（三个点），然后选择"安装应用"或"添加到主屏幕"。'
    } else if (isSafari && platform === 'mobile') {
      instructions = '点击分享按钮（方形箭头图标），然后选择"添加到主屏幕"。'
    } else if (isFirefox) {
      instructions = '点击地址栏右侧的安装图标，或使用页面菜单中的"安装"选项。'
    }
    
    alert(`安装 NextName 应用:\n\n${instructions}`)
  }

  // 如果已安装或不能安装，不显示提示
  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              {t('common.installApp')}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDismiss}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('pwa.installDescription')}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                {platform === 'mobile' ? <Smartphone className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
                <span>{t('pwa.offlineAccess')}</span>
              </div>
              <div className="flex items-center">
                <Chrome className="w-3 h-3 mr-1" />
                <span>{t('pwa.fasterLaunch')}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleInstallClick}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {canInstall ? t('pwa.installNow') : t('pwa.installGuide')}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismiss}
              >
                                {t('common.later')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// PWA状态监控钩子
export function usePWAStatus() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    // 检查安装状态
    const checkInstallStatus = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppMode = (window.navigator as any).standalone === true
      setIsInstalled(isInStandaloneMode || isInWebAppMode)
    }

    // 检查在线状态
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // 检查更新
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true)
                }
              })
            }
          })
        })
      }
    }

    checkInstallStatus()
    updateOnlineStatus()
    checkForUpdates()

    // 监听事件
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    displayModeQuery.addListener(checkInstallStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      displayModeQuery.removeListener(checkInstallStatus)
    }
  }, [])

  return {
    isInstalled,
    isOnline,
    isUpdateAvailable,
    refreshApp: () => window.location.reload()
  }
}