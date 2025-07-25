"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RefreshCw, Check, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Footer } from '@/components/footer'

interface PasswordOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
}

export default function PasswordGeneratorClient() {
  const [password, setPassword] = useState('')
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  })
  const [copied, setCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(true)
  const [strength, setStrength] = useState<'weak' | 'medium' | 'strong' | 'very-strong'>('strong')

  const generatePassword = useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const similar = 'il1Lo0O'

    let charset = ''
    if (options.includeUppercase) charset += uppercase
    if (options.includeLowercase) charset += lowercase
    if (options.includeNumbers) charset += numbers
    if (options.includeSymbols) charset += symbols

    if (options.excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('')
    }

    if (!charset) {
      setPassword('')
      return
    }

    let result = ''
    const array = new Uint8Array(options.length)
    crypto.getRandomValues(array)

    for (let i = 0; i < options.length; i++) {
      result += charset[array[i] % charset.length]
    }

    setPassword(result)
    calculateStrength(result)
  }, [options])

  const calculateStrength = (pwd: string) => {
    let score = 0
    
    // 长度评分
    if (pwd.length >= 8) score += 1
    if (pwd.length >= 12) score += 1
    if (pwd.length >= 16) score += 1
    
    // 字符类型评分
    if (/[a-z]/.test(pwd)) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1
    
    // 复杂度评分
    if (pwd.length >= 20) score += 1

    if (score <= 3) setStrength('weak')
    else if (score <= 5) setStrength('medium')
    else if (score <= 6) setStrength('strong')
    else setStrength('very-strong')
  }

  const handleCopy = async () => {
    if (!password) return
    
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'text-red-500'
      case 'medium': return 'text-orange-500'
      case 'strong': return 'text-blue-500'
      case 'very-strong': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return '弱'
      case 'medium': return '中等'
      case 'strong': return '强'
      case 'very-strong': return '很强'
      default: return '未知'
    }
  }

  // 初始生成密码
  React.useEffect(() => {
    generatePassword()
  }, [generatePassword])

  const hasValidOptions = options.includeUppercase || options.includeLowercase || 
                         options.includeNumbers || options.includeSymbols

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">密码生成器</h1>
          <p className="text-muted-foreground mb-6">
            生成安全的随机密码，保护您的账户安全。所有生成都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地生成</Badge>
            <Badge variant="secondary">加密安全</Badge>
            <Badge variant="secondary">自定义选项</Badge>
            <Badge className={getStrengthColor()}>强度: {getStrengthText()}</Badge>
          </div>
        </motion.div>

        {/* Password Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                生成的密码
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    readOnly
                    className="w-full p-3 border rounded-md font-mono text-lg bg-muted/50"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!password}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  onClick={generatePassword}
                  disabled={!hasValidOptions}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新生成
                </Button>
              </div>
              
              {!hasValidOptions && (
                <div className="flex items-center gap-2 p-3 bg-orange-100 border border-orange-200 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-700">请至少选择一种字符类型</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Length */}
          <Card>
            <CardHeader>
              <CardTitle>密码长度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>长度: {options.length}</span>
                  <span className="text-sm text-muted-foreground">8-128</span>
                </div>
                <Slider
                  value={[options.length]}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
                  min={8}
                  max={128}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Character Types */}
          <Card>
            <CardHeader>
              <CardTitle>字符类型</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uppercase"
                  checked={options.includeUppercase}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeUppercase: !!checked }))
                  }
                />
                <label htmlFor="uppercase" className="text-sm">大写字母 (A-Z)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowercase"
                  checked={options.includeLowercase}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeLowercase: !!checked }))
                  }
                />
                <label htmlFor="lowercase" className="text-sm">小写字母 (a-z)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="numbers"
                  checked={options.includeNumbers}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeNumbers: !!checked }))
                  }
                />
                <label htmlFor="numbers" className="text-sm">数字 (0-9)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="symbols"
                  checked={options.includeSymbols}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, includeSymbols: !!checked }))
                  }
                />
                <label htmlFor="symbols" className="text-sm">特殊字符 (!@#$%^&*)</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeSimilar"
                  checked={options.excludeSimilar}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, excludeSimilar: !!checked }))
                  }
                />
                <label htmlFor="excludeSimilar" className="text-sm">排除相似字符 (il1Lo0O)</label>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>密码安全建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• 使用至少12位字符的密码</p>
                  <p>• 包含大小写字母、数字和特殊字符</p>
                  <p>• 每个账户使用不同的密码</p>
                </div>
                <div className="space-y-2">
                  <p>• 定期更换重要账户密码</p>
                  <p>• 使用密码管理器存储密码</p>
                  <p>• 启用双因素认证</p>
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
