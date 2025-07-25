import { Metadata } from 'next'
import BrowserInfoClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '浏览器信息检测 - 在线浏览器指纹分析工具 | NextName',
  description: '免费的在线浏览器信息检测工具，显示浏览器版本、操作系统、屏幕分辨率、时区等详细信息，生成浏览器指纹，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '浏览器信息,浏览器指纹,User Agent,屏幕分辨率,操作系统,在线工具,隐私保护',
  openGraph: {
    title: '浏览器信息检测 - 在线浏览器指纹分析工具',
    description: '免费的在线浏览器信息检测工具，显示浏览器版本、操作系统、屏幕分辨率、时区等详细信息，生成浏览器指纹，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/browser-info',
  },
  twitter: {
    card: 'summary_large_image',
    title: '浏览器信息检测 - 在线浏览器指纹分析工具',
    description: '免费的在线浏览器信息检测工具，显示浏览器版本、操作系统、屏幕分辨率、时区等详细信息，生成浏览器指纹，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/browser-info',
  },
}

export default function BrowserInfoPage() {
  return <BrowserInfoClient />
}
