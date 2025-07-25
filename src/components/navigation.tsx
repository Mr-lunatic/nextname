"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, Wrench, Code, Image, Hash, FileText, Palette, Monitor } from 'lucide-react'
import { NextNameLogo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'


interface NavigationProps {
  currentLocale?: string
  className?: string
}

// 工具分类配置
const toolCategories = [
  {
    title: '编码转换',
    icon: Code,
    tools: [
      { name: 'Base64 转换器', href: '/tools/base64', description: '文本与Base64编码互转' },
      { name: 'URL 编解码', href: '/tools/url-encoder', description: 'URL编码与解码转换' },
      { name: 'JSON 格式化', href: '/tools/json-formatter', description: '格式化和验证JSON' },
      { name: 'JWT 解析器', href: '/tools/jwt-decoder', description: '解码和验证JWT令牌' },
    ]
  },
  {
    title: '图片工具',
    icon: Image,
    tools: [
      { name: '图片转换器', href: '/tools/image-converter', description: '转换图片格式' },
      { name: '图片编辑器', href: '/tools/image-editor', description: '调整图片大小和格式' },
      { name: '二维码工具', href: '/tools/qr-code', description: '生成和解析二维码' },
      { name: '颜色取色器', href: '/tools/color-picker', description: '从图片中提取颜色' },
    ]
  },
  {
    title: '加密哈希',
    icon: Hash,
    tools: [
      { name: '哈希值生成', href: '/tools/hash-generator', description: '支持MD5、SHA1、SHA256等' },
      { name: '密码生成器', href: '/tools/password-generator', description: '生成安全的随机密码' },
      { name: 'UUID 生成器', href: '/tools/uuid-generator', description: '生成UUID标识符' },
    ]
  },
  {
    title: '文本处理',
    icon: FileText,
    tools: [
      { name: '文本差异比较', href: '/tools/text-diff', description: '比较两段文本的差异' },
      { name: '文本搜索替换', href: '/tools/text-replace', description: '搜索和替换文本内容' },
      { name: '时间戳转换', href: '/tools/timestamp', description: '时间戳与日期互转' },
      { name: '正则表达式', href: '/tools/regex-tester', description: '测试和验证正则表达式' },
      { name: 'Cron 表达式', href: '/tools/cron-expression', description: '生成和解析Cron表达式' },
      { name: '汉字拼音转换', href: '/tools/pinyin-converter', description: '汉字转拼音工具' },
    ]
  },
  {
    title: '颜色工具',
    icon: Palette,
    tools: [
      { name: '颜色转换器', href: '/tools/color-converter', description: '颜色格式互转' },
    ]
  },
  {
    title: '系统工具',
    icon: Monitor,
    tools: [
      { name: '浏览器信息', href: '/tools/browser-info', description: '检测浏览器信息和生成浏览器指纹' },
    ]
  }
]

export const Navigation: React.FC<NavigationProps> = ({
  currentLocale = 'zh',
  className = ''
}) => {
  const [isToolsHovered, setIsToolsHovered] = React.useState(false)

  return (
    <header className={`backdrop-blur relative z-50 ${className}`} style={{ borderBottom: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-surface-secondary)' }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo 和主导航 */}
          <div className="flex items-center space-x-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <Link href="/" className="flex items-center">
                <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity cursor-pointer" />
              </Link>
            </motion.div>

            {/* 工具菜单 */}
            <nav className="hidden md:flex items-center space-x-6">
              <div
                className="relative"
                onMouseEnter={() => setIsToolsHovered(true)}
                onMouseLeave={() => setIsToolsHovered(false)}
              >
                <Link
                  href="/tools"
                  className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-accent"
                >
                  <Wrench className="w-4 h-4" />
                  <span>工具箱</span>
                  <ChevronDown className="w-4 h-4" />
                </Link>

                {/* 下拉菜单 */}
                {isToolsHovered && (
                  <div className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-popover border rounded-md shadow-lg z-[99999]">
                    <div className="p-2">
                      <Link href="/tools">
                        <div className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground font-medium text-primary">
                          <Wrench className="w-4 h-4 mr-2" />
                          所有工具
                        </div>
                      </Link>
                      <div className="-mx-1 my-1 h-px bg-muted"></div>

                      {toolCategories.map((category, categoryIndex) => (
                        <div key={category.title}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <category.icon className="w-3 h-3 inline mr-1" />
                            {category.title}
                          </div>
                          {category.tools.map((tool) => (
                            <Link key={tool.href} href={tool.href}>
                              <div className="pl-4 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground">
                                <div>
                                  <div className="font-medium">{tool.name}</div>
                                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {categoryIndex < toolCategories.length - 1 && <div className="-mx-1 my-1 h-px bg-muted"></div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* 右侧控件 */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLocale={currentLocale} />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navigation
