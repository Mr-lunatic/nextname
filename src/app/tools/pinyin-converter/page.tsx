import { Metadata } from 'next'
import PinyinConverterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '汉字拼音转换器 - 在线中文拼音转换工具 | NextName',
  description: '免费的在线汉字拼音转换工具，支持汉字转拼音、拼音标注、声调显示，支持多种拼音格式，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '汉字转拼音,拼音转换,中文拼音,声调标注,在线工具,拼音查询,隐私保护',
  openGraph: {
    title: '汉字拼音转换器 - 在线中文拼音转换工具',
    description: '免费的在线汉字拼音转换工具，支持汉字转拼音、拼音标注、声调显示，支持多种拼音格式，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/pinyin-converter',
  },
  twitter: {
    card: 'summary_large_image',
    title: '汉字拼音转换器 - 在线中文拼音转换工具',
    description: '免费的在线汉字拼音转换工具，支持汉字转拼音、拼音标注、声调显示，支持多种拼音格式，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/pinyin-converter',
  },
}

export default function PinyinConverterPage() {
  return <PinyinConverterClient />
}
