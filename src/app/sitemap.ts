import { MetadataRoute } from 'next'
import { tldManager } from '@/lib/tld-manager'

export const runtime = 'edge'

const siteUrl = 'https://nextname.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 基础静态页面 - 按优先级排序
  const staticRoutes = [
    { path: '/', priority: 1, changeFreq: 'daily' as const },
    { path: '/search', priority: 0.9, changeFreq: 'daily' as const },
    { path: '/tlds', priority: 0.8, changeFreq: 'weekly' as const },
    { path: '/tools', priority: 0.8, changeFreq: 'weekly' as const },
    { path: '/about', priority: 0.6, changeFreq: 'monthly' as const },
    { path: '/privacy', priority: 0.5, changeFreq: 'monthly' as const },
    { path: '/terms', priority: 0.5, changeFreq: 'monthly' as const },
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
  }));

  // 工具页面 - 按使用频率分类
  const toolRoutes = [
    // 高频工具
    { path: '/tools/base64', priority: 0.7 },
    { path: '/tools/json-formatter', priority: 0.7 },
    { path: '/tools/url-encoder', priority: 0.7 },
    { path: '/tools/timestamp', priority: 0.7 },
    { path: '/tools/hash-generator', priority: 0.7 },
    { path: '/tools/password-generator', priority: 0.7 },
    { path: '/tools/qr-code', priority: 0.7 },
    
    // 中频工具
    { path: '/tools/uuid-generator', priority: 0.6 },
    { path: '/tools/jwt-decoder', priority: 0.6 },
    { path: '/tools/regex-tester', priority: 0.6 },
    { path: '/tools/color-converter', priority: 0.6 },
    { path: '/tools/text-diff', priority: 0.6 },
    { path: '/tools/image-converter', priority: 0.6 },
    
    // 低频工具
    { path: '/tools/text-replace', priority: 0.5 },
    { path: '/tools/cron-expression', priority: 0.5 },
    { path: '/tools/pinyin-converter', priority: 0.5 },
    { path: '/tools/browser-info', priority: 0.5 },
  ];

  const toolPages: MetadataRoute.Sitemap = toolRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route.priority,
  }));

  try {
    // 获取所有TLD并生成页面
    const allTLDs = await tldManager.getAllTLDs()

    const tldPages: MetadataRoute.Sitemap = allTLDs.slice(0, 500).map((tld) => ({
      url: `${siteUrl}/tld${tld.tld}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // 扩展示例域名 - 包含不同类别和TLD
    const domainCategories = [
      // 通用示例
      { domains: ['example.com', 'test.com', 'demo.org', 'sample.net'], priority: 0.6 },
      // 商业域名
      { domains: ['business.com', 'company.net', 'startup.io', 'service.co'], priority: 0.6 },
      // 技术域名
      { domains: ['tech.dev', 'code.io', 'api.com', 'app.co'], priority: 0.6 },
      // 创意域名
      { domains: ['creative.design', 'art.gallery', 'music.fm', 'photo.studio'], priority: 0.5 },
      // 地理域名
      { domains: ['global.world', 'local.city', 'travel.guide', 'hotel.place'], priority: 0.5 },
      // 新兴TLD
      { domains: ['blog.news', 'shop.store', 'learn.edu', 'health.care'], priority: 0.5 },
    ];

    const domainPages: MetadataRoute.Sitemap = domainCategories.flatMap((category) =>
      category.domains.flatMap((domain) => [
        {
          url: `${siteUrl}/domain/${domain}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: category.priority,
        },
        {
          url: `${siteUrl}/whois/${domain}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: category.priority - 0.1,
        },
        {
          url: `${siteUrl}/price/${domain}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: category.priority - 0.1,
        }
      ])
    )

    // 合并所有页面并按优先级排序
    const allPages = [...staticPages, ...toolPages, ...tldPages, ...domainPages]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))

    console.log(`Generated sitemap with ${allPages.length} URLs`)
    
    return allPages

  } catch (error) {
    console.error('Error generating sitemap:', error)
    // 如果TLD数据加载失败，至少返回静态页面和工具页面
    const fallbackPages = [...staticPages, ...toolPages]
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    
    console.log(`Generated fallback sitemap with ${fallbackPages.length} URLs`)
    return fallbackPages
  }
}
