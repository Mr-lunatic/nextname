"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RefreshCw, Check, Hash, Trash2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Footer } from '@/components/footer'

export default function UUIDGeneratorClient() {
  const [uuids, setUuids] = useState<string[]>([])
  const [count, setCount] = useState(1)
  const [version, setVersion] = useState<'v4' | 'v1'>('v4')
  const [copied, setCopied] = useState<string | null>(null)

  // 生成UUID v4
  const generateUUIDv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // 生成UUID v1 (简化版)
  const generateUUIDv1 = (): string => {
    const timestamp = Date.now()
    const timestampHex = timestamp.toString(16).padStart(12, '0')
    const clockSeq = Math.floor(Math.random() * 0x3fff)
    const node = Array.from({length: 6}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
    
    return [
      timestampHex.slice(-8),
      timestampHex.slice(-12, -8),
      '1' + timestampHex.slice(-15, -12),
      ((clockSeq >> 8) | 0x80).toString(16).padStart(2, '0') + (clockSeq & 0xff).toString(16).padStart(2, '0'),
      node
    ].join('-')
  }

  const generateUUIDs = useCallback(() => {
    const newUUIDs = Array.from({ length: count }, () => 
      version === 'v4' ? generateUUIDv4() : generateUUIDv1()
    )
    setUuids(newUUIDs)
  }, [count, version])

  const handleCopy = async (uuid: string) => {
    try {
      await navigator.clipboard.writeText(uuid)
      setCopied(uuid)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleCopyAll = async () => {
    if (uuids.length === 0) return
    
    try {
      await navigator.clipboard.writeText(uuids.join('\n'))
      setCopied('all')
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setUuids([])
    setCopied(null)
  }

  // 初始生成
  React.useEffect(() => {
    generateUUIDs()
  }, [generateUUIDs])

  const formatUUID = (uuid: string) => {
    return uuid.toLowerCase()
  }

  const getUUIDInfo = (uuid: string) => {
    const parts = uuid.split('-')
    if (parts.length !== 5) return null

    const versionChar = parts[2][0]
    const variant = parseInt(parts[3][0], 16)
    
    return {
      version: versionChar,
      variant: variant >= 8 ? 'RFC 4122' : 'Other',
      timestamp: version === 'v1' ? new Date(parseInt(parts[0] + parts[1] + parts[2].slice(1), 16) / 10000 - 12219292800000) : null
    }
  }

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">UUID 生成器</h1>
          <p className="text-muted-foreground mb-6">
            生成唯一标识符(UUID)，支持多种版本和批量生成，所有生成都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地生成</Badge>
            <Badge variant="secondary">多种版本</Badge>
            <Badge variant="secondary">批量生成</Badge>
            <Badge variant="outline">UUID {version.toUpperCase()}</Badge>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                生成设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Version Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">UUID 版本</label>
                <div className="flex gap-2">
                  <Button
                    variant={version === 'v4' ? 'default' : 'outline'}
                    onClick={() => setVersion('v4')}
                    className="flex-1"
                  >
                    UUID v4 (随机)
                  </Button>
                  <Button
                    variant={version === 'v1' ? 'default' : 'outline'}
                    onClick={() => setVersion('v1')}
                    className="flex-1"
                  >
                    UUID v1 (时间戳)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {version === 'v4' 
                    ? 'v4: 基于随机数生成，最常用的版本' 
                    : 'v1: 基于时间戳和MAC地址生成，包含时间信息'
                  }
                </p>
              </div>

              {/* Count Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">生成数量: {count}</label>
                  <span className="text-sm text-muted-foreground">1-100</span>
                </div>
                <Slider
                  value={[count]}
                  onValueChange={(value) => setCount(value[0])}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={generateUUIDs} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  重新生成
                </Button>
                {uuids.length > 0 && (
                  <>
                    <Button onClick={handleCopyAll} variant="outline" className="flex items-center gap-2">
                      {copied === 'all' ? (
                        <>
                          <Check className="w-4 h-4" />
                          已复制全部
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          复制全部
                        </>
                      )}
                    </Button>
                    <Button onClick={handleClear} variant="outline" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      清空
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>生成的 UUID ({uuids.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {uuids.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="w-12 h-12 mx-auto mb-2" />
                  <p>点击生成按钮创建UUID</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {uuids.map((uuid, index) => {
                    const info = getUUIDInfo(uuid)
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm break-all">
                            {formatUUID(uuid)}
                          </div>
                          {info && (
                            <div className="text-xs text-muted-foreground mt-1">
                              版本: {info.version} | 变体: {info.variant}
                              {info.timestamp && ` | 时间: ${info.timestamp.toLocaleString()}`}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleCopy(uuid)}
                          variant="ghost"
                          size="sm"
                          className="ml-2 flex-shrink-0"
                        >
                          {copied === uuid ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
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
              <CardTitle>UUID 说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>UUID v4</strong>：基于随机数生成，最常用</p>
                  <p>• <strong>UUID v1</strong>：基于时间戳，包含时间信息</p>
                  <p>• <strong>格式</strong>：8-4-4-4-12 位十六进制数字</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>用途</strong>：数据库主键、文件名、会话ID</p>
                  <p>• <strong>唯一性</strong>：理论上全球唯一</p>
                  <p>• 所有生成都在本地进行，保护隐私</p>
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
