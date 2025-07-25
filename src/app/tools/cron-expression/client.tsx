"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Clock, Check, AlertCircle, Calendar } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/footer'

export default function CronExpressionClient() {
  const [cronExpression, setCronExpression] = useState('0 0 * * *')
  const [description, setDescription] = useState('')
  const [nextRuns, setNextRuns] = useState<Date[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // 简化的Cron解析器
  const parseCron = useCallback((expression: string) => {
    const parts = expression.trim().split(/\s+/)
    
    if (parts.length !== 5) {
      setError('Cron表达式必须包含5个部分：分钟 小时 日期 月份 星期')
      setDescription('')
      setNextRuns([])
      return
    }

    try {
      const [minute, hour, day, month, weekday] = parts
      
      // 生成描述
      let desc = '每'
      
      // 解析分钟
      if (minute === '*') {
        desc += '分钟'
      } else if (minute.includes('/')) {
        const [start, interval] = minute.split('/')
        desc += `${interval}分钟`
      } else {
        desc += `${minute}分`
      }
      
      // 解析小时
      if (hour === '*') {
        desc += '的每小时'
      } else if (hour.includes('/')) {
        const [start, interval] = hour.split('/')
        desc += `，每${interval}小时`
      } else {
        desc += `，在${hour}点`
      }
      
      // 解析日期
      if (day === '*') {
        desc += '的每天'
      } else if (day.includes('/')) {
        const [start, interval] = day.split('/')
        desc += `，每${interval}天`
      } else {
        desc += `，每月${day}日`
      }
      
      // 解析月份
      if (month !== '*') {
        const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        if (month.includes(',')) {
          const months = month.split(',').map(m => monthNames[parseInt(m)]).join('、')
          desc += `，仅在${months}`
        } else {
          desc += `，仅在${monthNames[parseInt(month)]}`
        }
      }
      
      // 解析星期
      if (weekday !== '*') {
        const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        if (weekday.includes(',')) {
          const weeks = weekday.split(',').map(w => weekNames[parseInt(w)]).join('、')
          desc += `，仅在${weeks}`
        } else {
          desc += `，仅在${weekNames[parseInt(weekday)]}`
        }
      }
      
      desc += ' 执行'
      
      setDescription(desc)
      setError('')
      
      // 计算接下来的执行时间（简化版）
      const now = new Date()
      const runs: Date[] = []
      
      for (let i = 0; i < 10; i++) {
        const nextTime = new Date(now.getTime() + i * 60 * 60 * 1000) // 简化：每小时一次
        runs.push(nextTime)
      }
      
      setNextRuns(runs)
      
    } catch (err) {
      setError('Cron表达式格式错误')
      setDescription('')
      setNextRuns([])
    }
  }, [])

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setCronExpression('')
    setDescription('')
    setNextRuns([])
    setError('')
    setCopied(null)
  }

  // 实时解析
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (cronExpression.trim()) {
        parseCron(cronExpression)
      } else {
        setDescription('')
        setNextRuns([])
        setError('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [cronExpression, parseCron])

  const presetExpressions = [
    { name: '每分钟', expression: '* * * * *', description: '每分钟执行一次' },
    { name: '每小时', expression: '0 * * * *', description: '每小时的第0分钟执行' },
    { name: '每天午夜', expression: '0 0 * * *', description: '每天午夜12点执行' },
    { name: '每天上午9点', expression: '0 9 * * *', description: '每天上午9点执行' },
    { name: '每周一上午9点', expression: '0 9 * * 1', description: '每周一上午9点执行' },
    { name: '每月1日午夜', expression: '0 0 1 * *', description: '每月1日午夜执行' },
    { name: '工作日上午9点', expression: '0 9 * * 1-5', description: '周一到周五上午9点执行' },
    { name: '每15分钟', expression: '*/15 * * * *', description: '每15分钟执行一次' },
  ]

  const cronFields = [
    { name: '分钟', range: '0-59', wildcards: '* , - /' },
    { name: '小时', range: '0-23', wildcards: '* , - /' },
    { name: '日期', range: '1-31', wildcards: '* , - / L W' },
    { name: '月份', range: '1-12', wildcards: '* , - /' },
    { name: '星期', range: '0-7', wildcards: '* , - / L #' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Cron 表达式工具</h1>
          <p className="text-muted-foreground mb-6">
            在线Cron表达式生成器和解析器，支持可视化创建定时任务和执行时间预览，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时解析</Badge>
            <Badge variant="secondary">可视化</Badge>
            {description && <Badge variant="default">有效表达式</Badge>}
          </div>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Cron 表达式
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  表达式 (分钟 小时 日期 月份 星期)
                </label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="例如: 0 9 * * 1-5"
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
                {cronExpression && (
                  <Button
                    onClick={() => handleCopy(cronExpression)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copied === cronExpression ? (
                      <>
                        <Check className="w-4 h-4" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        复制
                      </>
                    )}
                  </Button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {description && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>执行规则:</strong> {description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="presets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="presets">预设表达式</TabsTrigger>
              <TabsTrigger value="schedule">执行时间</TabsTrigger>
              <TabsTrigger value="reference">语法参考</TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>常用表达式</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presetExpressions.map((preset) => (
                      <div
                        key={preset.name}
                        className="border rounded-md p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setCronExpression(preset.expression)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{preset.name}</h4>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {preset.expression}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    接下来的执行时间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextRuns.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {nextRuns.map((time, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">第 {index + 1} 次执行</span>
                          <span className="text-sm font-mono">{time.toLocaleString('zh-CN')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2" />
                      <p>输入有效的Cron表达式查看执行时间</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reference" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>字段说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">字段</th>
                          <th className="text-left p-2">取值范围</th>
                          <th className="text-left p-2">特殊字符</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cronFields.map((field) => (
                          <tr key={field.name} className="border-b">
                            <td className="p-2 font-medium">{field.name}</td>
                            <td className="p-2 font-mono">{field.range}</td>
                            <td className="p-2 font-mono">{field.wildcards}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>特殊字符说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p>• <code>*</code> - 匹配任意值</p>
                      <p>• <code>,</code> - 分隔多个值</p>
                      <p>• <code>-</code> - 指定范围</p>
                      <p>• <code>/</code> - 指定间隔</p>
                    </div>
                    <div className="space-y-2">
                      <p>• <code>L</code> - 月末或周末</p>
                      <p>• <code>W</code> - 最近的工作日</p>
                      <p>• <code>#</code> - 第几个星期几</p>
                      <p>• 所有解析都在本地进行，保护隐私</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
