import { Metadata } from 'next'
import ColorConverterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '颜色转换器 - 在线颜色格式转换工具 | NextName',
  description: '免费的在线颜色转换工具，支持HEX、RGB、HSL、HSV等多种颜色格式互转，颜色预览，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '颜色转换,HEX,RGB,HSL,HSV,颜色格式,在线工具,颜色预览,隐私保护',
  openGraph: {
    title: '颜色转换器 - 在线颜色格式转换工具',
    description: '免费的在线颜色转换工具，支持HEX、RGB、HSL、HSV等多种颜色格式互转，颜色预览，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/color-converter',
  },
  twitter: {
    card: 'summary_large_image',
    title: '颜色转换器 - 在线颜色格式转换工具',
    description: '免费的在线颜色转换工具，支持HEX、RGB、HSL、HSV等多种颜色格式互转，颜色预览，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/color-converter',
  },
}

export default function ColorConverterPage() {
  return <ColorConverterClient />
}
