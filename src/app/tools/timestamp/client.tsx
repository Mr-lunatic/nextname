"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Clock, Calendar, Check } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

export default function TimestampToolClient() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [timestampInput, setTimestampInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [timeInput, setTimeInput] = useState('')
  const [timestampResult, setTimestampResult] = useState('')
  const [dateResult, setDateResult] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // 时间戳转日期
  const convertTimestampToDate = useCallback((timestamp: string) => {
    if (!timestamp.trim()) {
      setDateResult('')
      return
    }

    try {
      let ts = parseInt(timestamp)
      
      // 自动检测时间戳格式（秒或毫秒）
      if (ts.toString().length === 10) {
        ts = ts * 1000 // 转换为毫秒
      }
      
      const date = new Date(ts)
      
      if (isNaN(date.getTime())) {
        setDateResult('无效的时间戳')
        return
      }

      const formats = {
        'ISO 8601': date.toISOString(),
        '本地时间': date.toLocaleString('zh-CN'),
        'UTC时间': date.toUTCString(),
        '日期': date.toLocaleDateString('zh-CN'),
        '时间': date.toLocaleTimeString('zh-CN'),
        '年月日': date.getFullYear() + '-' + 
                 String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(date.getDate()).padStart(2, '0'),
        '时分秒': String(date.getHours()).padStart(2, '0') + ':' + 
                 String(date.getMinutes()).padStart(2, '0') + ':' + 
                 String(date.getSeconds()).padStart(2, '0')
      }

      setDateResult(Object.entries(formats).map(([format, value]) => 
        `${format}: ${value}`
      ).join('\n'))
    } catch (error) {
      setDateResult('转换失败')
    }
  }, [])

  // 日期转时间戳
  const convertDateToTimestamp = useCallback((dateStr: string, timeStr: string) => {
    if (!dateStr.trim()) {
      setTimestampResult('')
      return
    }

    try {
      let dateTimeStr = dateStr
      if (timeStr.trim()) {
        dateTimeStr += ' ' + timeStr
      }

      const date = new Date(dateTimeStr)
      
      if (isNaN(date.getTime())) {
        setTimestampResult('无效的日期格式')
        return
      }

      const timestamp = date.getTime()
      const timestampSeconds = Math.floor(timestamp / 1000)

      const results = {
        '毫秒时间戳': timestamp.toString(),
        '秒时间戳': timestampSeconds.toString(),
        'ISO 8601': date.toISOString(),
        '本地时间': date.toLocaleString('zh-CN'),
        'UTC时间': date.toUTCString()
      }

      setTimestampResult(Object.entries(results).map(([format, value]) => 
        `${format}: ${value}`
      ).join('\n'))
    } catch (error) {
      setTimestampResult('转换失败')
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
    setTimestampInput('')
    setDateInput('')
    setTimeInput('')
    setTimestampResult('')
    setDateResult('')
    setCopied(null)
  }

  const setCurrentTimestamp = () => {
    const now = Date.now()
    setTimestampInput(now.toString())
  }

  const setCurrentDate = () => {
    const now = new Date()
    setDateInput(now.toISOString().split('T')[0])
    setTimeInput(now.toTimeString().split(' ')[0])
  }

  // 实时转换
  useEffect(() => {
    convertTimestampToDate(timestampInput)
  }, [timestampInput, convertTimestampToDate])

  useEffect(() => {
    convertDateToTimestamp(dateInput, timeInput)
  }, [dateInput, timeInput, convertDateToTimestamp])

  const quickTimestamps = [
    { name: '当前时间', value: () => Date.now().toString() },
    { name: '今天开始', value: () => new Date(new Date().setHours(0,0,0,0)).getTime().toString() },
    { name: '明天开始', value: () => new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0,0,0,0).toString() },
    { name: '一周后', value: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime().toString() },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-primary)' }}>
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">时间戳转换器</h1>
          <p className="text-muted-foreground mb-6">
            Unix时间戳与日期时间互转工具，支持多种时间格式，所有转换都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时转换</Badge>
            <Badge variant="secondary">多种格式</Badge>
          </div>
        </motion.div>

        {/* Current Time Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                当前时间
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>本地时间:</strong> {currentTime.toLocaleString('zh-CN')}</p>
                  <p><strong>UTC时间:</strong> {currentTime.toUTCString()}</p>
                </div>
                <div>
                  <p><strong>毫秒时间戳:</strong> {currentTime.getTime()}</p>
                  <p><strong>秒时间戳:</strong> {Math.floor(currentTime.getTime() / 1000)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Conversion Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timestamp to Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  时间戳转日期
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    输入时间戳（秒或毫秒）
                  </label>
                  <input
                    type="text"
                    value={timestampInput}
                    onChange={(e) => setTimestampInput(e.target.value)}
                    placeholder="例如: 1640995200 或 1640995200000"
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button onClick={setCurrentTimestamp} variant="outline" size="sm">
                    当前时间戳
                  </Button>
                  {quickTimestamps.map((item) => (
                    <Button
                      key={item.name}
                      onClick={() => setTimestampInput(item.value())}
                      variant="outline"
                      size="sm"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>

                {dateResult && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">转换结果</label>
                      <Button
                        onClick={() => handleCopy(dateResult)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {copied === dateResult ? (
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
                    </div>
                    <textarea
                      value={dateResult}
                      readOnly
                      className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50 text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Date to Timestamp */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  日期转时间戳
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    选择日期
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    选择时间（可选）
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={setCurrentDate} variant="outline" size="sm">
                    当前日期时间
                  </Button>
                </div>

                {timestampResult && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">转换结果</label>
                      <Button
                        onClick={() => handleCopy(timestampResult)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {copied === timestampResult ? (
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
                    </div>
                    <textarea
                      value={timestampResult}
                      readOnly
                      className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50 text-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Clear Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <Button onClick={handleClear} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            清空所有
          </Button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>时间戳说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>Unix时间戳</strong>：从1970年1月1日开始的秒数</p>
                  <p>• <strong>毫秒时间戳</strong>：从1970年1月1日开始的毫秒数</p>
                  <p>• <strong>自动识别</strong>：10位数字为秒，13位为毫秒</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>时区</strong>：本地时间使用浏览器时区</p>
                  <p>• <strong>格式</strong>：支持多种日期时间格式</p>
                  <p>• 所有转换都在本地进行，保护隐私</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
