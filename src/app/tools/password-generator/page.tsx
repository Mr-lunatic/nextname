import { Metadata } from 'next'
import PasswordGeneratorClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '密码生成器 - 安全随机密码生成工具 | NextName',
  description: '免费的在线安全密码生成器，支持自定义长度和字符集，生成强密码保护您的账户安全，本地处理保护隐私。',
  keywords: '密码生成器,随机密码,强密码,安全密码,在线工具,密码安全,隐私保护',
  openGraph: {
    title: '密码生成器 - 安全随机密码生成工具',
    description: '免费的在线安全密码生成器，支持自定义长度和字符集，生成强密码保护您的账户安全。',
    type: 'website',
    url: 'https://nextname.app/tools/password-generator',
  },
  twitter: {
    card: 'summary_large_image',
    title: '密码生成器 - 安全随机密码生成工具',
    description: '免费的在线安全密码生成器，支持自定义长度和字符集，生成强密码保护您的账户安全。',
  },
  alternates: {
    canonical: '/tools/password-generator',
  },
}

export default function PasswordGeneratorPage() {
  return <PasswordGeneratorClient />
}
