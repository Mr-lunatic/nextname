"use client";

export const runtime = 'edge';

import { useTranslations } from '@/hooks/useTranslations'
import { motion } from 'framer-motion'
import {
  Globe,
  Users,
  Award,
  Target,
  Heart,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  Star,
  CheckCircle,
  Mail,
  MapPin,
  Phone
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EnhancedButton } from '@/components/ui/enhanced-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { NextNameLogo } from '@/components/logo'
import { Footer } from '@/components/footer'

export default function AboutPage() {
  const { t } = useTranslations()

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "创始人 & CEO",
      description: "前阿里巴巴高级架构师，专注于域名技术和互联网基础设施10余年",
      avatar: "👨‍💻"
    },
    {
      name: "Sarah Wang",
      role: "首席技术官",
      description: "MIT计算机科学博士，曾在谷歌从事分布式系统研发",
      avatar: "👩‍💻"
    },
    {
      name: "David Liu",
      role: "产品总监",
      description: "资深产品经理，曾在微软和腾讯负责企业级产品设计",
      avatar: "👨‍💼"
    },
    {
      name: "Emily Zhang",
      role: "营销总监",
      description: "数字营销专家，在域名和网络安全领域有丰富的市场经验",
      avatar: "👩‍💼"
    }
  ]

  const values = [
    {
      icon: Shield,
      title: "安全可靠",
      description: "我们使用最先进的加密技术和安全措施，确保您的数据和隐私得到全面保护。",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Zap,
      title: "高效便捷",
      description: "简化复杂的域名查询流程，让您在几秒钟内获得所需的全面信息。",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "持续创新",
      description: "不断研发新技术，提供更智能、更准确的域名分析和推荐服务。",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Heart,
      title: "用户至上",
      description: "以用户需求为中心，提供贴心的客户服务和持续的产品改进。",
      color: "from-orange-500 to-red-500"
    }
  ]

  const milestones = [
    {
      year: "2020",
      title: "公司成立",
      description: "Next Name在北京成立，专注于域名查询和分析技术"
    },
    {
      year: "2021",
      title: "技术突破",
      description: "成功开发智能域名分析引擎，支持50+注册商价格对比"
    },
    {
      year: "2022",
      title: "用户增长",
      description: "服务用户突破100万，成为中国领先的域名查询平台"
    },
    {
      year: "2023",
      title: "国际化",
      description: "推出多语言版本，业务拓展至东南亚和欧洲市场"
    },
    {
      year: "2024",
      title: "AI赋能",
      description: "集成AI技术，推出智能域名推荐和预测功能"
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* Header */}
      <header className="container-magazine py-4 relative z-[10000]">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <div>
              <NextNameLogo className="text-foreground" />
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLocale="zh-CN" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-magazine py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <Badge variant="secondary" className="px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            关于我们
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gradient-premium">
            我们是 Next Name
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            致力于为全球用户提供最专业、最便捷的域名查询和分析服务，让每个人都能轻松找到完美的域名。
          </p>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="container-magazine py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6">我们的使命</h2>
            <p className="text-lg text-muted-foreground mb-6">
              在数字化时代，域名是企业和个人在互联网上的重要标识。我们的使命是简化域名查询流程，
              提供准确、全面的域名信息，帮助用户做出明智的决策。
            </p>
            <p className="text-lg text-muted-foreground mb-8">
              通过先进的技术和贴心的服务，我们让域名查询变得简单、快速、可靠，
              让每个人都能在互联网上找到属于自己的完美域名。
            </p>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>500+ TLD 全面支持</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>50+ 注册商价格对比</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>实时 WHOIS 查询</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>智能域名推荐</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="text-6xl text-center">🚀</div>
            <div className="mt-8 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">我们的愿景</h3>
              <p className="text-center text-muted-foreground">
                成为全球领先的域名查询和分析平台，让域名选择变得更加智能和便捷。
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container-magazine py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">我们的价值观</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            以下价值观指导着我们的每一个决策和行动
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${value.color} mb-4`}>
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>



      {/* CTA Section */}
      <section className="container-magazine py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl font-bold">准备开始了吗？</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            立即体验Next Name的强大功能，找到您的完美域名
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="btn-primary text-lg px-8 py-3">
                开始搜索
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                浏览功能
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}