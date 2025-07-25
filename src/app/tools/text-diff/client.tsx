"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, FileText, Check, ArrowLeftRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Footer } from '@/components/footer'

interface DiffLine {
  type: 'equal' | 'insert' | 'delete'
  content: string
  lineNumber1?: number
  lineNumber2?: number
}

export default function TextDiffClient() {
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const [diffResult, setDiffResult] = useState<DiffLine[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  // 简化的文本差异算法
  const calculateDiff = useCallback((oldText: string, newText: string): DiffLine[] => {
    const oldLines = oldText.split('\n')
    const newLines = newText.split('\n')
    const result: DiffLine[] = []

    // 简化的LCS算法实现
    const lcs = (a: string[], b: string[]): number[][] => {
      const m = a.length
      const n = b.length
      const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (a[i - 1] === b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
          }
        }
      }
      return dp
    }

    const dp = lcs(oldLines, newLines)
    let i = oldLines.length
    let j = newLines.length

    // 回溯构建差异
    const changes: DiffLine[] = []
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        changes.unshift({
          type: 'equal',
          content: oldLines[i - 1],
          lineNumber1: i,
          lineNumber2: j
        })
        i--
        j--
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        changes.unshift({
          type: 'insert',
          content: newLines[j - 1],
          lineNumber2: j
        })
        j--
      } else if (i > 0) {
        changes.unshift({
          type: 'delete',
          content: oldLines[i - 1],
          lineNumber1: i
        })
        i--
      }
    }

    return changes
  }, [])

  const handleCompare = useCallback(() => {
    if (!text1.trim() && !text2.trim()) {
      setDiffResult([])
      return
    }

    const diff = calculateDiff(text1, text2)
    setDiffResult(diff)
  }, [text1, text2, calculateDiff])

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
    setText1('')
    setText2('')
    setDiffResult([])
    setCopied(null)
  }

  const handleSwap = () => {
    const temp = text1
    setText1(text2)
    setText2(temp)
  }

  // 实时比较
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleCompare()
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [handleCompare])

  // 统计差异
  const stats = React.useMemo(() => {
    const insertions = diffResult.filter(line => line.type === 'insert').length
    const deletions = diffResult.filter(line => line.type === 'delete').length
    const unchanged = diffResult.filter(line => line.type === 'equal').length
    
    return { insertions, deletions, unchanged }
  }, [diffResult])

  // 渲染并排视图
  const renderSideBySide = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 text-red-600">原文本</h4>
          <div className="border rounded bg-muted/30 max-h-96 overflow-y-auto">
            {diffResult.map((line, index) => (
              line.type !== 'insert' && (
                <div
                  key={index}
                  className={`px-3 py-1 text-sm font-mono border-l-4 ${
                    line.type === 'delete' 
                      ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/20 dark:text-red-200' 
                      : 'border-transparent'
                  }`}
                >
                  <span className="text-muted-foreground mr-4 w-8 inline-block">
                    {line.lineNumber1 || ''}
                  </span>
                  {line.content || ' '}
                </div>
              )
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2 text-green-600">新文本</h4>
          <div className="border rounded bg-muted/30 max-h-96 overflow-y-auto">
            {diffResult.map((line, index) => (
              line.type !== 'delete' && (
                <div
                  key={index}
                  className={`px-3 py-1 text-sm font-mono border-l-4 ${
                    line.type === 'insert' 
                      ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                      : 'border-transparent'
                  }`}
                >
                  <span className="text-muted-foreground mr-4 w-8 inline-block">
                    {line.lineNumber2 || ''}
                  </span>
                  {line.content || ' '}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 渲染统一视图
  const renderUnified = () => {
    return (
      <div className="border rounded bg-muted/30 max-h-96 overflow-y-auto">
        {diffResult.map((line, index) => (
          <div
            key={index}
            className={`px-3 py-1 text-sm font-mono border-l-4 ${
              line.type === 'insert' 
                ? 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                : line.type === 'delete'
                ? 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                : 'border-transparent'
            }`}
          >
            <span className="text-muted-foreground mr-4 w-16 inline-block">
              {line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '}
              {line.lineNumber1 || line.lineNumber2 || ''}
            </span>
            {line.content || ' '}
          </div>
        ))}
      </div>
    )
  }

  const sampleTexts = {
    text1: `Hello World
This is a sample text
for testing the diff tool
Some lines will be changed
Others will remain the same`,
    text2: `Hello World
This is a modified text
for testing the diff tool
Some lines have been changed
Others will remain the same
New line added here`
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">文本差异比较</h1>
          <p className="text-muted-foreground mb-6">
            在线文本差异比较工具，支持逐行对比和高亮显示差异，快速找出两段文本的不同之处，所有处理都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">实时比较</Badge>
            <Badge variant="secondary">高亮差异</Badge>
            {stats.insertions > 0 && <Badge variant="default" className="bg-green-500">+{stats.insertions}</Badge>}
            {stats.deletions > 0 && <Badge variant="default" className="bg-red-500">-{stats.deletions}</Badge>}
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  文本输入
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setText1(sampleTexts.text1)
                      setText2(sampleTexts.text2)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    加载示例
                  </Button>
                  <Button onClick={handleSwap} variant="outline" size="sm">
                    <ArrowLeftRight className="w-4 h-4 mr-2" />
                    交换
                  </Button>
                  <Button onClick={handleClear} variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    清空
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    原文本
                  </label>
                  <textarea
                    value={text1}
                    onChange={(e) => setText1(e.target.value)}
                    placeholder="请输入原文本..."
                    className="w-full h-48 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    新文本
                  </label>
                  <textarea
                    value={text2}
                    onChange={(e) => setText2(e.target.value)}
                    placeholder="请输入新文本..."
                    className="w-full h-48 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {diffResult.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>差异结果</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('side-by-side')}
                    >
                      并排显示
                    </Button>
                    <Button
                      variant={viewMode === 'unified' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('unified')}
                    >
                      统一显示
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Statistics */}
                <div className="mb-4 flex gap-4 text-sm">
                  <span className="text-green-600">+{stats.insertions} 新增</span>
                  <span className="text-red-600">-{stats.deletions} 删除</span>
                  <span className="text-muted-foreground">{stats.unchanged} 未变</span>
                </div>

                {/* Diff Display */}
                {viewMode === 'side-by-side' ? renderSideBySide() : renderUnified()}
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
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <span className="bg-green-100 text-green-800 px-1 rounded dark:bg-green-900/20 dark:text-green-200">绿色</span> - 新增的行</p>
                  <p>• <span className="bg-red-100 text-red-800 px-1 rounded dark:bg-red-900/20 dark:text-red-200">红色</span> - 删除的行</p>
                  <p>• 白色 - 未变化的行</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>并排显示</strong>：左右对比查看</p>
                  <p>• <strong>统一显示</strong>：上下对比查看</p>
                  <p>• 所有比较都在本地进行，保护隐私</p>
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
