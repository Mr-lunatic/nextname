import { MetadataRoute } from 'next'
import { tldManager } from '@/lib/tld-manager'

export const runtime = 'edge'

const siteUrl = 'https://nextname.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 基础静态页面
  const staticRoutes = [
    '/',
    '/search',
    '/tlds',
    '/about',
    '/privacy',
    '/terms',
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : route === '/search' ? 'daily' : route === '/tlds' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/search' ? 0.9 : route === '/tlds' ? 0.8 : 0.6,
  }));

  try {
    // 获取所有TLD并生成页面
    const allTLDs = await tldManager.getAllTLDs()

    const tldPages: MetadataRoute.Sitemap = allTLDs.map((tld) => ({
      url: `${siteUrl}/tld${tld.tld}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // 添加示例域名页面（用于SEO）
    const exampleDomains = ['example.com', 'test.com', 'demo.org', 'sample.net']
    const domainPages: MetadataRoute.Sitemap = exampleDomains.flatMap((domain) => [
      {
        url: `${siteUrl}/domain/${domain}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.6,
      },
      {
        url: `${siteUrl}/whois/${domain}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.5,
      },
      {
        url: `${siteUrl}/price/${domain}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.5,
      }
    ])

    return [...staticPages, ...tldPages, ...domainPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // 如果TLD数据加载失败，至少返回静态页面
    return staticPages
  }
}
