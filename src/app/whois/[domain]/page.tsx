import { Metadata } from 'next'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

interface WhoisPageProps {
  params: { domain: string }
}

// Generate metadata for WHOIS pages
export async function generateMetadata({ params }: WhoisPageProps): Promise<Metadata> {
  const domain = decodeURIComponent(params.domain)
  
  // Basic domain validation
  const isValidDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)
  
  if (!isValidDomain) {
    return {
      title: '无效域名',
      description: '请输入有效的域名格式'
    }
  }

  const title = `${domain} WHOIS查询 - 域名注册信息查询 | NextName`
  const description = `查询 ${domain} 的WHOIS信息：注册商、注册时间、到期时间、DNS服务器、域名状态等详细注册信息。免费WHOIS查询工具。`
  
  return {
    title,
    description,
    keywords: `${domain},WHOIS查询,域名注册信息,域名到期时间,DNS查询,${domain}注册商`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://nextname.app/whois/${domain}`,
      images: [
        {
          url: '/og-whois.png',
          width: 1200,
          height: 630,
          alt: `${domain} WHOIS查询结果`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/whois/${domain}`,
    },
  }
}

import DomainPageClient from '../../domain/[domain]/client'
import { DomainStructuredData } from '@/components/domain-structured-data'

export default function WhoisPage({ params }: WhoisPageProps) {
  const domain = decodeURIComponent(params.domain)

  return (
    <>
      <DomainStructuredData domain={domain} />
      <DomainPageClient domain={domain} pageType="whois" />
    </>
  )
}
