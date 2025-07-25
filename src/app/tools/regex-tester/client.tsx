"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Search, Check, AlertCircle, Code } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Footer } from '@/components/footer'

interface MatchResult {
  match: string
  index: number
  groups?: string[]
}

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState('')
  const [testString, setTestString] = useState('')
  const [replaceString, setReplaceString] = useState('')
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false
  })
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [replaceResult, setReplaceResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // 测试正则表达式
  const testRegex = useCallback(() => {
    if (!pattern.trim() || !testString.trim()) {
      setMatches([])
      setReplaceResult('')
      setError('')
      return
    }

    try {
      const flagString = Object.entries(flags)
        .filter(([_, enabled]) => enabled)
        .map(([flag]) => {
          switch (flag) {
            case 'global': return 'g'
            case 'ignoreCase': return 'i'
            case 'multiline': return 'm'
            case 'dotAll': return 's'
            case 'unicode': return 'u'
            case 'sticky': return 'y'
            default: return ''
          }
        })
        .join('')

      const regex = new RegExp(pattern, flagString)
      const newMatches: MatchResult[] = []

      if (flags.global) {
        let match
        while ((match = regex.exec(testString)) !== null) {
          newMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          })
          // 防止无限循环
          if (!flags.global) break
        }
      } else {
        const match = regex.exec(testString)
        if (match) {
          newMatches.push({
            match: match[0],
            index: match.index,
            groups: match.slice(1)
          })
        }
      }

      setMatches(newMatches)
      setError('')

      // 执行替换
      if (replaceString !== undefined) {
        const replaceRegex = new RegExp(pattern, flagString)
        const result = testString.replace(replaceRegex, replaceString)
        setReplaceResult(result)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : '正则表达式错误')
      setMatches([])
      setReplaceResult('')
    }
  }, [pattern, testString, replaceString, flags])

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
    setPattern('')
    setTestString('')
    setReplaceString('')
    setMatches([])
    setReplaceResult('')
    setError('')
    setCopied(null)
  }

  const handleFlagChange = (flag: string, checked: boolean) => {
    setFlags(prev => ({
      ...prev,
      [flag]: checked
    }))
  }

  // 实时测试
  React.useEffect(() => {
    const timer = setTimeout(() => {
      testRegex()
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [testRegex])

  // 高亮显示匹配结果
  const highlightMatches = (text: string, matches: MatchResult[]): React.ReactNode => {
    if (matches.length === 0) return text

    const parts: React.ReactNode[] = []
    let lastIndex = 0

    matches.forEach((match, index) => {
      // 添加匹配前的文本
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }
      
      // 添加高亮的匹配文本
      parts.push(
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {match.match}
        </span>
      )
      
      lastIndex = match.index + match.match.length
    })

    // 添加最后的文本
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  const commonPatterns = [
    { name: '邮箱地址', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
    { name: '手机号码', pattern: '1[3-9]\\d{9}' },
    { name: 'URL地址', pattern: 'https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?' },
    { name: 'IPv4地址', pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b' },
    { name: '日期格式', pattern: '\\d{4}-\\d{2}-\\d{2}' },
    { name: '时间格式', pattern: '\\d{2}:\\d{2}(:\\d{2})?' },
    { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+' },
    { name: '数字', pattern: '\\d+' },
  ]

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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">正则表达式测试器</h1>
          <p className="text-muted-foreground mb-6">
            在线正则表达式验证和测试工具，支持实时匹配、替换操作和结果高亮显示，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时测试</Badge>
            <Badge variant="secondary">结果高亮</Badge>
            {matches.length > 0 && (
              <Badge variant="default">{matches.length} 个匹配</Badge>
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
                <Code className="w-5 h-5" />
                正则表达式
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  正则表达式模式
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="请输入正则表达式..."
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                />
              </div>

              {/* Flags */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  修饰符
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries({
                    global: 'g - 全局匹配',
                    ignoreCase: 'i - 忽略大小写',
                    multiline: 'm - 多行模式',
                    dotAll: 's - 点匹配所有',
                    unicode: 'u - Unicode模式',
                    sticky: 'y - 粘性匹配'
                  }).map(([flag, description]) => (
                    <div key={flag} className="flex items-center space-x-2">
                      <Checkbox
                        id={flag}
                        checked={flags[flag as keyof typeof flags]}
                        onCheckedChange={(checked) => 
                          handleFlagChange(flag, !!checked)
                        }
                      />
                      <label htmlFor={flag} className="text-sm cursor-pointer">
                        {description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Patterns */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  常用模式
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {commonPatterns.map((item) => (
                    <Button
                      key={item.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setPattern(item.pattern)}
                      className="text-xs"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Test and Replace */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="test">匹配测试</TabsTrigger>
              <TabsTrigger value="replace">替换操作</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    测试文本
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={testString}
                    onChange={(e) => setTestString(e.target.value)}
                    placeholder="请输入要测试的文本..."
                    className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />

                  {/* Highlighted Result */}
                  {testString && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        匹配结果高亮
                      </label>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                        {highlightMatches(testString, matches)}
                      </div>
                    </div>
                  )}

                  {/* Match Details */}
                  {matches.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        匹配详情 ({matches.length} 个匹配)
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {matches.map((match, index) => (
                          <div key={index} className="border rounded p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">匹配 {index + 1}</span>
                              <Button
                                onClick={() => handleCopy(match.match)}
                                variant="ghost"
                                size="sm"
                              >
                                {copied === match.match ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p><strong>内容:</strong> <code>{match.match}</code></p>
                            <p><strong>位置:</strong> {match.index} - {match.index + match.match.length - 1}</p>
                            {match.groups && match.groups.length > 0 && (
                              <p><strong>分组:</strong> {match.groups.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="replace" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>替换操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      替换为
                    </label>
                    <input
                      type="text"
                      value={replaceString}
                      onChange={(e) => setReplaceString(e.target.value)}
                      placeholder="请输入替换文本..."
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {replaceResult && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">
                          替换结果
                        </label>
                        <Button
                          onClick={() => handleCopy(replaceResult)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {copied === replaceResult ? (
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
                      <textarea
                        value={replaceResult}
                        readOnly
                        className="w-full h-32 p-3 border rounded-md resize-none bg-muted/50"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>正则表达式参考</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <code>.</code> - 匹配任意字符（除换行符）</p>
                  <p>• <code>*</code> - 匹配前面的字符0次或多次</p>
                  <p>• <code>+</code> - 匹配前面的字符1次或多次</p>
                  <p>• <code>?</code> - 匹配前面的字符0次或1次</p>
                  <p>• <code>^</code> - 匹配行的开始</p>
                  <p>• <code>$</code> - 匹配行的结束</p>
                </div>
                <div className="space-y-2">
                  <p>• <code>\d</code> - 匹配数字字符</p>
                  <p>• <code>\w</code> - 匹配单词字符</p>
                  <p>• <code>\s</code> - 匹配空白字符</p>
                  <p>• <code>[abc]</code> - 匹配方括号中的任意字符</p>
                  <p>• <code>(abc)</code> - 分组</p>
                  <p>• 所有测试都在本地进行，保护隐私</p>
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
