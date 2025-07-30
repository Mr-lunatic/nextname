"use client";

import { motion } from 'framer-motion'
import { Shield, ArrowLeft, FileText, Database, Lock, Users, Eye, CheckCircle, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { CardSpotlight } from '@/components/ui/framer-spotlight'
import { NextNameLogo } from '@/components/logo'
import { Footer } from '@/components/footer'
import { ScrollToTop } from '@/components/scroll-to-top'

export default function PrivacyPageClient() {
  const sections = [
    {
      icon: FileText,
      title: "信息收集",
      content: "我们可能收集以下类型的信息：",
      details: [
        "您主动提供的信息（如搜索查询、联系信息）",
        "自动收集的技术信息（如IP地址、浏览器类型、访问时间）",
        "Cookie和类似技术收集的使用数据",
        "第三方服务提供的公开域名信息"
      ]
    },
    {
      icon: Database,
      title: "信息使用",
      content: "我们使用收集的信息用于：",
      details: [
        "提供域名搜索和价格比较服务",
        "改进网站功能和用户体验",
        "分析使用趋势和性能优化",
        "防止欺诈和滥用行为",
        "遵守法律法规要求"
      ]
    },
    {
      icon: Lock,
      title: "信息保护",
      content: "我们采取以下措施保护您的信息：",
      details: [
        "使用HTTPS加密传输所有数据",
        "实施访问控制和权限管理",
        "定期进行安全审计和漏洞扫描",
        "采用行业标准的数据加密技术",
        "建立数据泄露应急响应机制"
      ]
    },
    {
      icon: Users,
      title: "信息共享",
      content: "我们不会出售您的个人信息。可能共享信息的情况：",
      details: [
        "获得您明确同意的情况下",
        "为提供服务而与可信第三方合作",
        "遵守法律法规或政府要求",
        "保护我们的权利和安全",
        "业务转让或合并情况下"
      ]
    },
    {
      icon: Eye,
      title: "Cookie使用",
      content: "我们使用Cookie来：",
      details: [
        "记住您的偏好设置和搜索历史",
        "分析网站使用情况和性能",
        "提供个性化的用户体验",
        "防止欺诈和提高安全性",
        "支持第三方分析和广告服务"
      ]
    },
    {
      icon: CheckCircle,
      title: "您的权利",
      content: "您拥有以下权利：",
      details: [
        "访问和查看我们持有的您的信息",
        "更正不准确或不完整的信息",
        "删除您的个人信息（在法律允许的范围内）",
        "限制或反对某些信息处理活动",
        "数据可携带权（获取您的数据副本）"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>返回首页</span>
              </Link>
            </Button>
            <NextNameLogo />
          </div>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
              <Shield className="relative h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            隐私政策
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            我们重视您的隐私，致力于保护您的个人信息安全
          </p>
          <div className="flex items-center justify-center mt-6 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 mr-2" />
            <span>最后更新：2024年7月29日</span>
          </div>
        </motion.div>

        {/* Privacy Sections */}
        <div className="grid gap-8 max-w-4xl mx-auto">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <CardSpotlight className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <section.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{section.content}</p>
                  <ul className="space-y-2">
                    {section.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 max-w-2xl mx-auto"
        >
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>联系我们</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>邮箱：</strong> privacy@nextname.app</p>
                <p><strong>地址：</strong> 中国上海市</p>
                <p><strong>响应时间：</strong> 我们将在收到您的请求后30天内回复</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  )
}
