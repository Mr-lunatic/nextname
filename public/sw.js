// Service Worker for NextName - 离线缓存和性能优化
const CACHE_NAME = 'nextname-v1.0.0'
const STATIC_CACHE = 'nextname-static-v1.0.0'
const DYNAMIC_CACHE = 'nextname-dynamic-v1.0.0'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/search',
  '/tools',
  '/tlds',
  '/offline', // 离线页面
  // 关键CSS和JS会由Next.js自动处理
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png'
]

// 需要优先缓存的API路由
const API_ROUTES = [
  '/api/tlds',
  '/api/search',
]

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源 - Cache First
  static: {
    cacheName: STATIC_CACHE,
    strategy: 'cache-first',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30天
  },
  // API数据 - Network First with fallback
  api: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'network-first',
    maxAge: 5 * 60 * 1000, // 5分钟
  },
  // 页面 - Stale While Revalidate
  pages: {
    cacheName: DYNAMIC_CACHE,
    strategy: 'stale-while-revalidate',
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  }
}

// Service Worker安装
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      // 预缓存关键API数据
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('🔄 Pre-caching API data')
        return Promise.all(
          API_ROUTES.map(route => 
            fetch(route).then(response => {
              if (response.ok) {
                return cache.put(route, response.clone())
              }
            }).catch(() => {
              // 忽略预缓存失败
              console.log(`⚠️ Failed to pre-cache ${route}`)
            })
          )
        )
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully')
      // 立即激活新的Service Worker
      self.skipWaiting()
    })
  )
})

// Service Worker激活
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully')
    })
  )
})

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return
  }
  
  // 根据请求类型选择缓存策略
  if (request.url.includes('/api/')) {
    // API请求 - Network First
    event.respondWith(networkFirst(request))
  } else if (request.destination === 'document') {
    // HTML页面 - Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request))
  } else if (request.destination === 'image' || request.destination === 'font' || request.destination === 'script' || request.destination === 'style') {
    // 静态资源 - Cache First
    event.respondWith(cacheFirst(request))
  } else {
    // 其他请求 - Network First
    event.respondWith(networkFirst(request))
  }
})

// 缓存策略实现

// Cache First - 优先从缓存获取
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache First strategy failed:', error)
    return new Response('Network error', { status: 408 })
  }
}

// Network First - 优先从网络获取
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      // 检查缓存大小，避免无限增长
      await limitCacheSize(DYNAMIC_CACHE, 100)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', error)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // 如果是页面请求且缓存中没有，返回离线页面
    if (request.destination === 'document') {
      return caches.match('/offline')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Stale While Revalidate - 返回缓存，同时后台更新
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE)
  const cachedResponse = await cache.match(request)
  
  // 后台更新缓存
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // 网络失败时忽略
  })
  
  // 如果有缓存，立即返回；否则等待网络请求
  return cachedResponse || networkResponsePromise || caches.match('/offline')
}

// 限制缓存大小
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  
  if (keys.length > maxItems) {
    // 删除最旧的缓存项
    const itemsToDelete = keys.length - maxItems
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(keys[i])
    }
  }
}

// 监听消息事件（用于手动缓存管理）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting()
        break
      case 'CACHE_UPDATE':
        // 手动更新特定缓存
        if (event.data.url) {
          updateCache(event.data.url)
        }
        break
      case 'CLEAR_CACHE':
        // 清理所有缓存
        clearAllCaches()
        break
    }
  }
})

// 手动更新缓存
async function updateCache(url) {
  try {
    const response = await fetch(url)
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      await cache.put(url, response)
      console.log('✅ Cache updated for:', url)
    }
  } catch (error) {
    console.error('Failed to update cache for:', url, error)
  }
}

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  console.log('🗑️ All caches cleared')
}