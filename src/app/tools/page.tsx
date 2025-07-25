import { Metadata } from 'next'
import ToolsPageClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '开发者工具箱 - 在线工具集合 | NextName',
  description: '集成多种实用开发者工具，包括Base64转换、图片处理、二维码生成、密码生成器、JSON格式化等，所有功能均在本地浏览器运行，保护您的隐私。',
  keywords: '开发者工具,在线工具,Base64转换,图片转换,二维码,密码生成器,JSON格式化,JWT解析,哈希生成,正则表达式',
  openGraph: {
    title: '开发者工具箱 - 在线工具集合',
    description: '集成多种实用开发者工具，保护您的隐私安全，所有功能均在本地浏览器运行。',
    type: 'website',
    url: 'https://nextname.app/tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: '开发者工具箱 - 在线工具集合',
    description: '集成多种实用开发者工具，保护您的隐私安全，所有功能均在本地浏览器运行。',
  },
  alternates: {
    canonical: '/tools',
  },
}

export default function ToolsPage() {
  return <ToolsPageClient />
}
