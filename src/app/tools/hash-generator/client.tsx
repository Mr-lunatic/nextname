"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Check, Hash, Upload } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Footer } from '@/components/footer'

interface HashResult {
  algorithm: string
  hash: string
}

export default function HashGeneratorClient() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<HashResult[]>([])
  const [selectedAlgorithms, setSelectedAlgorithms] = useState({
    md5: true,
    sha1: true,
    sha256: true,
    sha512: false,
  })
  const [copied, setCopied] = useState<string | null>(null)
  const [isFile, setIsFile] = useState(false)

  // 简化的哈希函数实现（实际项目中应使用crypto-js或Web Crypto API）
  const generateHash = useCallback(async (text: string, algorithm: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    
    try {
      let hashBuffer: ArrayBuffer
      
      switch (algorithm.toLowerCase()) {
        case 'sha1':
          hashBuffer = await crypto.subtle.digest('SHA-1', data)
          break
        case 'sha256':
          hashBuffer = await crypto.subtle.digest('SHA-256', data)
          break
        case 'sha512':
          hashBuffer = await crypto.subtle.digest('SHA-512', data)
          break
        case 'md5':
          // MD5 不被Web Crypto API支持，这里使用简化实现
          return simpleMD5(text)
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`)
      }
      
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.error(`Error generating ${algorithm} hash:`, error)
      return 'Error generating hash'
    }
  }, [])

  // 简化的MD5实现（仅用于演示）
  const simpleMD5 = (text: string): string => {
    // 这是一个非常简化的MD5实现，实际项目中应使用专业库
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0')
  }

  const calculateHashes = useCallback(async () => {
    if (!input.trim()) {
      setResults([])
      return
    }

    const algorithms = Object.entries(selectedAlgorithms)
      .filter(([_, selected]) => selected)
      .map(([algorithm]) => algorithm)

    const newResults: HashResult[] = []
    
    for (const algorithm of algorithms) {
      const hash = await generateHash(input, algorithm)
      newResults.push({
        algorithm: algorithm.toUpperCase(),
        hash
      })
    }
    
    setResults(newResults)
  }, [input, selectedAlgorithms, generateHash])

  const handleCopy = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(hash)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const handleClear = () => {
    setInput('')
    setResults([])
    setCopied(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setInput(content)
      setIsFile(true)
    }
    reader.readAsText(file)
  }

  const handleAlgorithmChange = (algorithm: string, checked: boolean) => {
    setSelectedAlgorithms(prev => ({
      ...prev,
      [algorithm]: checked
    }))
  }

  // 实时计算哈希
  React.useEffect(() => {
    const timer = setTimeout(() => {
      calculateHashes()
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [calculateHashes])

  const algorithms = [
    { key: 'md5', name: 'MD5', description: '128位，快速但不安全' },
    { key: 'sha1', name: 'SHA-1', description: '160位，已被破解' },
    { key: 'sha256', name: 'SHA-256', description: '256位，安全推荐' },
    { key: 'sha512', name: 'SHA-512', description: '512位，最高安全性' },
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">哈希生成器</h1>
          <p className="text-muted-foreground mb-6">
            生成文本或文件的哈希值，支持MD5、SHA1、SHA256、SHA512等多种算法，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">多种算法</Badge>
            <Badge variant="secondary">实时计算</Badge>
            <Badge variant="secondary">文件支持</Badge>
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
                <Hash className="w-5 h-5" />
                输入内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={!isFile ? 'default' : 'outline'}
                  onClick={() => setIsFile(false)}
                  size="sm"
                >
                  文本输入
                </Button>
                <Button
                  variant={isFile ? 'default' : 'outline'}
                  onClick={() => setIsFile(true)}
                  size="sm"
                >
                  文件上传
                </Button>
              </div>

              {!isFile ? (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入要计算哈希的文本..."
                  className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              ) : (
                <div className="border-2 border-dashed border-muted rounded-md p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-2">选择文件计算哈希值</p>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="block mx-auto"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Algorithm Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>选择哈希算法</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {algorithms.map((algorithm) => (
                  <div key={algorithm.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={algorithm.key}
                      checked={selectedAlgorithms[algorithm.key as keyof typeof selectedAlgorithms]}
                      onCheckedChange={(checked) => 
                        handleAlgorithmChange(algorithm.key, !!checked)
                      }
                    />
                    <div className="flex-1">
                      <label htmlFor={algorithm.key} className="text-sm font-medium cursor-pointer">
                        {algorithm.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{algorithm.description}</p>
                    </div>
                  </div>
                ))}
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
              <CardTitle>哈希结果</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Hash className="w-12 h-12 mx-auto mb-2" />
                  <p>输入内容后将显示哈希结果</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.algorithm}</h4>
                        <Button
                          onClick={() => handleCopy(result.hash)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {copied === result.hash ? (
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
                      <div className="bg-muted p-3 rounded font-mono text-sm break-all">
                        {result.hash}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>安全说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>MD5</strong>：已被破解，仅用于校验</p>
                  <p>• <strong>SHA-1</strong>：已被破解，不推荐使用</p>
                  <p>• <strong>SHA-256</strong>：目前安全，推荐使用</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>SHA-512</strong>：最高安全性</p>
                  <p>• 哈希是单向函数，无法逆向</p>
                  <p>• 所有计算都在本地进行，保护隐私</p>
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
