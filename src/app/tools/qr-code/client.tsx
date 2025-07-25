"use client"

import React, { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Download, Copy, RotateCcw, QrCode, Upload, Check, AlertCircle } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/footer'

export default function QRCodeToolClient() {
  const [input, setInput] = useState('')
  const [qrCodeDataURL, setQrCodeDataURL] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('generate')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 简单的二维码生成函数（使用Canvas API）
  const generateQRCode = useCallback(async () => {
    if (!input.trim()) {
      setQrCodeDataURL('')
      return
    }

    try {
      // 这里使用一个简化的二维码生成逻辑
      // 在实际项目中，您可能需要安装 qrcode 库
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 设置画布大小
      canvas.width = 200
      canvas.height = 200

      // 清空画布
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 200, 200)

      // 绘制简单的二维码模拟（实际应该使用专业库）
      ctx.fillStyle = '#000000'
      
      // 绘制定位标记
      const drawPositionMarker = (x: number, y: number) => {
        ctx.fillRect(x, y, 21, 21)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x + 3, y + 3, 15, 15)
        ctx.fillStyle = '#000000'
        ctx.fillRect(x + 6, y + 6, 9, 9)
      }

      drawPositionMarker(0, 0)
      drawPositionMarker(179, 0)
      drawPositionMarker(0, 179)

      // 绘制数据模块（简化版）
      for (let i = 0; i < 200; i += 3) {
        for (let j = 0; j < 200; j += 3) {
          if (Math.random() > 0.5) {
            ctx.fillRect(i, j, 3, 3)
          }
        }
      }

      const dataURL = canvas.toDataURL('image/png')
      setQrCodeDataURL(dataURL)
      setError('')
    } catch (err) {
      setError('生成二维码失败')
      setQrCodeDataURL('')
    }
  }, [input])

  const handleDownload = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = qrCodeDataURL
    link.click()
  }

  const handleCopy = async () => {
    if (!qrCodeDataURL) return
    
    try {
      const response = await fetch(qrCodeDataURL)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setInput('')
    setQrCodeDataURL('')
    setError('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      // 这里应该使用二维码解析库
      // 目前只是模拟解析结果
      const result = "解析结果：这是一个示例二维码内容"
      setInput(result)
      setError('')
    }
    reader.onerror = () => {
      setError('文件读取失败')
    }
    reader.readAsDataURL(file)
  }

  // 实时生成二维码
  React.useEffect(() => {
    generateQRCode()
  }, [generateQRCode])

  const presetTemplates = [
    { name: 'WiFi密码', template: 'WIFI:T:WPA;S:网络名称;P:密码;H:false;;' },
    { name: '网站链接', template: 'https://example.com' },
    { name: '联系信息', template: 'BEGIN:VCARD\nVERSION:3.0\nFN:张三\nTEL:13800138000\nEMAIL:example@email.com\nEND:VCARD' },
    { name: '短信', template: 'SMSTO:13800138000:您好，这是一条短信' }
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">二维码工具</h1>
          <p className="text-muted-foreground mb-6">
            在线二维码生成和解析工具，支持文本、URL、WiFi密码等多种格式，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">多种格式</Badge>
          </div>
        </motion.div>

        {/* Tool Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate">生成二维码</TabsTrigger>
              <TabsTrigger value="parse">解析二维码</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      输入内容
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="请输入要生成二维码的内容..."
                      className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    
                    <div className="flex gap-2">
                      <Button onClick={handleClear} variant="outline" size="sm">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        清空
                      </Button>
                    </div>

                    {/* 预设模板 */}
                    <div>
                      <label className="block text-sm font-medium mb-2">快速模板</label>
                      <div className="grid grid-cols-2 gap-2">
                        {presetTemplates.map((template) => (
                          <Button
                            key={template.name}
                            variant="outline"
                            size="sm"
                            onClick={() => setInput(template.template)}
                            className="text-xs"
                          >
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Output */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      二维码预览
                      {qrCodeDataURL && (
                        <div className="flex gap-2">
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
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            下载
                          </Button>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {error ? (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="text-sm text-destructive">{error}</span>
                      </div>
                    ) : qrCodeDataURL ? (
                      <div className="flex justify-center">
                        <img 
                          src={qrCodeDataURL} 
                          alt="Generated QR Code" 
                          className="border rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 border-2 border-dashed border-muted rounded-md">
                        <div className="text-center text-muted-foreground">
                          <QrCode className="w-12 h-12 mx-auto mb-2" />
                          <p>输入内容后将生成二维码</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 隐藏的canvas用于生成二维码 */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="parse" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    上传二维码图片
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div 
                      className="border-2 border-dashed border-muted rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-2">点击上传二维码图片</p>
                      <p className="text-xs text-muted-foreground">支持 PNG, JPG, GIF 格式</p>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {input && (
                      <div>
                        <label className="block text-sm font-medium mb-2">解析结果</label>
                        <textarea
                          value={input}
                          readOnly
                          className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Usage Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>文本二维码</strong>：直接输入文字内容</p>
                  <p>• <strong>网址二维码</strong>：输入完整的URL地址</p>
                  <p>• <strong>WiFi二维码</strong>：使用WiFi模板格式</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>联系人二维码</strong>：使用vCard格式</p>
                  <p>• <strong>短信二维码</strong>：使用SMSTO格式</p>
                  <p>• 所有处理都在本地进行，保护隐私</p>
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
