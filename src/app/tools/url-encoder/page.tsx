import { Metadata } from 'next'
import UrlEncoderClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'URL 编解码工具 - 在线URL编码解码器 | NextName',
  description: '免费的在线URL编码解码工具，支持URL编码、解码、组件编码等，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'URL编码,URL解码,编码器,解码器,在线工具,URL转换,隐私保护',
  openGraph: {
    title: 'URL 编解码工具 - 在线URL编码解码器',
    description: '免费的在线URL编码解码工具，支持URL编码、解码、组件编码等，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/url-encoder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL 编解码工具 - 在线URL编码解码器',
    description: '免费的在线URL编码解码工具，支持URL编码、解码、组件编码等，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/url-encoder',
  },
}

export default function UrlEncoderPage() {
  return <UrlEncoderClient />
}
