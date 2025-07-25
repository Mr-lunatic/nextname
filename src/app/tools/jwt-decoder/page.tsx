import { Metadata } from 'next'
import JWTDecoderClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'JWT 解析器 - 在线JWT令牌解码验证工具 | NextName',
  description: '免费的在线JWT解析器，支持JWT令牌解码、验证、格式化，查看Header、Payload和签名信息，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'JWT,JSON Web Token,JWT解析,JWT解码,JWT验证,在线工具,令牌解析,隐私保护',
  openGraph: {
    title: 'JWT 解析器 - 在线JWT令牌解码验证工具',
    description: '免费的在线JWT解析器，支持JWT令牌解码、验证、格式化，查看Header、Payload和签名信息，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/jwt-decoder',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JWT 解析器 - 在线JWT令牌解码验证工具',
    description: '免费的在线JWT解析器，支持JWT令牌解码、验证、格式化，查看Header、Payload和签名信息，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/jwt-decoder',
  },
}

export default function JWTDecoderPage() {
  return <JWTDecoderClient />
}
