import { Metadata } from 'next'
import { Suspense } from 'react'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

interface DomainPageProps {
  params: { domain: string }
}

// Generate metadata for domain pages
export async function generateMetadata({ params }: DomainPageProps): Promise<Metadata> {
  const domain = decodeURIComponent(params.domain)

  // Basic domain validation
  const isValidDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(domain)

  if (!isValidDomain) {
    return {
      title: '无效域名',
      description: '请输入有效的域名格式'
    }
  }

  const title = `${domain} WHOIS Lookup - Domain Registration Details | NextName`
  const description = `Complete WHOIS information for ${domain}: registration date, expiry, registrar, DNS records, and availability status. Free domain lookup with comprehensive details.`

  return {
    title,
    description,
    keywords: [
      `${domain} whois`, `${domain} domain info`, `${domain} registration details`,
      `${domain} availability`, `${domain} expiration date`, `${domain} dns records`,
      `${domain} registrar info`, `who owns ${domain}`, `${domain} domain lookup`,
      `${domain} whois data`, `${domain} domain status`, `${domain} registration info`
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://nextname.app/domain/${domain}`,
      images: [
        {
          url: '/og-domain.png',
          width: 1200,
          height: 630,
          alt: `${domain} WHOIS Lookup Results`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/domain/${domain}`,
    },
  }
}
import DomainPageClient from './client'
import { DomainStructuredData } from '@/components/domain-structured-data'

export default function DomainPage({ params }: DomainPageProps) {
  const domain = decodeURIComponent(params.domain)

  return (
    <>
      <DomainStructuredData domain={domain} />
      <DomainPageClient domain={domain} pageType="domain" />
    </>
  )
}

