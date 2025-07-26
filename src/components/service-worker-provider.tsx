'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerStatus {
  installed: boolean
  updated: boolean
  offline: boolean
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [swStatus, setSwStatus] = useState<ServiceWorkerStatus>({
    installed: false,
    updated: false,
    offline: false
  })

  useEffect(() => {
    // 检查浏览器支持
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    // 注册Service Worker
    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // 强制检查更新
      })
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration.scope)
        setSwStatus(prev => ({ ...prev, installed: true }))

        // 监听Service Worker更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New Service Worker available')
                setSwStatus(prev => ({ ...prev, updated: true }))
                
                // 可以显示更新提示
                showUpdateNotification()
              }
            })
          }
        })

        // 定期检查更新（每小时）
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error)
      })

    // 监听Service Worker消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type) {
        switch (event.data.type) {
          case 'CACHE_UPDATED':
            console.log('📦 Cache updated')
            break
          case 'OFFLINE_READY':
            console.log('📴 App ready for offline use')
            break
        }
      }
    })

    // 监听在线/离线状态
    const handleOnline = () => {
      console.log('🌐 Back online')
      setSwStatus(prev => ({ ...prev, offline: false }))
    }

    const handleOffline = () => {
      console.log('📴 Gone offline')
      setSwStatus(prev => ({ ...prev, offline: true }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始状态检查
    setSwStatus(prev => ({ ...prev, offline: !navigator.onLine }))

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 显示更新通知
  const showUpdateNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NextName 更新可用', {
        body: '刷新页面以获取最新功能',
        icon: '/android-chrome-192x192.png',
        tag: 'app-update'
      })
    }
  }

  // 手动更新Service Worker
  const updateServiceWorker = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  // 清理缓存
  const clearCache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' })
    }
  }

  return (
    <>
      {children}
      
      {/* 更新提示 */}
      {swStatus.updated && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">新版本可用</p>
              <p className="text-sm opacity-90">刷新以获取最新功能</p>
            </div>
            <button
              onClick={updateServiceWorker}
              className="ml-4 bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
            >
              更新
            </button>
          </div>
        </div>
      )}

      {/* 离线提示 */}
      {swStatus.offline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center text-sm z-50">
          📴 您当前处于离线状态，部分功能可能无法使用
        </div>
      )}

      {/* 开发模式调试 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded text-xs z-50">
          <div>SW: {swStatus.installed ? '✅' : '❌'}</div>
          <div>Online: {swStatus.offline ? '❌' : '✅'}</div>
          <button onClick={clearCache} className="text-blue-300 underline">
            Clear Cache
          </button>
        </div>
      )}
    </>
  )
}