import { Metadata } from 'next'
import TextReplaceClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '文本搜索替换 - 在线文本查找替换工具 | NextName',
  description: '免费的在线文本搜索替换工具，支持普通文本和正则表达式查找替换，批量处理，实时预览，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '文本替换,文本搜索,查找替换,正则替换,批量替换,在线工具,隐私保护',
  openGraph: {
    title: '文本搜索替换 - 在线文本查找替换工具',
    description: '免费的在线文本搜索替换工具，支持普通文本和正则表达式查找替换，批量处理，实时预览，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/text-replace',
  },
  twitter: {
    card: 'summary_large_image',
    title: '文本搜索替换 - 在线文本查找替换工具',
    description: '免费的在线文本搜索替换工具，支持普通文本和正则表达式查找替换，批量处理，实时预览，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/text-replace',
  },
}

export default function TextReplacePage() {
  return <TextReplaceClient />
}
