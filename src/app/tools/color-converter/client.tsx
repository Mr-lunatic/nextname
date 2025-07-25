"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Palette, Check, Eye } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

interface ColorFormats {
  hex: string
  rgb: string
  hsl: string
  hsv: string
  cmyk: string
}

export default function ColorConverterClient() {
  const [inputColor, setInputColor] = useState('#3B82F6')
  const [colorFormats, setColorFormats] = useState<ColorFormats>({
    hex: '#3B82F6',
    rgb: 'rgb(59, 130, 246)',
    hsl: 'hsl(217, 91%, 60%)',
    hsv: 'hsv(217, 76%, 96%)',
    cmyk: 'cmyk(76%, 47%, 0%, 4%)'
  })
  const [copied, setCopied] = useState<string | null>(null)

  // 颜色转换函数
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
  }

  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255
    g /= 255
    b /= 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
  }

  const rgbToHsv = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, v = max

    const d = max - min
    s = max === 0 ? 0 : d / max

    if (max === min) {
      h = 0 // achromatic
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)]
  }

  const rgbToCmyk = (r: number, g: number, b: number): [number, number, number, number] => {
    r /= 255
    g /= 255
    b /= 255

    const k = 1 - Math.max(r, Math.max(g, b))
    const c = (1 - r - k) / (1 - k) || 0
    const m = (1 - g - k) / (1 - k) || 0
    const y = (1 - b - k) / (1 - k) || 0

    return [
      Math.round(c * 100),
      Math.round(m * 100),
      Math.round(y * 100),
      Math.round(k * 100)
    ]
  }

  const convertColor = useCallback((color: string) => {
    // 尝试解析输入的颜色
    let rgb: [number, number, number] | null = null

    // 处理HEX格式
    if (color.startsWith('#')) {
      rgb = hexToRgb(color)
    }
    // 处理RGB格式
    else if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        rgb = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
      }
    }

    if (!rgb) return

    const [r, g, b] = rgb
    const [h, s, l] = rgbToHsl(r, g, b)
    const [hsvH, hsvS, v] = rgbToHsv(r, g, b)
    const [c, m, y, k] = rgbToCmyk(r, g, b)

    setColorFormats({
      hex: rgbToHex(r, g, b).toUpperCase(),
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${h}, ${s}%, ${l}%)`,
      hsv: `hsv(${hsvH}, ${hsvS}%, ${v}%)`,
      cmyk: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`
    })
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
    setInputColor('#000000')
    setCopied(null)
  }

  // 实时转换
  React.useEffect(() => {
    convertColor(inputColor)
  }, [inputColor, convertColor])

  const presetColors = [
    { name: '红色', value: '#FF0000' },
    { name: '绿色', value: '#00FF00' },
    { name: '蓝色', value: '#0000FF' },
    { name: '黄色', value: '#FFFF00' },
    { name: '紫色', value: '#800080' },
    { name: '橙色', value: '#FFA500' },
    { name: '粉色', value: '#FFC0CB' },
    { name: '灰色', value: '#808080' },
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">颜色转换器</h1>
          <p className="text-muted-foreground mb-6">
            在线颜色格式转换工具，支持HEX、RGB、HSL、HSV、CMYK等多种格式互转，所有转换都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时转换</Badge>
            <Badge variant="secondary">多种格式</Badge>
            <Badge variant="secondary">颜色预览</Badge>
          </div>
        </motion.div>

        {/* Color Input and Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                颜色输入
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    颜色选择器
                  </label>
                  <input
                    type="color"
                    value={inputColor}
                    onChange={(e) => setInputColor(e.target.value)}
                    className="w-full h-12 border rounded-md cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    手动输入 (HEX/RGB)
                  </label>
                  <input
                    type="text"
                    value={inputColor}
                    onChange={(e) => setInputColor(e.target.value)}
                    placeholder="例如: #FF0000 或 rgb(255,0,0)"
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Color Preview */}
              <div className="flex items-center gap-4">
                <div 
                  className="w-20 h-20 border rounded-md shadow-sm"
                  style={{ backgroundColor: inputColor }}
                ></div>
                <div>
                  <p className="text-sm font-medium">颜色预览</p>
                  <p className="text-xs text-muted-foreground">当前颜色: {inputColor}</p>
                </div>
              </div>

              {/* Preset Colors */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  预设颜色
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setInputColor(color.value)}
                      className="w-8 h-8 border rounded-md shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Color Formats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                颜色格式
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(colorFormats).map(([format, value]) => (
                  <div key={format} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-sm uppercase">{format}</div>
                      <div className="font-mono text-sm text-muted-foreground">{value}</div>
                    </div>
                    <Button
                      onClick={() => handleCopy(value)}
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                    >
                      {copied === value ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2">
                <Button onClick={handleClear} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>颜色格式说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>HEX</strong>：十六进制颜色代码，如 #FF0000</p>
                  <p>• <strong>RGB</strong>：红绿蓝三原色，如 rgb(255,0,0)</p>
                  <p>• <strong>HSL</strong>：色相、饱和度、亮度</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>HSV</strong>：色相、饱和度、明度</p>
                  <p>• <strong>CMYK</strong>：印刷四色模式</p>
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
