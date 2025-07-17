// const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')

// // Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// // (when running the application with `next dev`), for more information see:
// // https://github.com/cloudflare/next-on-pages/blob/main/packages/next-on-pages/docs/api.md#setupdevplatform
// if (process.env.NODE_ENV === 'development') {
//   setupDevPlatform()
// }

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基础配置，移除所有实验性功能
  trailingSlash: true,
  
  // 禁用webpack缓存以避免Cloudflare Pages文件大小限制
  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = false
    }
    return config
  },
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7 // 7 days
  },
  
  // 完全移除 experimental 字段
  
  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  },
  
  // 环境变量
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RDAP_CACHE_TTL: process.env.RDAP_CACHE_TTL || '3600',
    RDAP_TIMEOUT: process.env.RDAP_TIMEOUT || '2500',
  },
  
  // 缓存头设置
  async headers() {
    return [
      {
        source: '/api/tlds',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=43200'
          }
        ]
      },
      {
        source: '/api/domain/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig