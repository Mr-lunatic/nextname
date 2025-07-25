"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Key, Check, AlertCircle, Shield, Clock } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

interface JWTData {
  header: any
  payload: any
  signature: string
  isValid: boolean
  error?: string
}

export default function JWTDecoderClient() {
  const [jwtInput, setJwtInput] = useState('')
  const [jwtData, setJwtData] = useState<JWTData | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Base64 URL 解码
  const base64UrlDecode = (str: string): string => {
    // 添加填充
    str += '='.repeat((4 - str.length % 4) % 4)
    // 替换 URL 安全字符
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    try {
      return decodeURIComponent(escape(atob(str)))
    } catch (error) {
      throw new Error('Invalid base64 encoding')
    }
  }

  // 解析 JWT
  const parseJWT = useCallback((token: string) => {
    if (!token.trim()) {
      setJwtData(null)
      return
    }

    try {
      const parts = token.split('.')
      
      if (parts.length !== 3) {
        setJwtData({
          header: null,
          payload: null,
          signature: '',
          isValid: false,
          error: 'JWT 必须包含三个部分：header.payload.signature'
        })
        return
      }

      const [headerB64, payloadB64, signature] = parts

      // 解码 header
      let header: any
      try {
        const headerStr = base64UrlDecode(headerB64)
        header = JSON.parse(headerStr)
      } catch (error) {
        throw new Error('Header 解码失败')
      }

      // 解码 payload
      let payload: any
      try {
        const payloadStr = base64UrlDecode(payloadB64)
        payload = JSON.parse(payloadStr)
      } catch (error) {
        throw new Error('Payload 解码失败')
      }

      // 验证时间戳
      const now = Math.floor(Date.now() / 1000)
      let isExpired = false
      let isNotYetValid = false

      if (payload.exp && payload.exp < now) {
        isExpired = true
      }
      if (payload.nbf && payload.nbf > now) {
        isNotYetValid = true
      }

      setJwtData({
        header,
        payload,
        signature,
        isValid: !isExpired && !isNotYetValid,
        error: isExpired ? 'Token 已过期' : isNotYetValid ? 'Token 尚未生效' : undefined
      })

    } catch (error) {
      setJwtData({
        header: null,
        payload: null,
        signature: '',
        isValid: false,
        error: error instanceof Error ? error.message : '解析失败'
      })
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
    setJwtInput('')
    setJwtData(null)
    setCopied(null)
  }

  // 实时解析
  React.useEffect(() => {
    const timer = setTimeout(() => {
      parseJWT(jwtInput)
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [jwtInput, parseJWT])

  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  // 示例 JWT
  const sampleJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW8oOS4iSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">JWT 解析器</h1>
          <p className="text-muted-foreground mb-6">
            在线JWT令牌解码和验证工具，查看Header、Payload和签名信息，所有解析都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">隐私保护</Badge>
            <Badge variant="secondary">实时解析</Badge>
            {jwtData && (
              <Badge variant={jwtData.isValid ? "default" : "destructive"}>
                {jwtData.isValid ? '有效' : '无效'}
              </Badge>
            )}
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
                <Key className="w-5 h-5" />
                JWT 令牌输入
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                placeholder="请输入 JWT 令牌..."
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
              />
              
              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
                <Button 
                  onClick={() => setJwtInput(sampleJWT)} 
                  variant="outline" 
                  size="sm"
                >
                  加载示例
                </Button>
              </div>

              {jwtData?.error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{jwtData.error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {jwtData && jwtData.header && jwtData.payload && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Header
                    </CardTitle>
                    <Button
                      onClick={() => handleCopy(JSON.stringify(jwtData.header, null, 2))}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copied === JSON.stringify(jwtData.header, null, 2) ? (
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
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(jwtData.header, null, 2)}
                  </pre>
                  <div className="mt-4 space-y-2 text-sm">
                    <p><strong>算法:</strong> {jwtData.header.alg || 'N/A'}</p>
                    <p><strong>类型:</strong> {jwtData.header.typ || 'N/A'}</p>
                    {jwtData.header.kid && <p><strong>Key ID:</strong> {jwtData.header.kid}</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Payload
                    </CardTitle>
                    <Button
                      onClick={() => handleCopy(JSON.stringify(jwtData.payload, null, 2))}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copied === JSON.stringify(jwtData.payload, null, 2) ? (
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
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(jwtData.payload, null, 2)}
                  </pre>
                  <div className="mt-4 space-y-2 text-sm">
                    {jwtData.payload.iss && <p><strong>签发者:</strong> {jwtData.payload.iss}</p>}
                    {jwtData.payload.sub && <p><strong>主题:</strong> {jwtData.payload.sub}</p>}
                    {jwtData.payload.aud && <p><strong>受众:</strong> {jwtData.payload.aud}</p>}
                    {jwtData.payload.exp && (
                      <p><strong>过期时间:</strong> {formatTimestamp(jwtData.payload.exp)}</p>
                    )}
                    {jwtData.payload.nbf && (
                      <p><strong>生效时间:</strong> {formatTimestamp(jwtData.payload.nbf)}</p>
                    )}
                    {jwtData.payload.iat && (
                      <p><strong>签发时间:</strong> {formatTimestamp(jwtData.payload.iat)}</p>
                    )}
                    {jwtData.payload.jti && <p><strong>JWT ID:</strong> {jwtData.payload.jti}</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Signature */}
        {jwtData && jwtData.signature && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>签名</CardTitle>
                  <Button
                    onClick={() => handleCopy(jwtData.signature)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {copied === jwtData.signature ? (
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
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                  {jwtData.signature}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  注意：签名验证需要密钥，此工具仅解析不验证签名
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>JWT 说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>Header</strong>：包含算法和令牌类型信息</p>
                  <p>• <strong>Payload</strong>：包含声明（claims）信息</p>
                  <p>• <strong>Signature</strong>：用于验证令牌完整性</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>格式</strong>：header.payload.signature</p>
                  <p>• <strong>编码</strong>：Base64 URL 编码</p>
                  <p>• 所有解析都在本地进行，保护隐私</p>
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
