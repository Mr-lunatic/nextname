"use client";

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { TldItem } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Search, 
  Shield, 
  ExternalLink, 
  Sparkles,
  Star,
  CheckCircle,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Award,
  ChevronDown
} from 'lucide-react'
import { EnhancedSmartSearchV2 } from '@/components/enhanced-smart-search-v2'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageSwitcher } from '@/components/language-currency-switcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NextNameLogo } from '@/components/logo'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Navigation } from '@/components/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import { CardSpotlight, HeroSpotlight, LightSpotlight } from '@/components/ui/framer-spotlight';
import { LazySection, LazyPlaceholder } from '@/components/lazy-section'
import { WebsiteStructuredData, SoftwareApplicationStructuredData, FAQStructuredData } from '@/components/seo-structured-data'


export default function HomePageContent({ popularTLDs }: { popularTLDs: { name: string; price: string; }[] }) {
  const router = useRouter()
  const { t, locale, switchLocale } = useTranslations()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const handleSearch = (query: string, type: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}&type=${type}`)
  }

  const handleTLDClick = (tld: string) => {
    router.push(`/search?q=${encodeURIComponent(tld)}&type=suffix`)
  }

  // 滚动到搜索区域的函数
  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section')
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // 跳转到关于我们页面
  const handleLearnMore = () => {
    router.push('/about')
  }

  // 使用useMemo优化数据处理
  const memoizedAssistantFeatures = useMemo(() => [
    {
      icon: Search,
      title: "智能域名搜索",
      description: "无论您输入关键词、前缀还是完整域名，我们的AI引擎都能理解您的需求，快速提供最相关的搜索结果。",
      benefit: "节省搜索时间，精准匹配需求"
    },
    {
      icon: BarChart3,
      title: "全网价格对比",
      description: "实时对比50+顶级注册商价格，包括注册、续费、转移费用，确保您获得最优惠的价格方案。",
      benefit: "省钱省心，透明定价"
    },
    {
      icon: Shield,
      title: "域名信息查询",
      description: "提供详细的WHOIS信息、注册状态、到期时间等关键数据，帮助您做出明智的域名选择。",
      benefit: "信息透明，决策有据"
    }
  ], [])

  // 使用流程
  const processSteps = [
    {
      step: "01",
      title: "输入查询",
      description: "输入域名前缀、后缀或完整域名，支持智能识别查询类型。",
      icon: Search,
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: "02", 
      title: "获取信息",
      description: "查询注册状态、WHOIS信息，对比多个注册商的价格方案。",
      icon: BarChart3,
      color: "from-purple-500 to-pink-500"
    },
    {
      step: "03",
      title: "快速注册",
      description: "选择最优价格的注册商，一键跳转完成域名注册流程。",
      icon: CheckCircle,
      color: "from-green-500 to-emerald-500"
    }
  ]



  // FAQ数据 - 使用翻译，带安全检查，扩展到5-6个问题
  const faqData = t('faq.questions', { returnObjects: true as any })
  const faqs = Array.isArray(faqData) ? faqData : [
    {
      question: t('faq.questions.0.question') || "NextName是否完全免费使用？",
      answer: t('faq.questions.0.answer') || "是的，NextName的所有查询功能都完全免费。我们不收取任何查询费用，也不要求用户注册账号。我们通过与注册商的合作获得收入，为用户提供免费服务。"
    },
    {
      question: t('faq.questions.1.question') || "价格对比的数据多久更新一次？",
      answer: t('faq.questions.1.answer') || "我们的价格数据每小时自动更新，确保您看到的都是最新的市场价格。对于热门域名后缀，我们甚至会更频繁地更新价格信息。"
    },
    {
      question: t('faq.questions.2.question') || "支持哪些类型的域名查询？",
      answer: t('faq.questions.2.answer') || "NextName支持关键词搜索、前缀搜索、后缀查询和完整域名查询。我们的智能引擎会自动识别您的查询类型，提供最相关的结果。"
    },
    {
      question: t('faq.questions.3.question') || "域名价格数据的准确性如何保证？",
      answer: t('faq.questions.3.answer') || "我们直接对接50+主流注册商的API，实时获取最新价格信息。所有价格数据都经过验证，确保准确性。同时我们会标注数据更新时间，让您了解信息的时效性。"
    },
    {
      question: t('faq.questions.4.question') || "如何选择合适的域名注册商？",
      answer: t('faq.questions.4.answer') || "选择注册商时需要考虑价格、服务质量、续费成本、技术支持等因素。我们的价格对比表会显示各注册商的特色功能，如免费SSL、WHOIS隐私保护等，帮助您做出最佳选择。"
    },
    {
      question: t('faq.questions.5.question') || "NextName是否会保存我的搜索记录？",
      answer: t('faq.questions.5.answer') || "我们非常重视用户隐私。NextName不会保存您的个人搜索记录，所有查询都是匿名进行的。我们只会统计总体使用数据来改进服务质量。"
    }
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      {/* SEO Structured Data */}
      <WebsiteStructuredData
        url="https://nextname.app"
        name="NextName - AI-Powered Domain Search Platform"
        description="Search domain availability instantly with our AI-powered tool. Compare prices from 50+ registrars, get WHOIS data, and discover your perfect domain name."
        keywords={[
          'domain search', 'domain availability checker', 'whois lookup', 'domain name generator',
          'domain price comparison', 'ai domain suggestions', 'domain registrar comparison'
        ]}
      />
      <SoftwareApplicationStructuredData />
      <FAQStructuredData faqs={faqs} />

      <Navigation currentLocale={locale} />

      {/* Hero Section */}
      <section className="section-padding pt-2">
        <HeroSpotlight>
        <div className="container-magazine">
            <div className="text-center space-y-12 min-h-[80vh] flex flex-col justify-center">
              {/* Hero Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8 max-w-4xl mx-auto"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 glass-premium rounded-full"
                >
                  <div className="flex items-center space-x-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0.3, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          color: ["#fbbf24", "#f59e0b", "#fbbf24"]
                        }}
                        transition={{ 
                          delay: 0.8 + index * 0.2,
                          duration: 0.6,
                          color: {
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }
                        }}
                      >
                        <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{t('hero.badge')}</span>
                </motion.div>

                {/* Main Title */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                  className="display-title text-gradient-premium"
                  style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                >
                  {t('hero.title')}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="lead-text max-w-2xl mx-auto"
                >
                  {t('hero.subtitle')}
                  {t('hero.description') && <span className="font-semibold text-primary">{t('hero.description')}</span>}
                </motion.p>

                {/* Enhanced Search */}
                <motion.div
                  id="search-section"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="space-y-6"
                >
                  <div className="max-w-3xl mx-auto">
                    <EnhancedSmartSearchV2 
                      onSearch={handleSearch}
                      placeholder={t('common.searchPlaceholder')}
                    />
                  </div>
                  
                  {/* Search Features */}
                  <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{t('hero.searchFeatures.realtime')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{t('hero.searchFeatures.priceComparison')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{t('hero.searchFeatures.whoisLookup')}</span>
                    </div>
                    
                  </div>
                </motion.div>

                {/* Popular TLDs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="space-y-4"
                >
                  
                  <div className="flex flex-wrap gap-3 justify-center">
                    {popularTLDs
                      .filter(tld => ['.com', '.net', '.org', '.ai', '.io', '.cn'].includes(tld.name))
                      .map((tld, index) => (
                      <motion.button
                        key={tld.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index + 0.7 }}
                        onClick={() => handleTLDClick(tld.name)}
                        className="group px-4 py-2 bg-card border border-border/50 rounded-lg hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-primary group-hover:text-primary/80">{tld.name}</span>
                          <span className="text-xs text-muted-foreground group-hover:text-foreground/80">{tld.price}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Stats Section - Moved to Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
              >
                <div className="text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">2000+</div>
                  <div className="text-sm text-muted-foreground">{t('hero.stats.supportedTlds')}</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">{t('hero.stats.registrarComparison')}</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">100万+</div>
                  <div className="text-sm text-muted-foreground">{t('hero.stats.domainQueries')}</div>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">{t('hero.stats.realtimeUpdates')}</div>
                </div>
              </motion.div>
            </div>
        </div>
        </HeroSpotlight>
      </section>

      {/* 智能助手功能说明 */}
      <LazySection className="section-padding bg-background">
        <div className="container-magazine">
          <div className="text-center content-spacing">
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('features.smartAssistant.badge')}</span>
              </div>
              <h2 className="section-title">{t('features.smartAssistant.title')}</h2>
              <p className="prose-lg max-w-2xl mx-auto">
                <span className="font-bold text-primary">{t('features.smartAssistant.subtitle')}</span> - {t('features.smartAssistant.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {memoizedAssistantFeatures.map((feature, index) => (
                <div key={feature.title} className="group">
                  <LightSpotlight>
                    <Card className="card-magazine h-full">
                      <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                          <feature.icon className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="card-title">{t(`features.smartAssistant.${feature.title === '智能域名搜索' ? 'smartSearch' : feature.title === '全网价格对比' ? 'priceComparison' : 'domainInfo'}.title`)}</CardTitle>
                      </CardHeader>
                      <CardContent className="text-center space-y-3">
                        <CardDescription className="prose">
                          {t(`features.smartAssistant.${feature.title === '智能域名搜索' ? 'smartSearch' : feature.title === '全网价格对比' ? 'priceComparison' : 'domainInfo'}.description`)}
                        </CardDescription>
                        <div className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                          {t(`features.smartAssistant.${feature.title === '智能域名搜索' ? 'smartSearch' : feature.title === '全网价格对比' ? 'priceComparison' : 'domainInfo'}.benefit`)}
                        </div>
                      </CardContent>
                    </Card>
                  </LightSpotlight>
                </div>
              ))}
            </div>
          </div>
        </div>
      </LazySection>

      {/* 简单流程 */}
      <section className="section-padding bg-muted/20">
        <div className="container-magazine">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="content-spacing"
          >
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full"
              >
                <ArrowRight className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{t('features.simpleProcess.badge')}</span>
              </motion.div>
              <h2 className="section-title">{t('features.simpleProcess.title')}</h2>
              <p className="prose-lg">
                {t('features.simpleProcess.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 * index }}
                  className="relative group"
                >
                  <CardSpotlight>
                    <Card className="card-magazine text-center h-full p-8">
                      <div className="space-y-6">
                        <div className="relative">
                          <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {step.step}
                          </div>
                          <div className="absolute -top-2 -right-2 w-10 h-10 bg-background border-2 border-border rounded-xl flex items-center justify-center">
                            <step.icon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="card-title">{t(`features.simpleProcess.steps.${step.title === '输入查询' ? 'search' : step.title === '获取信息' ? 'analyze' : 'register'}.title`)}</h3>
                          <p className="prose text-muted-foreground">
                            {t(`features.simpleProcess.steps.${step.title === '输入查询' ? 'search' : step.title === '获取信息' ? 'analyze' : 'register'}.description`)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </CardSpotlight>
                  
                  {/* Connector Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>


      {/* FAQ */}
      <section className="section-padding bg-background">
        <div className="container-magazine">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center space-y-6 mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20 rounded-full"
              >
                <Award className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('faq.badge')}</span>
              </motion.div>
              <h2 className="section-title">{t('faq.title')}</h2>
              <p className="prose-lg">
                {t('faq.description')}
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <CardSpotlight>
                    <Card className="overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full p-6 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                          <motion.div
                            animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          </motion.div>
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-0">
                              <div className="prose prose-sm max-w-none text-muted-foreground">
                                {faq.answer}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </CardSpotlight>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <h3 className="text-3xl font-bold">{t('cta.title')}</h3>
            <p className="text-lg text-muted-foreground">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="button-primary text-button text-lg px-8 py-3" onClick={scrollToSearch}>
                {t('cta.startSearch')}
                <Search className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 interactive" onClick={handleLearnMore}>
                {t('common.learnMore')}
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <span className="text-green-500 mr-1">✓</span>
                {t('cta.features.0')}
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-1">✓</span>
                {t('cta.features.1')}
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-1">✓</span>
                {t('cta.features.2')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* 品牌信息 */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <Link href="/" className="inline-block">
                  <NextNameLogo className="text-foreground hover:opacity-80 transition-opacity cursor-pointer" />
                </Link>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {t('footer.brandDescription')}
              </p>
            </div>
            
            {/* 产品功能 */}
            <div>
              <h4 className="font-semibold mb-4">产品功能</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/search" className="hover:text-primary transition-colors">域名可用性查询</a></li>
                <li><a href="/search" className="hover:text-primary transition-colors">价格对比分析</a></li>
                <li><a href="/search" className="hover:text-primary transition-colors">WHOIS信息查询</a></li>
                <li><a href="/tlds" className="hover:text-primary transition-colors">顶级域名大全</a></li>
                <li><a href="/search" className="hover:text-primary transition-colors">智能域名推荐</a></li>
              </ul>
            </div>
            
            {/* 帮助支持 */}
            <div>
              <h4 className="font-semibold mb-4">帮助支持</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-primary transition-colors">隐私政策</a></li>
                <li><a href="/terms" className="hover:text-primary transition-colors">服务条款</a></li>
              </ul>
            </div>
          </div>
          
          {/* 底部版权 */}
          <div className="border-t border-border/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-muted-foreground">
                © 2025 Next Name. 快&ldquo;全&rdquo;准的域名查询工具 - 为您提供最佳的域名搜索体验
              </p>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <a href="/privacy" className="hover:text-primary transition-colors">隐私政策</a>
                <a href="/terms" className="hover:text-primary transition-colors">服务条款</a>
                <a href="mailto:support@nextname.app" className="hover:text-primary transition-colors">support@nextname.app</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 回到顶部按钮 */}
      <ScrollToTop threshold={600} />
    </div>
  )
}
