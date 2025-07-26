"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronDown, Wrench, Code, Image, Hash, FileText, Palette, Monitor, Menu, X } from 'lucide-react'
import { NextNameLogo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { useTranslations } from '@/hooks/useTranslations'


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
  const { t } = useTranslations()
  const [isToolsHovered, setIsToolsHovered] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // 工具分类配置 - 使用国际化
  const toolCategories = [
    {
      title: t('navigation.categories.encoding') || '编码转换',
      icon: Code,
      tools: [
        { name: t('navigation.tools.base64') || 'Base64 转换器', href: '/tools/base64', description: t('navigation.descriptions.base64') || '文本与Base64编码互转' },
        { name: t('navigation.tools.urlEncoder') || 'URL 编解码', href: '/tools/url-encoder', description: t('navigation.descriptions.urlEncoder') || 'URL编码与解码转换' },
        { name: t('navigation.tools.jsonFormatter') || 'JSON 格式化', href: '/tools/json-formatter', description: t('navigation.descriptions.jsonFormatter') || '格式化和验证JSON' },
        { name: t('navigation.tools.jwtDecoder') || 'JWT 解析器', href: '/tools/jwt-decoder', description: t('navigation.descriptions.jwtDecoder') || '解码和验证JWT令牌' },
      ]
    },
    {
      title: t('navigation.categories.image') || '图片工具',
      icon: Image,
      tools: [
        { name: t('navigation.tools.imageConverter') || '图片转换器', href: '/tools/image-converter', description: t('navigation.descriptions.imageConverter') || '转换图片格式' },
        { name: t('navigation.tools.imageEditor') || '图片编辑器', href: '/tools/image-editor', description: t('navigation.descriptions.imageEditor') || '调整图片大小和格式' },
        { name: t('navigation.tools.qrCode') || '二维码工具', href: '/tools/qr-code', description: t('navigation.descriptions.qrCode') || '生成和解析二维码' },
        { name: t('navigation.tools.colorPicker') || '颜色取色器', href: '/tools/color-picker', description: t('navigation.descriptions.colorPicker') || '从图片中提取颜色' },
      ]
    },
    {
      title: t('navigation.categories.hash') || '加密哈希',
      icon: Hash,
      tools: [
        { name: t('navigation.tools.hashGenerator') || '哈希值生成', href: '/tools/hash-generator', description: t('navigation.descriptions.hashGenerator') || '支持MD5、SHA1、SHA256等' },
        { name: t('navigation.tools.passwordGenerator') || '密码生成器', href: '/tools/password-generator', description: t('navigation.descriptions.passwordGenerator') || '生成安全的随机密码' },
        { name: t('navigation.tools.uuidGenerator') || 'UUID 生成器', href: '/tools/uuid-generator', description: t('navigation.descriptions.uuidGenerator') || '生成UUID标识符' },
      ]
    },
    {
      title: t('navigation.categories.text') || '文本处理',
      icon: FileText,
      tools: [
        { name: t('navigation.tools.textDiff') || '文本差异比较', href: '/tools/text-diff', description: t('navigation.descriptions.textDiff') || '比较两段文本的差异' },
        { name: t('navigation.tools.textReplace') || '文本搜索替换', href: '/tools/text-replace', description: t('navigation.descriptions.textReplace') || '搜索和替换文本内容' },
        { name: t('navigation.tools.timestamp') || '时间戳转换', href: '/tools/timestamp', description: t('navigation.descriptions.timestamp') || '时间戳与日期互转' },
        { name: t('navigation.tools.regexTester') || '正则表达式', href: '/tools/regex-tester', description: t('navigation.descriptions.regexTester') || '测试和验证正则表达式' },
        { name: t('navigation.tools.cronExpression') || 'Cron 表达式', href: '/tools/cron-expression', description: t('navigation.descriptions.cronExpression') || '生成和解析Cron表达式' },
        { name: t('navigation.tools.pinyinConverter') || '汉字拼音转换', href: '/tools/pinyin-converter', description: t('navigation.descriptions.pinyinConverter') || '汉字转拼音工具' },
      ]
    },
    {
      title: t('navigation.categories.color') || '颜色工具',
      icon: Palette,
      tools: [
        { name: t('navigation.tools.colorConverter') || '颜色转换器', href: '/tools/color-converter', description: t('navigation.descriptions.colorConverter') || '颜色格式互转' },
      ]
    },
    {
      title: t('navigation.categories.system') || '系统工具',
      icon: Monitor,
      tools: [
        { name: t('navigation.tools.browserInfo') || '浏览器信息', href: '/tools/browser-info', description: t('navigation.descriptions.browserInfo') || '检测浏览器信息和生成浏览器指纹' },
      ]
    }
  ]

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
                  <span>{t('common.toolbox')}</span>
                  <ChevronDown className="w-4 h-4" />
                </Link>

                {/* 下拉菜单 */}
                {isToolsHovered && (
                  <div className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-popover border rounded-md shadow-lg z-[99999]">
                    <div className="p-2">
                      <Link href="/tools">
                        <div className="flex items-center px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground font-medium text-primary">
                          <Wrench className="w-4 h-4 mr-2" />
                          {t('navigation.allTools') || '所有工具'}
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
          <div className="flex items-center space-x-2">
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            
            {/* 桌面端控件 */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSwitcher currentLocale={currentLocale} />
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* 移动端下拉菜单 */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t bg-background"
          >
            <div className="p-4 space-y-4">
              {/* 移动端工具菜单 */}
              <div>
                <Link
                  href="/tools"
                  className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Wrench className="w-4 h-4" />
                  <span>{t('common.toolbox')}</span>
                </Link>
                
                {/* 移动端工具分类 */}
                <div className="ml-6 mt-2 space-y-3">
                  {toolCategories.map((category, categoryIndex) => (
                    <div key={category.title}>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <category.icon className="w-3 h-3 inline mr-1" />
                        {category.title}
                      </div>
                      <div className="space-y-1">
                        {category.tools.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-2 px-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-xs text-muted-foreground">{tool.description}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 移动端设置 */}
              <div className="pt-4 border-t flex items-center justify-between">
                <span className="text-sm font-medium">{t('header.settings') || '设置'}</span>
                <div className="flex items-center space-x-4">
                  <LanguageSwitcher currentLocale={currentLocale} />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}

export default Navigation
