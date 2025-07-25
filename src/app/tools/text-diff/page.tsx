import { Metadata } from 'next'
import TextDiffClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '文本差异比较 - 在线文本对比工具 | NextName',
  description: '免费的在线文本差异比较工具，支持逐行对比、高亮显示差异、并排显示，快速找出两段文本的不同之处，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '文本比较,文本差异,文本对比,diff,在线工具,文本分析,隐私保护',
  openGraph: {
    title: '文本差异比较 - 在线文本对比工具',
    description: '免费的在线文本差异比较工具，支持逐行对比、高亮显示差异、并排显示，快速找出两段文本的不同之处，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/text-diff',
  },
  twitter: {
    card: 'summary_large_image',
    title: '文本差异比较 - 在线文本对比工具',
    description: '免费的在线文本差异比较工具，支持逐行对比、高亮显示差异、并排显示，快速找出两段文本的不同之处，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/text-diff',
  },
}

export default function TextDiffPage() {
  return <TextDiffClient />
}
