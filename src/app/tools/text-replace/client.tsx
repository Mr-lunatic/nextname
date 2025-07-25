"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Search, Check, AlertCircle, Replace } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Footer } from '@/components/footer'

export default function TextReplaceClient() {
  const [inputText, setInputText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [options, setOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    globalReplace: true
  })
  const [matchCount, setMatchCount] = useState(0)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  // 执行搜索替换
  const performReplace = useCallback(() => {
    if (!inputText.trim() || !searchText.trim()) {
      setOutputText('')
      setMatchCount(0)
      setError('')
      return
    }

    try {
      let searchPattern: string | RegExp = searchText
      let flags = ''

      if (options.useRegex) {
        // 使用正则表达式
        if (options.globalReplace) flags += 'g'
        if (!options.caseSensitive) flags += 'i'
        
        searchPattern = new RegExp(searchText, flags)
      } else {
        // 普通文本搜索
        if (options.wholeWord) {
          // 全词匹配
          const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          searchPattern = new RegExp(`\\b${escapedText}\\b`, flags)
        } else {
          const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          if (options.globalReplace) flags += 'g'
          if (!options.caseSensitive) flags += 'i'
          searchPattern = new RegExp(escapedText, flags)
        }
      }

      // 计算匹配数量
      const matches = inputText.match(searchPattern)
      setMatchCount(matches ? matches.length : 0)

      // 执行替换
      const result = inputText.replace(searchPattern, replaceText)
      setOutputText(result)
      setError('')

    } catch (err) {
      setError(err instanceof Error ? err.message : '替换操作失败')
      setOutputText('')
      setMatchCount(0)
    }
  }, [inputText, searchText, replaceText, options])

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
    setInputText('')
    setSearchText('')
    setReplaceText('')
    setOutputText('')
    setMatchCount(0)
    setError('')
    setCopied(null)
  }

  const handleOptionChange = (option: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: checked
    }))
  }

  // 实时替换
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performReplace()
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [performReplace])

  // 高亮显示匹配项
  const highlightMatches = (text: string, search: string): React.ReactNode => {
    if (!search.trim() || !text.trim()) return text

    try {
      let searchPattern: RegExp
      let flags = 'g'

      if (options.useRegex) {
        if (!options.caseSensitive) flags += 'i'
        searchPattern = new RegExp(search, flags)
      } else {
        if (!options.caseSensitive) flags += 'i'
        if (options.wholeWord) {
          const escapedText = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          searchPattern = new RegExp(`\\b${escapedText}\\b`, flags)
        } else {
          const escapedText = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          searchPattern = new RegExp(escapedText, flags)
        }
      }

      const parts: React.ReactNode[] = []
      let lastIndex = 0
      let match

      while ((match = searchPattern.exec(text)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          parts.push(text.slice(lastIndex, match.index))
        }
        
        // 添加高亮的匹配文本
        parts.push(
          <span key={match.index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
            {match[0]}
          </span>
        )
        
        lastIndex = match.index + match[0].length
        
        // 防止无限循环
        if (!options.globalReplace) break
      }

      // 添加最后的文本
      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex))
      }

      return parts.length > 0 ? parts : text
    } catch {
      return text
    }
  }

  const sampleData = {
    text: `Hello World! This is a sample text.
Hello everyone, welcome to our website.
Please contact us at hello@example.com
Have a great day!`,
    search: 'Hello',
    replace: 'Hi'
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">文本搜索替换</h1>
          <p className="text-muted-foreground mb-6">
            在线文本搜索替换工具，支持普通文本和正则表达式查找替换，实时预览替换结果，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时预览</Badge>
            <Badge variant="secondary">正则支持</Badge>
            {matchCount > 0 && <Badge variant="default">{matchCount} 个匹配</Badge>}
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
                <Replace className="w-5 h-5" />
                搜索替换设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    搜索内容
                  </label>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="请输入要搜索的内容..."
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    替换为
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="请输入替换内容..."
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  搜索选项
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="caseSensitive"
                      checked={options.caseSensitive}
                      onCheckedChange={(checked) => 
                        handleOptionChange('caseSensitive', !!checked)
                      }
                    />
                    <label htmlFor="caseSensitive" className="text-sm cursor-pointer">
                      区分大小写
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="wholeWord"
                      checked={options.wholeWord}
                      onCheckedChange={(checked) => 
                        handleOptionChange('wholeWord', !!checked)
                      }
                    />
                    <label htmlFor="wholeWord" className="text-sm cursor-pointer">
                      全词匹配
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useRegex"
                      checked={options.useRegex}
                      onCheckedChange={(checked) => 
                        handleOptionChange('useRegex', !!checked)
                      }
                    />
                    <label htmlFor="useRegex" className="text-sm cursor-pointer">
                      正则表达式
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="globalReplace"
                      checked={options.globalReplace}
                      onCheckedChange={(checked) => 
                        handleOptionChange('globalReplace', !!checked)
                      }
                    />
                    <label htmlFor="globalReplace" className="text-sm cursor-pointer">
                      全局替换
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
                <Button 
                  onClick={() => {
                    setInputText(sampleData.text)
                    setSearchText(sampleData.search)
                    setReplaceText(sampleData.replace)
                  }}
                  variant="outline" 
                  size="sm"
                >
                  加载示例
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

        {/* Text Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  原始文本
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="请输入要处理的文本..."
                  className="w-full h-64 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                
                {/* Preview with highlights */}
                {inputText && searchText && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      搜索预览 ({matchCount} 个匹配)
                    </label>
                    <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {highlightMatches(inputText, searchText)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>替换结果</CardTitle>
                  {outputText && (
                    <Button
                      onClick={() => handleCopy(outputText)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copied === outputText ? (
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
              </CardHeader>
              <CardContent>
                <textarea
                  value={outputText}
                  readOnly
                  placeholder="替换结果将显示在这里..."
                  className="w-full h-64 p-3 border rounded-md resize-none bg-muted/50"
                />
                
                {/* Statistics */}
                {outputText && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>原始长度: {inputText.length} 字符</p>
                    <p>结果长度: {outputText.length} 字符</p>
                    <p>替换次数: {matchCount} 次</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>区分大小写</strong>：严格匹配字母大小写</p>
                  <p>• <strong>全词匹配</strong>：只匹配完整的单词</p>
                  <p>• <strong>正则表达式</strong>：使用正则表达式模式</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>全局替换</strong>：替换所有匹配项</p>
                  <p>• <strong>实时预览</strong>：即时显示替换效果</p>
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
