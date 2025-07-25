"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Check, AlertCircle, Minimize2, Maximize2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

export default function JsonFormatterClient() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'format' | 'minify'>('format')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const handleFormat = useCallback(() => {
    setError('')
    setIsValid(null)
    
    if (!input.trim()) {
      setOutput('')
      return
    }

    try {
      const parsed = JSON.parse(input)
      setIsValid(true)
      
      if (mode === 'format') {
        // 格式化：美化JSON
        const formatted = JSON.stringify(parsed, null, 2)
        setOutput(formatted)
      } else {
        // 压缩：最小化JSON
        const minified = JSON.stringify(parsed)
        setOutput(minified)
      }
    } catch (err) {
      setIsValid(false)
      setError('JSON格式错误：' + (err as Error).message)
      setOutput('')
    }
  }, [input, mode])

  const handleCopy = async () => {
    if (!output) return
    
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
    setIsValid(null)
  }

  const handleSwitchMode = () => {
    setMode(mode === 'format' ? 'minify' : 'format')
    if (output) {
      setInput(output)
      setOutput('')
    }
  }

  // 实时格式化
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleFormat()
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [handleFormat])

  const getStatusBadge = () => {
    if (isValid === null) return null
    if (isValid) {
      return <Badge variant="default" className="bg-green-500">有效的JSON</Badge>
    } else {
      return <Badge variant="destructive">无效的JSON</Badge>
    }
  }

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">JSON 格式化工具</h1>
          <p className="text-muted-foreground mb-6">
            在线JSON格式化、验证和压缩工具，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时验证</Badge>
            <Badge variant="secondary">格式化/压缩</Badge>
            {getStatusBadge()}
          </div>
        </motion.div>

        {/* Tool Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                输入JSON
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwitchMode}
                    className="flex items-center gap-2"
                  >
                    {mode === 'format' ? (
                      <>
                        <Minimize2 className="w-4 h-4" />
                        压缩
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-4 h-4" />
                        格式化
                      </>
                    )}
                  </Button>
                  <Button onClick={handleClear} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入JSON数据..."
                className="w-full h-96 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {mode === 'format' ? '格式化结果' : '压缩结果'}
                {output && (
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copied ? (
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-destructive">
                    <div className="font-medium mb-1">JSON解析错误</div>
                    <div className="text-xs">{error}</div>
                  </div>
                </div>
              ) : (
                <textarea
                  value={output}
                  readOnly
                  placeholder={mode === 'format' ? '格式化后的JSON将显示在这里...' : '压缩后的JSON将显示在这里...'}
                  className="w-full h-96 p-3 border rounded-md resize-none bg-muted/50 font-mono text-sm"
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features & Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>功能特性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">实时JSON验证</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">美化格式化</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">压缩最小化</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">错误提示</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm">本地处理</span>
              </div>
            </CardContent>
          </Card>

          {/* Example */}
          <Card>
            <CardHeader>
              <CardTitle>示例JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setInput('{"name":"张三","age":25,"city":"北京","hobbies":["读书","旅行","编程"],"address":{"street":"中关村大街","number":123}}')}
                className="w-full mb-3"
              >
                加载示例数据
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 支持嵌套对象和数组</p>
                <p>• 自动检测JSON语法错误</p>
                <p>• 保持数据类型不变</p>
                <p>• 所有处理都在本地进行</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
