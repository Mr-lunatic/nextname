"use client"

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Code, Image, Hash, FileText, Palette, Monitor,
  ArrowRight, Loader2
} from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

// 动态导入重量级组件，提升初始加载性能
const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded h-24" />
})

// 工具分类配置 - 按使用频率排序
const toolCategories = [
  {
    title: '编码转换',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    priority: 'high', // 高频使用
    tools: [
      { name: 'Base64 转换器', href: '/tools/base64', description: '文本与Base64编码互转', priority: 'high' },
      { name: 'URL 编解码', href: '/tools/url-encoder', description: 'URL编码与解码转换', priority: 'high' },
      { name: 'JSON 格式化', href: '/tools/json-formatter', description: '格式化和验证JSON', priority: 'high' },
      { name: 'JWT 解析器', href: '/tools/jwt-decoder', description: '解码和验证JWT令牌', priority: 'medium' },
    ]
  },
  {
    title: '文本处理',
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    priority: 'high',
    tools: [
      { name: '时间戳转换', href: '/tools/timestamp', description: '时间戳与日期互转', priority: 'high' },
      { name: '正则表达式', href: '/tools/regex-tester', description: '测试和验证正则表达式', priority: 'medium' },
      { name: '文本差异比较', href: '/tools/text-diff', description: '比较两段文本的差异', priority: 'medium' },
      { name: '文本搜索替换', href: '/tools/text-replace', description: '搜索和替换文本内容', priority: 'low' },
      { name: 'Cron 表达式', href: '/tools/cron-expression', description: '生成和解析Cron表达式', priority: 'low' },
      { name: '汉字拼音转换', href: '/tools/pinyin-converter', description: '汉字与拼音双向转换', priority: 'low' },
    ]
  },
  {
    title: '加密哈希',
    icon: Hash,
    color: 'from-green-500 to-emerald-500',
    priority: 'medium',
    tools: [
      { name: '哈希值生成', href: '/tools/hash-generator', description: '支持MD5、SHA1、SHA256等', priority: 'high' },
      { name: '密码生成器', href: '/tools/password-generator', description: '生成安全的随机密码', priority: 'high' },
      { name: 'UUID 生成器', href: '/tools/uuid-generator', description: '生成UUID标识符', priority: 'medium' },
    ]
  },
  {
    title: '图片工具',
    icon: Image,
    color: 'from-purple-500 to-pink-500',
    priority: 'medium',
    tools: [
      { name: '二维码工具', href: '/tools/qr-code', description: '生成和解析二维码', priority: 'high' },
      { name: '图片转换器', href: '/tools/image-converter', description: '转换图片格式', priority: 'medium' },
    ]
  },
  {
    title: '颜色工具',
    icon: Palette,
    color: 'from-pink-500 to-rose-500',
    priority: 'low',
    tools: [
      { name: '颜色转换器', href: '/tools/color-converter', description: '颜色格式互转', priority: 'medium' },
    ]
  },
  {
    title: '系统工具',
    icon: Monitor,
    color: 'from-gray-500 to-slate-500',
    priority: 'low',
    tools: [
      { name: '浏览器信息', href: '/tools/browser-info', description: '检测浏览器信息和生成浏览器指纹', priority: 'low' },
    ]
  }
]

// 加载骨架组件
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
)

// 工具卡片组件
const ToolCard = React.memo(({ tool, index }: { tool: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.05 * index }}
  >
    <Link href={tool.href} prefetch={tool.priority === 'high'}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            {tool.name}
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{tool.description}</p>
          {tool.priority === 'high' && (
            <Badge variant="secondary" className="mt-2 text-xs">热门</Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  </motion.div>
))

ToolCard.displayName = 'ToolCard'

export default function ToolsPageClient() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              开发者工具箱
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              集成多种实用开发者工具，保护您的隐私安全。所有功能均在本地浏览器运行，无需上传数据到服务器。
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Badge variant="secondary">隐私保护</Badge>
              <Badge variant="secondary">本地处理</Badge>
              <Badge variant="secondary">开源透明</Badge>
              <Badge variant="secondary">响应式设计</Badge>
              <Badge variant="secondary">代码分割优化</Badge>
            </div>
          </motion.div>

          {/* Tool Categories */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading tools...</span>
            </div>
          }>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-12"
            >
              {toolCategories.map((category, categoryIndex) => (
                <div key={category.title}>
                  <div className="flex items-center mb-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mr-4`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">{category.title}</h2>
                    {category.priority === 'high' && (
                      <Badge variant="destructive" className="ml-2">推荐</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.tools.map((tool, toolIndex) => (
                      <ToolCard key={tool.href} tool={tool} index={toolIndex} />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </Suspense>
        </div>
      </section>

      <Footer />
    </div>
  )
}