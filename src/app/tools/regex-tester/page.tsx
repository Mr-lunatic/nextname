import { Metadata } from 'next'
import RegexTesterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '正则表达式测试器 - 在线正则表达式验证工具 | NextName',
  description: '免费的在线正则表达式测试器，支持正则表达式验证、匹配测试、替换操作，实时高亮显示匹配结果，本地处理保护隐私，无需上传数据到服务器。',
  keywords: '正则表达式,regex,正则测试,正则验证,在线工具,模式匹配,隐私保护',
  openGraph: {
    title: '正则表达式测试器 - 在线正则表达式验证工具',
    description: '免费的在线正则表达式测试器，支持正则表达式验证、匹配测试、替换操作，实时高亮显示匹配结果，本地处理保护隐私。',
    type: 'website',
    url: 'https://nextname.app/tools/regex-tester',
  },
  twitter: {
    card: 'summary_large_image',
    title: '正则表达式测试器 - 在线正则表达式验证工具',
    description: '免费的在线正则表达式测试器，支持正则表达式验证、匹配测试、替换操作，实时高亮显示匹配结果，本地处理保护隐私。',
  },
  alternates: {
    canonical: '/tools/regex-tester',
  },
}

export default function RegexTesterPage() {
  return <RegexTesterClient />
}
