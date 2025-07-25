import { Metadata } from 'next'
import QRCodeToolClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '二维码工具 - 在线二维码生成器和解析器 | NextName',
  description: '免费的在线二维码生成和解析工具，支持文本、URL、WiFi密码等多种格式，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '二维码,QR码,二维码生成器,二维码解析,在线工具,QR Code,隐私保护',
  openGraph: {
    title: '二维码工具 - 在线二维码生成器和解析器',
    description: '免费的在线二维码生成和解析工具，支持文本、URL、WiFi密码等多种格式，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/qr-code',
  },
  twitter: {
    card: 'summary_large_image',
    title: '二维码工具 - 在线二维码生成器和解析器',
    description: '免费的在线二维码生成和解析工具，支持文本、URL、WiFi密码等多种格式，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/qr-code',
  },
}

export default function QRCodePage() {
  return <QRCodeToolClient />
}
