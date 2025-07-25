"use client"

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, RotateCcw, Image as ImageIcon, Settings } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Footer } from '@/components/footer'

interface ImageInfo {
  name: string
  size: number
  type: string
  width: number
  height: number
  dataUrl: string
}

export default function ImageConverterClient() {
  const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null)
  const [convertedImage, setConvertedImage] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg')
  const [quality, setQuality] = useState(90)
  const [maxWidth, setMaxWidth] = useState(0)
  const [maxHeight, setMaxHeight] = useState(0)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const imageInfo: ImageInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          width: img.width,
          height: img.height,
          dataUrl: e.target?.result as string
        }
        setOriginalImage(imageInfo)
        setMaxWidth(img.width)
        setMaxHeight(img.height)
        setConvertedImage(null)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const convertImage = async () => {
    if (!originalImage || !canvasRef.current) return

    setIsConverting(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        // 计算新尺寸
        let newWidth = maxWidth || img.width
        let newHeight = maxHeight || img.height

        // 保持宽高比
        if (maxWidth && maxHeight) {
          const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
          newWidth = img.width * ratio
          newHeight = img.height * ratio
        } else if (maxWidth) {
          const ratio = maxWidth / img.width
          newHeight = img.height * ratio
        } else if (maxHeight) {
          const ratio = maxHeight / img.height
          newWidth = img.width * ratio
        }

        // 设置画布尺寸
        canvas.width = newWidth
        canvas.height = newHeight

        // 绘制图片
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // 转换格式
        const mimeType = `image/${outputFormat}`
        const qualityValue = outputFormat === 'png' ? undefined : quality / 100
        const dataUrl = canvas.toDataURL(mimeType, qualityValue)
        
        setConvertedImage(dataUrl)
        setIsConverting(false)
      }
      img.src = originalImage.dataUrl
    } catch (error) {
      console.error('转换失败:', error)
      setIsConverting(false)
    }
  }

  const downloadImage = () => {
    if (!convertedImage || !originalImage) return

    const link = document.createElement('a')
    const fileName = originalImage.name.replace(/\.[^/.]+$/, '') + '.' + outputFormat
    link.download = fileName
    link.href = convertedImage
    link.click()
  }

  const handleClear = () => {
    setOriginalImage(null)
    setConvertedImage(null)
    setMaxWidth(0)
    setMaxHeight(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getConvertedSize = (): string => {
    if (!convertedImage) return '0 Bytes'
    // 估算Base64数据的大小
    const base64Length = convertedImage.split(',')[1]?.length || 0
    const sizeInBytes = (base64Length * 3) / 4
    return formatFileSize(sizeInBytes)
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">图片转换器</h1>
          <p className="text-muted-foreground mb-6">
            在线图片格式转换工具，支持JPG、PNG、WebP等多种格式互转，调整图片质量和尺寸，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">多格式支持</Badge>
            <Badge variant="secondary">尺寸调整</Badge>
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                上传图片
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!originalImage ? (
                <div 
                  className="border-2 border-dashed border-muted rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">点击上传图片或拖拽图片到此处</p>
                  <p className="text-xs text-muted-foreground">支持 JPG, PNG, WebP, GIF 格式</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{originalImage.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {originalImage.width} × {originalImage.height} | {formatFileSize(originalImage.size)}
                      </p>
                    </div>
                    <Button onClick={handleClear} variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重新选择
                    </Button>
                  </div>
                  <div className="max-w-md mx-auto">
                    <img 
                      src={originalImage.dataUrl} 
                      alt="原图预览" 
                      className="w-full h-auto border rounded-md"
                    />
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        {originalImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  转换设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Output Format */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    输出格式
                  </label>
                  <div className="flex gap-2">
                    {(['jpeg', 'png', 'webp'] as const).map((format) => (
                      <Button
                        key={format}
                        variant={outputFormat === format ? 'default' : 'outline'}
                        onClick={() => setOutputFormat(format)}
                        className="uppercase"
                      >
                        {format}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                {outputFormat !== 'png' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">图片质量: {quality}%</label>
                    </div>
                    <Slider
                      value={[quality]}
                      onValueChange={(value) => setQuality(value[0])}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Dimensions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      最大宽度 (像素)
                    </label>
                    <input
                      type="number"
                      value={maxWidth || ''}
                      onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)}
                      placeholder={`原始: ${originalImage.width}`}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      最大高度 (像素)
                    </label>
                    <input
                      type="number"
                      value={maxHeight || ''}
                      onChange={(e) => setMaxHeight(parseInt(e.target.value) || 0)}
                      placeholder={`原始: ${originalImage.height}`}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                <Button 
                  onClick={convertImage} 
                  disabled={isConverting}
                  className="w-full"
                >
                  {isConverting ? '转换中...' : '开始转换'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Result */}
        {convertedImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>转换结果</CardTitle>
                  <Button onClick={downloadImage} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    下载图片
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>格式: {outputFormat.toUpperCase()}</p>
                    <p>大小: {getConvertedSize()}</p>
                    {outputFormat !== 'png' && <p>质量: {quality}%</p>}
                  </div>
                  <div className="max-w-md mx-auto">
                    <img 
                      src={convertedImage} 
                      alt="转换结果" 
                      className="w-full h-auto border rounded-md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>支持的格式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>JPEG</strong>：适合照片，文件小</p>
                  <p>• <strong>PNG</strong>：支持透明，无损压缩</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>WebP</strong>：现代格式，压缩率高</p>
                  <p>• 支持调整图片质量和尺寸</p>
                </div>
                <div className="space-y-2">
                  <p>• 所有转换都在本地进行</p>
                  <p>• 不会上传图片到服务器</p>
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
