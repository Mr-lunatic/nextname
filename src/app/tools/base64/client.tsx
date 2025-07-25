"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, ArrowUpDown, Check, AlertCircle } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

export default function Base64ToolClient() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleConvert = useCallback(() => {
    setError('')
    
    if (!input.trim()) {
      setOutput('')
      return
    }

    try {
      if (mode === 'encode') {
        // 编码：文本 -> Base64
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
      } else {
        // 解码：Base64 -> 文本
        const decoded = decodeURIComponent(escape(atob(input)))
        setOutput(decoded)
      }
    } catch (err) {
      setError(mode === 'encode' ? '编码失败，请检查输入内容' : '解码失败，请检查Base64格式是否正确')
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
  }

  const handleSwapMode = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setInput(output)
    setOutput('')
    setError('')
  }

  // 实时转换
  React.useEffect(() => {
    handleConvert()
  }, [handleConvert])

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Base64 转换器</h1>
          <p className="text-muted-foreground mb-6">
            安全的在线Base64编码解码工具，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">实时转换</Badge>
          </div>
        </motion.div>

        {/* Tool Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  {mode === 'encode' ? '文本编码为Base64' : 'Base64解码为文本'}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwapMode}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  切换模式
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {mode === 'encode' ? '输入文本' : '输入Base64'}
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'encode' ? '请输入要编码的文本...' : '请输入要解码的Base64字符串...'}
                  className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {/* Output */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    {mode === 'encode' ? 'Base64结果' : '解码结果'}
                  </label>
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
                </div>
                <textarea
                  value={output}
                  readOnly
                  placeholder={mode === 'encode' ? 'Base64编码结果将显示在这里...' : '解码后的文本将显示在这里...'}
                  className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50"
                />
              </div>

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Base64是一种基于64个可打印字符来表示二进制数据的表示方法</p>
                <p>• 常用于在HTTP环境下传递较长的标识信息</p>
                <p>• 所有转换都在您的浏览器本地进行，不会上传到服务器</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>使用示例</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">编码示例</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>输入:</strong> Hello World!</p>
                    <p><strong>输出:</strong> SGVsbG8gV29ybGQh</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">解码示例</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>输入:</strong> SGVsbG8gV29ybGQh</p>
                    <p><strong>输出:</strong> Hello World!</p>
                  </div>
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
