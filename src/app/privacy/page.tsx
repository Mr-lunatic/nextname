"use client";

export const runtime = 'edge';

import { motion } from 'framer-motion'
import { Shield, ArrowLeft, FileText, Database, Lock, Users, Eye, CheckCircle, Globe, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { CardSpotlight } from '@/components/ui/framer-spotlight'
import { Footer } from '@/components/footer'

export default function PrivacyPage() {
  const sections = [
    {
      icon: FileText,
      title: "信息收集",
      content: "我们可能收集以下类型的信息：",
      items: [
        {
          title: "域名查询信息",
          description: "您搜索的域名、查询类型、搜索偏好",
          color: "blue"
        },
        {
          title: "技术信息", 
          description: "IP地址、浏览器类型、设备信息、访问时间",
          color: "green"
        },
        {
          title: "使用数据",
          description: "页面访问记录、点击行为、搜索历史",
          color: "purple"
        },
        {
          title: "本地存储",
          description: "语言偏好、货币设置、最近搜索记录",
          color: "orange"
        }
      ],
      footer: "我们不会收集您的个人身份信息，如姓名、邮箱或电话号码，除非您主动提供。"
    },
    {
      icon: Database,
      title: "信息使用",
      content: "我们使用收集的信息用于：",
      items: [
        {
          title: "提供服务",
          description: "处理域名查询请求，显示搜索结果",
          color: "blue"
        },
        {
          title: "改进体验",
          description: "优化搜索算法，提供个性化推荐",
          color: "green"
        },
        {
          title: "网站维护",
          description: "监控网站性能，修复技术问题",
          color: "purple"
        },
        {
          title: "统计分析",
          description: "了解用户行为，改进产品功能",
          color: "orange"
        },
        {
          title: "安全保护",
          description: "防止滥用，检测恶意活动",
          color: "red"
        }
      ],
      footer: "我们承诺不会将您的信息用于营销推广或出售给第三方。"
    },
    {
      icon: Lock,
      title: "信息保护",
      content: "我们采取以下措施保护您的信息：",
      items: [
        {
          title: "数据加密",
          description: "所有数据传输采用HTTPS加密",
          color: "blue"
        },
        {
          title: "访问控制",
          description: "严格限制内部人员数据访问权限",
          color: "green"
        },
        {
          title: "安全监控",
          description: "24/7监控系统安全状态",
          color: "purple"
        },
        {
          title: "定期备份",
          description: "确保数据安全性和可恢复性",
          color: "orange"
        },
        {
          title: "漏洞修复",
          description: "及时更新系统，修复安全漏洞",
          color: "red"
        }
      ],
      footer: "我们定期审查和更新安全措施，确保符合最新的安全标准。"
    },
    {
      icon: Users,
      title: "信息共享",
      content: "我们可能与以下第三方分享必要信息：",
      items: [
        {
          title: "域名注册商",
          description: "为您提供域名注册服务",
          color: "blue"
        },
        {
          title: "WHOIS数据库",
          description: "获取域名注册信息",
          color: "green"
        },
        {
          title: "分析服务",
          description: "匿名化的网站使用统计",
          color: "purple"
        },
        {
          title: "CDN服务商",
          description: "提供内容分发和加速服务",
          color: "orange"
        }
      ],
      footer: "我们要求所有第三方合作伙伴遵守严格的隐私标准，不会与任何未经授权的第三方分享您的个人信息。"
    },
    {
      icon: Eye,
      title: "您的权利",
      content: "根据适用的隐私法律，您享有以下权利：",
      items: [
        {
          title: "访问权",
          description: "查看我们收集的关于您的信息",
          color: "blue"
        },
        {
          title: "更正权",
          description: "请求更正不准确的信息",
          color: "green"
        },
        {
          title: "删除权",
          description: "请求删除您的个人信息",
          color: "purple"
        },
        {
          title: "限制权",
          description: "限制我们处理您的信息",
          color: "orange"
        },
        {
          title: "数据可携权",
          description: "获取您的数据副本",
          color: "red"
        }
      ],
      footer: "如需行使这些权利，请通过support@nextname.app联系我们。"
    },
    {
      icon: Shield,
      title: "政策更新",
      content: "我们可能会不时更新本隐私政策：",
      items: [
        {
          title: "通知方式",
          description: "重要变更会在网站上显著位置公告",
          color: "blue"
        },
        {
          title: "生效日期",
          description: "新政策将在发布后30天生效",
          color: "green"
        },
        {
          title: "持续使用",
          description: "继续使用服务即表示接受更新后的政策",
          color: "purple"
        }
      ],
      footer: "我们建议您定期查看本隐私政策，以了解最新的信息处理方式。"
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap: {[key: string]: string} = {
      blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      green: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
      orange: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
    }
    return colorMap[color] || colorMap.blue
  }

  const getDotColorClasses = (color: string) => {
    const colorMap: {[key: string]: string} = {
      blue: "bg-blue-500",
      green: "bg-green-500", 
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      red: "bg-red-500"
    }
    return colorMap[color] || colorMap.blue
  }

  const getTextColorClasses = (color: string) => {
    const colorMap: {[key: string]: string} = {
      blue: "text-blue-900 dark:text-blue-100",
      green: "text-green-900 dark:text-green-100",
      purple: "text-purple-900 dark:text-purple-100",
      orange: "text-orange-900 dark:text-orange-100",
      red: "text-red-900 dark:text-red-100"
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="min-h-screen gradient-bg-premium">
      {/* Header */}
      <header className="container-magazine py-4 relative z-[10000]">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-premium font-serif">Next Name</h1>
              <p className="text-xs text-muted-foreground font-sans">Find Your Perfect Domain</p>
            </div>
          </motion.div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLocale="zh-CN" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container-magazine py-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full mb-6">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">隐私保护</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-premium">隐私政策</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们重视您的隐私权，本政策说明我们如何收集、使用和保护您的信息。
          </p>
          <div className="text-sm text-muted-foreground mt-4">
            最后更新时间：2025年1月15日
          </div>
        </motion.div>

        {/* Policy Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CardSpotlight>
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                    <CardTitle className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-primary to-purple-600 rounded-lg">
                        <section.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xl">{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">{section.content}</p>
                      <div className="space-y-3">
                        {section.items.map((item, itemIndex) => (
                          <div key={itemIndex} className={`flex items-start space-x-3 p-4 rounded-lg border transition-all hover:shadow-sm ${getColorClasses(item.color)}`}>
                            <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getDotColorClasses(item.color)}`}></div>
                            <div className="flex-1">
                              <h4 className={`font-semibold mb-1 ${getTextColorClasses(item.color)}`}>
                                {item.title}
                              </h4>
                              <p className={`text-sm opacity-80 ${getTextColorClasses(item.color)}`}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                        <p className="text-sm text-muted-foreground italic">
                          {section.footer}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <CardSpotlight>
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-4">联系我们</h3>
                <p className="text-muted-foreground mb-6">
                  如果您对本隐私政策有任何疑问或需要行使您的权利，请随时联系我们：
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>邮箱：</strong> <a href="mailto:privacy@nextname.app" className="text-primary hover:underline">privacy@nextname.app</a></p>
                  <p><strong>客服：</strong> <a href="mailto:support@nextname.app" className="text-primary hover:underline">support@nextname.app</a></p>
                </div>
                <Button className="mt-6" asChild>
                  <a href="mailto:privacy@nextname.app">联系隐私团队</a>
                </Button>
              </CardContent>
            </Card>
          </CardSpotlight>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}