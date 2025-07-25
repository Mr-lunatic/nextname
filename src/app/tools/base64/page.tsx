import { Metadata } from 'next'
import Base64ToolClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Base64 转换器 - 在线Base64编码解码工具 | NextName',
  description: '免费的在线Base64编码解码工具，支持文本与Base64格式互转，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'Base64,编码,解码,转换器,在线工具,文本转换,隐私保护',
  openGraph: {
    title: 'Base64 转换器 - 在线Base64编码解码工具',
    description: '免费的在线Base64编码解码工具，支持文本与Base64格式互转，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/base64',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 转换器 - 在线Base64编码解码工具',
    description: '免费的在线Base64编码解码工具，支持文本与Base64格式互转，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/base64',
  },
}

export default function Base64Page() {
  return <Base64ToolClient />
}
