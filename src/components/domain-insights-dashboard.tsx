"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Globe, 
  Star, 
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
  Award,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PricingTrend {
  tld: string
  currentPrice: number
  change: number
  trend: 'up' | 'down' | 'stable'
  volume: number
  popularity: number
}

interface MarketInsight {
  title: string
  value: string
  change: string
  trend: 'positive' | 'negative' | 'neutral'
  description: string
  icon: any
}

const mockPricingData: PricingTrend[] = [
  { tld: '.com', currentPrice: 12.99, change: 2.5, trend: 'up', volume: 15420, popularity: 95 },
  { tld: '.ai', currentPrice: 89.99, change: -5.2, trend: 'down', volume: 3200, popularity: 88 },
  { tld: '.io', currentPrice: 64.99, change: 1.8, trend: 'up', volume: 2100, popularity: 82 },
  { tld: '.dev', currentPrice: 17.99, change: 0.5, trend: 'stable', volume: 1890, popularity: 76 },
  { tld: '.app', currentPrice: 19.99, change: 3.2, trend: 'up', volume: 1650, popularity: 71 },
  { tld: '.cloud', currentPrice: 24.99, change: -1.2, trend: 'down', volume: 980, popularity: 68 }
]

const marketInsights: MarketInsight[] = [
  {
    title: "Domain Registrations",
    value: "2.3M",
    change: "+12.5%",
    trend: "positive",
    description: "New domains registered this month",
    icon: Globe
  },
  {
    title: "Average Price",
    value: "$34.67",
    change: "+2.8%",
    trend: "positive", 
    description: "Across all TLD categories",
    icon: DollarSign
  },
  {
    title: "Market Growth",
    value: "18.4%",
    change: "+4.2%",
    trend: "positive",
    description: "Year-over-year expansion",
    icon: TrendingUp
  },
  {
    title: "Premium Domains",
    value: "156K",
    change: "-2.1%",
    trend: "negative",
    description: "Available premium names",
    icon: Star
  }
]

const trendingCategories = [
  { name: "AI & Technology", growth: 284, color: "from-purple-500 to-pink-500" },
  { name: "Cryptocurrency", growth: 189, color: "from-blue-500 to-cyan-500" },
  { name: "E-commerce", growth: 156, color: "from-green-500 to-emerald-500" },
  { name: "Health Tech", growth: 134, color: "from-orange-500 to-red-500" },
  { name: "Gaming", growth: 98, color: "from-indigo-500 to-purple-500" }
]

export function DomainInsightsDashboard() {
  const [selectedTLD, setSelectedTLD] = useState<string | null>(null)
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Domain Market Intelligence</span>
        </div>
        <h2 className="section-title text-gradient-premium">Market Insights & Trends</h2>
        <p className="lead-text max-w-3xl mx-auto">
          Real-time analysis of domain pricing, market trends, and registration patterns across the global domain marketplace.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {marketInsights.map((insight, index) => (
          <motion.div
            key={insight.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            className="stat-card group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <insight.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">{insight.title}</span>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-gradient-premium">{insight.value}</div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    insight.trend === 'positive' ? 'text-green-600' : 
                    insight.trend === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {insight.trend === 'positive' && <TrendingUp className="h-3 w-3" />}
                    {insight.trend === 'negative' && <TrendingDown className="h-3 w-3" />}
                    <span className="font-medium">{insight.change}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{insight.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* TLD Pricing Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Pricing Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="card-title flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>TLD Pricing Trends</span>
            </h3>
            <Badge variant="secondary" className="text-xs">Live Data</Badge>
          </div>
          
          <Card className="card-magazine overflow-hidden">
            <CardContent className="p-0">
              <div className="space-y-0">
                {mockPricingData.map((item, index) => (
                  <motion.div
                    key={item.tld}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => setSelectedTLD(selectedTLD === item.tld ? null : item.tld)}
                    className={`p-4 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-all duration-200 ${
                      selectedTLD === item.tld ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="font-mono text-lg font-semibold text-primary">
                          {item.tld}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.trend === 'up' ? 'bg-green-500' : 
                            item.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-sm text-muted-foreground">
                            {formatNumber(item.volume)} searches
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {formatCurrency(item.currentPrice)}
                          </div>
                          <div className={`flex items-center text-sm ${
                            item.change > 0 ? 'text-green-600' : 
                            item.change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {item.change > 0 && <TrendingUp className="h-3 w-3 mr-1" />}
                            {item.change < 0 && <TrendingDown className="h-3 w-3 mr-1" />}
                            {Math.abs(item.change)}%
                          </div>
                        </div>
                        
                        <div className="w-16 h-8 bg-muted rounded-lg relative overflow-hidden">
                          <motion.div
                            key={`${item.tld}-${animationKey}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.popularity}%` }}
                            transition={{ duration: 1, delay: 0.1 * index }}
                            className={`h-full bg-gradient-to-r ${
                              item.trend === 'up' ? 'from-green-500 to-emerald-400' :
                              item.trend === 'down' ? 'from-red-500 to-rose-400' :
                              'from-gray-500 to-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {selectedTLD === item.tld && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-border/50"
                        >
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Popularity:</span>
                              <div className="font-semibold">{item.popularity}%</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Volume:</span>
                              <div className="font-semibold">{formatNumber(item.volume)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trend:</span>
                              <div className="font-semibold capitalize">{item.trend}</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Categories */}
        <div className="space-y-6">
          <div>
            <h3 className="card-title flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <span>Trending Categories</span>
            </h3>
            
            <Card className="card-magazine">
              <CardContent className="p-4 space-y-4">
                {trendingCategories.map((category, index) => (
                  <motion.div
                    key={category.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{category.name}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-semibold text-green-600">+{category.growth}%</span>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <motion.div
                        key={`category-${index}-${animationKey}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(category.growth / 3, 100)}%` }}
                        transition={{ duration: 1, delay: 0.2 * index }}
                        className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Market Summary */}
          <Card className="card-magazine">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <span>Market Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most Popular</span>
                  <Badge variant="secondary" className="font-mono">.com</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fastest Growing</span>
                  <Badge variant="secondary" className="font-mono">.ai</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Best Value</span>
                  <Badge variant="secondary" className="font-mono">.dev</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Premium Choice</span>
                  <Badge variant="secondary" className="font-mono">.io</Badge>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>Updated every 5 minutes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}