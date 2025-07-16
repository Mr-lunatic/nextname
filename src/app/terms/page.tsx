export const runtime = 'edge';

"use client"

import { motion } from 'framer-motion'
import { Globe, Sparkles, ArrowLeft, Scale, AlertTriangle, CheckCircle, XCircle, RefreshCw, Gavel } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { CardSpotlight } from '@/components/ui/framer-spotlight'
import { NextNameLogo } from '@/components/logo'

export default function TermsPage() {
  const sections = [
    {
      icon: CheckCircle,
      title: "服务说明",
      content: `Next Name是一个免费的域名查询和比较服务平台，提供以下功能：
      
• **域名查询**：检查域名的可用性和注册状态
• **价格对比**：展示不同注册商的域名价格信息
• **WHOIS查询**：提供域名的注册和技术信息
• **智能推荐**：根据您的搜索提供相关域名建议

我们不是域名注册商，不直接销售域名，而是为您提供信息和链接到授权注册商。`
    },
    {
      icon: Scale,
      title: "使用条件",
      content: `通过使用Next Name服务，您同意遵守以下条件：
      
• **合法使用**：仅将服务用于合法目的
• **准确信息**：提供真实准确的查询信息
• **禁止滥用**：不得进行大规模自动化查询或攻击行为
• **知识产权**：尊重他人的商标权和知识产权
• **遵守法律**：遵守适用的当地法律法规

违反这些条件可能导致服务访问受限或终止。`
    },
    {
      icon: XCircle,
      title: "服务限制",
      content: `请注意以下服务限制和免责声明：
      
• **信息准确性**：我们努力提供准确信息，但不保证100%准确
• **服务可用性**：服务可能因维护或技术问题临时中断
• **第三方依赖**：依赖第三方数据源，可能影响信息完整性
• **价格变动**：注册商价格可能随时变更，以实际注册时为准
• **域名注册**：我们不保证任何域名的成功注册

我们建议在做出重要决策前，直接向注册商确认最新信息。`
    },
    {
      icon: AlertTriangle,
      title: "免责声明",
      content: `在法律允许的最大范围内：
      
• **服务现状**：服务按"现状"提供，不提供任何明示或暗示的保证
• **损失责任**：我们不对因使用服务而产生的任何直接或间接损失承担责任
• **业务中断**：不对因服务中断导致的业务损失承担责任
• **数据丢失**：不对任何数据丢失或损坏承担责任
• **第三方行为**：不对第三方注册商的行为或服务质量承担责任

用户使用服务的风险由用户自行承担。`
    },
    {
      icon: RefreshCw,
      title: "服务变更",
      content: `我们保留以下权利：
      
• **功能调整**：随时修改、暂停或终止任何服务功能
• **条款更新**：更新服务条款和使用政策
• **访问限制**：限制或终止违规用户的服务访问
• **技术升级**：对系统进行技术升级和维护
• **合作调整**：调整第三方合作关系和数据源

重大变更将提前30天通知用户。`
    },
    {
      icon: Gavel,
      title: "争议解决",
      content: `关于服务条款的争议解决：
      
• **适用法律**：本条款受中华人民共和国法律管辖
• **争议协商**：首先通过友好协商解决争议
• **司法管辖**：如协商无效，由服务提供方所在地法院管辖
• **条款效力**：如部分条款无效，不影响其他条款效力
• **语言版本**：以中文版本为准，其他语言仅供参考

我们鼓励用户在遇到问题时首先联系客服团队。`
    }
  ]

  return (
    <div className="min-h-screen gradient-bg-premium hero-bg-pattern">
      {/* Header */}
      <header className="container-magazine py-4">
        <div className="flex justify-between items-center backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3"
          >
            <div>
              <NextNameLogo className="text-foreground" />
            </div>
          </motion.div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher 
              currentLocale="zh-CN"
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full mb-6">
            <Scale className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">法律条款</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient-premium">服务条款</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            请仔细阅读以下条款，使用我们的服务即表示您同意这些条款和条件。
          </p>
          <div className="text-sm text-muted-foreground mt-4">
            最后更新时间：2025年7月15日
          </div>
        </motion.div>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <CardSpotlight>
                <Card className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl flex items-center justify-center">
                        <section.icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-xl">{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                      {section.content}
                    </div>
                  </CardContent>
                </Card>
              </CardSpotlight>
            </motion.div>
          ))}
        </div>

        {/* Agreement Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <CardSpotlight>
            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4">同意条款</h3>
                <p className="text-muted-foreground mb-6">
                  继续使用Next Name服务即表示您已阅读、理解并同意遵守本服务条款。如果您不同意这些条款，请停止使用我们的服务。
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>客服邮箱：</strong> <a href="mailto:support@nextname.app" className="text-primary hover:underline">support@nextname.app</a></p>
                  <p><strong>法务邮箱：</strong> <a href="mailto:legal@nextname.app" className="text-primary hover:underline">legal@nextname.app</a></p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Button asChild>
                    <Link href="/">我已阅读并同意</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="mailto:legal@nextname.app">法律咨询</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardSpotlight>
        </motion.div>
      </div>
    </div>
  )
}