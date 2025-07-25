import { Metadata } from 'next'
import ImageConverterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '图片转换器 - 在线图片格式转换工具 | NextName',
  description: '免费的在线图片格式转换工具，支持JPG、PNG、WebP、GIF等多种格式互转，调整图片质量和尺寸，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '图片转换,图片格式转换,JPG转PNG,PNG转WebP,图片压缩,在线工具,隐私保护',
  openGraph: {
    title: '图片转换器 - 在线图片格式转换工具',
    description: '免费的在线图片格式转换工具，支持JPG、PNG、WebP、GIF等多种格式互转，调整图片质量和尺寸，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/image-converter',
  },
  twitter: {
    card: 'summary_large_image',
    title: '图片转换器 - 在线图片格式转换工具',
    description: '免费的在线图片格式转换工具，支持JPG、PNG、WebP、GIF等多种格式互转，调整图片质量和尺寸，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/image-converter',
  },
}

export default function ImageConverterPage() {
  return <ImageConverterClient />
}
