"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, ArrowUpDown, Check, AlertCircle, Link } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

export default function UrlEncoderClient() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [encodingType, setEncodingType] = useState<'full' | 'component'>('component')
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
        // 编码
        if (encodingType === 'full') {
          // 完整URL编码
          setOutput(encodeURI(input))
        } else {
          // URL组件编码
          setOutput(encodeURIComponent(input))
        }
      } else {
        // 解码
        try {
          setOutput(decodeURIComponent(input))
        } catch {
          // 如果组件解码失败，尝试完整URL解码
          setOutput(decodeURI(input))
        }
      }
    } catch (err) {
      setError(mode === 'encode' ? '编码失败，请检查输入内容' : '解码失败，请检查URL格式是否正确')
      setOutput('')
    }
  }, [input, mode, encodingType])

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

  const examples = [
    {
      title: '中文URL',
      original: 'https://example.com/搜索?q=测试',
      encoded: 'https://example.com/%E6%90%9C%E7%B4%A2?q=%E6%B5%8B%E8%AF%95'
    },
    {
      title: '特殊字符',
      original: 'hello world!@#$%^&*()',
      encoded: 'hello%20world!%40%23%24%25%5E%26*()' 
    }
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">URL 编解码工具</h1>
          <p className="text-muted-foreground mb-6">
            在线URL编码解码工具，支持完整URL和URL组件编码，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">实时转换</Badge>
            <Badge variant="secondary">{encodingType === 'full' ? '完整URL' : 'URL组件'}</Badge>
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
                  <Link className="w-5 h-5" />
                  {mode === 'encode' ? 'URL编码' : 'URL解码'}
                </CardTitle>
                <div className="flex gap-2">
                  {mode === 'encode' && (
                    <div className="flex gap-1">
                      <Button
                        variant={encodingType === 'component' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEncodingType('component')}
                      >
                        组件编码
                      </Button>
                      <Button
                        variant={encodingType === 'full' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEncodingType('full')}
                      >
                        完整URL
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSwapMode}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    切换模式
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {mode === 'encode' ? '输入URL或文本' : '输入编码后的URL'}
                </label>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'encode' ? '请输入要编码的URL或文本...' : '请输入要解码的URL...'}
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
                    {mode === 'encode' ? '编码结果' : '解码结果'}
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
                  placeholder={mode === 'encode' ? '编码结果将显示在这里...' : '解码结果将显示在这里...'}
                  className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50"
                />
              </div>

              {/* Info */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <strong>URL组件编码</strong>：适用于URL参数值、路径片段等</p>
                <p>• <strong>完整URL编码</strong>：保留URL结构字符（如://、?、&等）</p>
                <p>• 所有转换都在您的浏览器本地进行，不会上传到服务器</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>编码示例</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {examples.map((example, index) => (
                <div key={index} className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">{example.title}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">原始:</span>
                      <div className="bg-muted p-2 rounded mt-1 font-mono break-all">
                        {example.original}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">编码:</span>
                      <div className="bg-muted p-2 rounded mt-1 font-mono break-all">
                        {example.encoded}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setInput(example.original)}
                  >
                    试试这个例子
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Footer />
    </div>
  )
}
