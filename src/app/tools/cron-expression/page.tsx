import { Metadata } from 'next'
import CronExpressionClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Cron 表达式工具 - 在线Cron表达式生成器和解析器 | NextName',
  description: '免费的在线Cron表达式工具，支持Cron表达式生成、解析、验证和执行时间预览，可视化界面轻松创建定时任务，本地处理保护隐私，无需上传数据到服务器。',
  keywords: 'Cron表达式,定时任务,Cron生成器,Cron解析,在线工具,任务调度,隐私保护',
  openGraph: {
    title: 'Cron 表达式工具 - 在线Cron表达式生成器和解析器',
    description: '免费的在线Cron表达式工具，支持Cron表达式生成、解析、验证和执行时间预览，可视化界面轻松创建定时任务，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/cron-expression',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cron 表达式工具 - 在线Cron表达式生成器和解析器',
    description: '免费的在线Cron表达式工具，支持Cron表达式生成、解析、验证和执行时间预览，可视化界面轻松创建定时任务，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/cron-expression',
  },
}

export default function CronExpressionPage() {
  return <CronExpressionClient />
}
