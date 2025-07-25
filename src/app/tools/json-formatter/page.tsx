import { Metadata } from 'next'
import JsonFormatterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'JSON 格式化工具 - 在线JSON美化验证器 | NextName',
  description: '免费的在线JSON格式化和验证工具，支持JSON美化、压缩、验证，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'JSON,格式化,美化,验证,压缩,在线工具,JSON validator,隐私保护',
  openGraph: {
    title: 'JSON 格式化工具 - 在线JSON美化验证器',
    description: '免费的在线JSON格式化和验证工具，支持JSON美化、压缩、验证，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/json-formatter',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON 格式化工具 - 在线JSON美化验证器',
    description: '免费的在线JSON格式化和验证工具，支持JSON美化、压缩、验证，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/json-formatter',
  },
}

export default function JsonFormatterPage() {
  return <JsonFormatterClient />
}
