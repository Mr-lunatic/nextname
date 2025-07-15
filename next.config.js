/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 兼容配置
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  
  // 图片优化 - Cloudflare 兼容
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7 // 7 days
  },
  
  // 性能优化
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  
  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  },
  
  // 环境变量（移除 NODE_ENV）
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    RDAP_CACHE_TTL: process.env.RDAP_CACHE_TTL || '3600',
    RDAP_TIMEOUT: process.env.RDAP_TIMEOUT || '2500',
  },
  
  // 缓存头设置（仅在开发环境）
  ...process.env.NODE_ENV !== 'production' && {
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
    }
  },
  
  // Webpack 优化
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // 生产环境优化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true
          }
        }
      }
    }
    return config
  }
}

module.exports = nextConfig