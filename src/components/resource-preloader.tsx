'use client'

import Head from 'next/head'
import { useEffect } from 'react'

interface ResourcePreloadProps {
  fonts?: string[]
  images?: string[]
  scripts?: string[]
  stylesheets?: string[]
}

export function ResourcePreloader({
  fonts = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap'
  ],
  images = [
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/apple-touch-icon.png'
  ],
  scripts = [],
  stylesheets = []
}: ResourcePreloadProps) {
  
  useEffect(() => {
    // 动态预加载关键资源
    const preloadResource = (href: string, as: string, type?: string) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (type) link.type = type
      
      // 添加错误处理
      link.onerror = () => {
        console.warn(`Failed to preload ${as}: ${href}`)
      }
      
      document.head.appendChild(link)
    }

    // 预加载字体
    fonts.forEach(font => {
      preloadResource(font, 'style')
    })

    // 预加载图片
    images.forEach(image => {
      preloadResource(image, 'image')
    })

    // 预加载脚本
    scripts.forEach(script => {
      preloadResource(script, 'script')
    })

    // 预加载样式表
    stylesheets.forEach(stylesheet => {
      preloadResource(stylesheet, 'style')
    })

    // 预连接到外部域名
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.googletagmanager.com'
    ]

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = domain
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })

    // DNS预解析
    const dnsPrefetchDomains = [
      'https://www.google-analytics.com'
    ]

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link')
      link.rel = 'dns-prefetch'
      link.href = domain
      document.head.appendChild(link)
    })

  }, [fonts, images, scripts, stylesheets])

  return (
    <Head>
      {/* 关键字体预加载 */}
      {fonts.map((font, index) => (
        <link
          key={index}
          rel="preload"
          href={font}
          as="style"
          crossOrigin="anonymous"
        />
      ))}
      
      {/* 关键图片预加载 */}
      {images.map((image, index) => (
        <link
          key={index}
          rel="preload"
          href={image}
          as="image"
        />
      ))}
      
      {/* 外部域名预连接 */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      
      {/* DNS预解析 */}
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      
      {/* Prefetch 下一页可能需要的资源 */}
      <link rel="prefetch" href="/search" />
      <link rel="prefetch" href="/tools" />
      <link rel="prefetch" href="/api/tlds" />
    </Head>
  )
}

// 智能预加载钩子
export function useSmartPreload() {
  useEffect(() => {
    let preloadTimer: NodeJS.Timeout

    const handleUserInteraction = () => {
      // 用户交互后延迟预加载
      preloadTimer = setTimeout(() => {
        preloadSecondaryResources()
      }, 1000)
    }

    const preloadSecondaryResources = () => {
      // 预加载次要资源
      const secondaryImages = [
        '/og-image.png',
        '/logo/280X72.svg'
      ]

      secondaryImages.forEach(src => {
        const img = new Image()
        img.src = src
      })

      // 预加载关键API数据
      if (navigator.onLine) {
        fetch('/api/tlds').catch(() => {
          // 忽略预加载失败
        })
      }
    }

    // 监听用户交互
    const events = ['mousedown', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true, passive: true })
    })

    return () => {
      clearTimeout(preloadTimer)
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [])
}

// 页面可见性API优化
export function useVisibilityOptimization() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面可见时恢复预加载
        console.log('Page visible - resuming preload')
      } else {
        // 页面隐藏时暂停不必要的网络请求
        console.log('Page hidden - pausing non-critical requests')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}