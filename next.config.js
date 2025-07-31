// 开发环境和生产环境使用不同的配置
const isDev = process.env.NODE_ENV === 'development'

// 生产环境才使用 Cloudflare 配置
if (!isDev) {
  try {
    const { setupDevPlatform } = require('@cloudflare/next-on-pages/next-dev')
    setupDevPlatform()
  } catch (e) {
    console.warn('Cloudflare setup not available:', e.message)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 基础配置
  trailingSlash: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Webpack 配置
  webpack: (config, { dev, isServer }) => {
    // 开发环境简化配置，移除 Cloudflare 相关依赖
    if (dev) {
      // 禁用缓存以避免 undici 相关错误
      config.cache = false
      
      // 简化模块解析
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          crypto: false,
        }
      }
      
      return config
    }

    // 生产环境保持原有配置
    if (!dev) {
      config.cache = false
    }

    // Bundle分析
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      )
    }

    // 优化chunk分割
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          ui: {
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 5
          },
          tools: {
            test: /[\\/]src[\\/]app[\\/]tools[\\/]/,
            name: 'tools',
            chunks: 'all',
            priority: 3
          }
        }
      }
    }

    return config
  },
  
  // 图片优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days for better caching
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.nextname.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/npm/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false
  },
  
  // CDN配置
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL || '' : '',
  
  // 静态资源优化
  compress: true,
  
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