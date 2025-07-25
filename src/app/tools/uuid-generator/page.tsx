import { Metadata } from 'next'
import UUIDGeneratorClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'UUID 生成器 - 在线UUID标识符生成工具 | NextName',
  description: '免费的在线UUID生成器，支持UUID v1、v4等多种版本，批量生成，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'UUID,GUID,标识符,生成器,在线工具,UUID v4,隐私保护',
  openGraph: {
    title: 'UUID 生成器 - 在线UUID标识符生成工具',
    description: '免费的在线UUID生成器，支持UUID v1、v4等多种版本，批量生成，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/uuid-generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UUID 生成器 - 在线UUID标识符生成工具',
    description: '免费的在线UUID生成器，支持UUID v1、v4等多种版本，批量生成，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/uuid-generator',
  },
}

export default function UUIDGeneratorPage() {
  return <UUIDGeneratorClient />
}
