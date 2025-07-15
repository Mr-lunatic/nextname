/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除可能导致问题的实验性功能
  trailingSlash: true,
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7 // 7 days
  },
  
  // 移除 optimizeCss 实验性功能以避免 critters 依赖问题
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  
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
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },
  
  // Webpack 优化 - 简化配置
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 基础生产环境优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
    return config
  }
}

module.exports = nextConfig