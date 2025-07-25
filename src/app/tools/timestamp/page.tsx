import { Metadata } from 'next'
import TimestampToolClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '时间戳转换器 - 在线时间戳与日期互转工具 | NextName',
  description: '免费的在线时间戳转换工具，支持Unix时间戳与日期时间互转，多种格式支持，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '时间戳,Unix时间戳,日期转换,时间转换,在线工具,时间格式,隐私保护',
  openGraph: {
    title: '时间戳转换器 - 在线时间戳与日期互转工具',
    description: '免费的在线时间戳转换工具，支持Unix时间戳与日期时间互转，多种格式支持，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/timestamp',
  },
  twitter: {
    card: 'summary_large_image',
    title: '时间戳转换器 - 在线时间戳与日期互转工具',
    description: '免费的在线时间戳转换工具，支持Unix时间戳与日期时间互转，多种格式支持，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/timestamp',
  },
}

export default function TimestampPage() {
  return <TimestampToolClient />
}
