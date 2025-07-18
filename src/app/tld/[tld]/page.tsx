import { Metadata } from 'next'
import { tldManager } from '@/lib/tld-manager'
import TLDPageClient from './client'

interface TLDPageProps {
  params: {
    tld: string
  }
}

export async function generateMetadata({ params }: TLDPageProps): Promise<Metadata> {
  const tld = decodeURIComponent(params.tld)
  const tldDetails = await tldManager.getTLDDetails(tld)

  if (!tldDetails) {
    return {
      title: '域名未找到',
      description: '请求的域名信息不存在'
    }
  }

  const title = `${tld}域名 - 注册价格${tldDetails.averagePrice ? `${tldDetails.averagePrice}元起` : ''} | 政策详解与使用指南`
  const description = `了解${tld}域名的注册政策、价格趋势、使用限制和最佳实践。${tldDetails.description}`

  return {
    title,
    description,
    keywords: `${tld}域名,${tld}注册,${tld}价格,${tld}后缀,顶级域名`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://nextname.app/tld${tld}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/tld${tld}`,
    },
  }
}

export default function TLDPage({ params }: TLDPageProps) {
  return <TLDPageClient params={params} />
}

