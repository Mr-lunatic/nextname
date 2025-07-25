import { Metadata } from 'next'
import HashGeneratorClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '哈希生成器 - 在线MD5/SHA1/SHA256哈希工具 | NextName',
  description: '免费的在线哈希生成器，支持MD5、SHA1、SHA256、SHA512等多种哈希算法，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '哈希,MD5,SHA1,SHA256,SHA512,加密,摘要,在线工具,隐私保护',
  openGraph: {
    title: '哈希生成器 - 在线MD5/SHA1/SHA256哈希工具',
    description: '免费的在线哈希生成器，支持MD5、SHA1、SHA256、SHA512等多种哈希算法，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/hash-generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: '哈希生成器 - 在线MD5/SHA1/SHA256哈希工具',
    description: '免费的在线哈希生成器，支持MD5、SHA1、SHA256、SHA512等多种哈希算法，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/hash-generator',
  },
}

export default function HashGeneratorPage() {
  return <HashGeneratorClient />
}
