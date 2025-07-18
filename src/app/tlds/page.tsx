import { Metadata } from 'next'
import TLDsPageClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '顶级域名大全 - 所有TLD后缀完整列表与价格对比 | Next Name',
  description: '查看所有可注册的顶级域名(TLD)，包括.com、.net、.org等通用域名和各国家域名，实时价格对比和注册建议。',
  keywords: '顶级域名,TLD,域名后缀,域名价格,域名注册,com域名,net域名,org域名',
  openGraph: {
    title: '顶级域名大全 - 所有TLD后缀完整列表',
    description: '查看所有可注册的顶级域名(TLD)，包括.com、.net、.org等通用域名和各国家域名，实时价格对比和注册建议。',
    type: 'website',
    url: 'https://nextname.app/tlds',
  },
  twitter: {
    card: 'summary_large_image',
    title: '顶级域名大全 - 所有TLD后缀完整列表',
    description: '查看所有可注册的顶级域名(TLD)，包括.com、.net、.org等通用域名和各国家域名，实时价格对比和注册建议。',
  },
  alternates: {
    canonical: '/tlds',
  },
}

export default function TLDsPage() {
  return <TLDsPageClient />
}
