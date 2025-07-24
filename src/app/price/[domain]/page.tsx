import { Metadata } from 'next'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

interface PricePageProps {
  params: { domain: string }
}

// Generate metadata for price pages
export async function generateMetadata({ params }: PricePageProps): Promise<Metadata> {
  const domain = decodeURIComponent(params.domain)
  
  // Basic domain validation
  const isValidDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)
  
  if (!isValidDomain) {
    return {
      title: '无效域名',
      description: '请输入有效的域名格式'
    }
  }

  const title = `${domain} 域名价格对比 - 50+注册商价格查询 | NextName`
  const description = `对比 ${domain} 在50+注册商的价格：注册价格、续费价格、转移价格。找到最优惠的域名注册商，节省域名成本。`
  
  return {
    title,
    description,
    keywords: `${domain},域名价格,域名注册价格,域名续费价格,注册商对比,${domain}最低价`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://nextname.app/price/${domain}`,
      images: [
        {
          url: '/og-price.png',
          width: 1200,
          height: 630,
          alt: `${domain} 域名价格对比`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/price/${domain}`,
    },
  }
}

import DomainPageClient from '../../domain/[domain]/client'
import { DomainStructuredData } from '@/components/domain-structured-data'

export default function PricePage({ params }: PricePageProps) {
  const domain = decodeURIComponent(params.domain)

  return (
    <>
      <DomainStructuredData domain={domain} />
      <DomainPageClient domain={domain} pageType="price" />
    </>
  )
}
