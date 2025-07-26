"use client"

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, RotateCcw, Languages, Check, Volume2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Footer } from '@/components/footer'

export default function PinyinConverterClient() {
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState('')
  const [mode, setMode] = useState<'hanzi-to-pinyin' | 'pinyin-to-hanzi'>('hanzi-to-pinyin')
  const [options, setOptions] = useState({
    showTone: true,
    showToneNumber: false,
    uppercase: false,
    withSpaces: true,
    onlyPinyin: false
  })
  const [copied, setCopied] = useState<string | null>(null)

  // 简化的汉字拼音映射表（实际项目中应使用完整的拼音库）
  const pinyinMap: { [key: string]: string } = React.useMemo(() => ({
    '你': 'nǐ', '好': 'hǎo', '世': 'shì', '界': 'jiè', '中': 'zhōng', '国': 'guó',
    '人': 'rén', '大': 'dà', '小': 'xiǎo', '天': 'tiān', '地': 'dì', '山': 'shān',
    '水': 'shuǐ', '火': 'huǒ', '木': 'mù', '金': 'jīn', '土': 'tǔ', '日': 'rì',
    '月': 'yuè', '星': 'xīng', '光': 'guāng', '明': 'míng', '暗': 'àn', '黑': 'hēi',
    '白': 'bái', '红': 'hóng', '绿': 'lǜ', '蓝': 'lán', '黄': 'huáng', '紫': 'zǐ',
    '爱': 'ài', '心': 'xīn', '情': 'qíng', '思': 'sī', '想': 'xiǎng', '知': 'zhī',
    '道': 'dào', '学': 'xué', '习': 'xí', '工': 'gōng', '作': 'zuò', '生': 'shēng',
    '活': 'huó', '家': 'jiā', '庭': 'tíng', '朋': 'péng', '友': 'yǒu', '同': 'tóng',
    '事': 'shì', '老': 'lǎo', '师': 'shī', '孩': 'hái',
    '子': 'zi', '父': 'fù', '母': 'mǔ', '兄': 'xiōng', '弟': 'dì', '姐': 'jiě',
    '妹': 'mèi', '男': 'nán', '女': 'nǚ', '年': 'nián',
    '时': 'shí', '分': 'fēn', '秒': 'miǎo', '春': 'chūn', '夏': 'xià', '秋': 'qiū',
    '冬': 'dōng', '东': 'dōng', '南': 'nán', '西': 'xī', '北': 'běi', '上': 'shàng',
    '下': 'xià', '左': 'zuǒ', '右': 'yòu', '前': 'qián', '后': 'hòu', '里': 'lǐ',
    '外': 'wài', '内': 'nèi', '高': 'gāo', '低': 'dī', '长': 'cháng', '短': 'duǎn',
    '宽': 'kuān', '窄': 'zhǎi', '厚': 'hòu', '薄': 'báo', '新': 'xīn', '旧': 'jiù',
    '快': 'kuài', '慢': 'màn', '多': 'duō', '少': 'shǎo', '坏': 'huài',
    '美': 'měi', '丑': 'chǒu', '香': 'xiāng', '臭': 'chòu', '甜': 'tián', '苦': 'kǔ',
    '酸': 'suān', '辣': 'là', '咸': 'xián', '淡': 'dàn', '热': 'rè', '冷': 'lěng',
    '温': 'wēn', '凉': 'liáng', '干': 'gān', '湿': 'shī', '净': 'jìng', '脏': 'zāng'
  }), [])

  // 移除声调的辅助函数
  const removeToneHelper = (pinyin: string): string => {
    return pinyin
      .replace(/[āáǎà]/g, 'a')
      .replace(/[ēéěè]/g, 'e')
      .replace(/[īíǐì]/g, 'i')
      .replace(/[ōóǒò]/g, 'o')
      .replace(/[ūúǔù]/g, 'u')
      .replace(/[ǖǘǚǜ]/g, 'v')
      .replace(/[ńňǹ]/g, 'n')
      .replace(/ḿ/g, 'm')
  }

  // 拼音转汉字映射表（反向映射）
  const hanziMap: { [key: string]: string[] } = React.useMemo(() => {
    const map: { [key: string]: string[] } = {}
    Object.entries(pinyinMap).forEach(([hanzi, pinyin]) => {
      // 处理不同格式的拼音
      const normalizedPinyin = removeToneHelper(pinyin).toLowerCase()
      if (!map[normalizedPinyin]) {
        map[normalizedPinyin] = []
      }
      map[normalizedPinyin].push(hanzi)

      // 也添加带声调的版本
      if (!map[pinyin.toLowerCase()]) {
        map[pinyin.toLowerCase()] = []
      }
      map[pinyin.toLowerCase()].push(hanzi)
    })
    return map
  }, [pinyinMap])

  // 声调转换
  const toneMap: { [key: string]: string } = React.useMemo(() => ({
    'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
    'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
    'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
    'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
    'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
    'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4',
    'ń': 'n2', 'ň': 'n3', 'ǹ': 'n4',
    'ḿ': 'm2'
  }), [])

  // 移除声调
  const removeTone = React.useCallback((pinyin: string): string => {
    return removeToneHelper(pinyin)
  }, [])

  // 转换为声调数字
  const toToneNumber = React.useCallback((pinyin: string): string => {
    let result = pinyin
    for (const [toned, numbered] of Object.entries(toneMap)) {
      result = result.replace(new RegExp(toned, 'g'), numbered)
    }
    return result
  }, [toneMap])

  // 转换汉字为拼音
  const convertToPinyin = useCallback((text: string) => {
    if (!text.trim()) {
      setResult('')
      return
    }

    const chars = text.split('')
    const results: string[] = []

    chars.forEach(char => {
      if (pinyinMap[char]) {
        let pinyin = pinyinMap[char]

        // 处理声调选项
        if (!options.showTone) {
          pinyin = removeTone(pinyin)
        } else if (options.showToneNumber) {
          pinyin = toToneNumber(pinyin)
        }

        // 处理大小写
        if (options.uppercase) {
          pinyin = pinyin.toUpperCase()
        }

        results.push(pinyin)
      } else if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字符但不在映射表中
        results.push(`[${char}]`)
      } else {
        // 非中文字符
        if (!options.onlyPinyin) {
          results.push(char)
        }
      }
    })

    const separator = options.withSpaces ? ' ' : ''
    setResult(results.join(separator))
  }, [options, pinyinMap, removeTone, toToneNumber])

  // 转换拼音为汉字
  const convertToHanzi = useCallback((text: string) => {
    if (!text.trim()) {
      setResult('')
      return
    }

    // 分割拼音（按空格或逗号分割）
    const pinyins = text.toLowerCase().split(/[\s,，]+/).filter(p => p.trim())
    const results: string[] = []

    pinyins.forEach(pinyin => {
      const trimmedPinyin = pinyin.trim()
      if (hanziMap[trimmedPinyin]) {
        // 如果有多个汉字选项，显示第一个，其他的放在括号里
        const hanziOptions = hanziMap[trimmedPinyin]
        if (hanziOptions.length === 1) {
          results.push(hanziOptions[0])
        } else {
          results.push(`${hanziOptions[0]}(${hanziOptions.slice(1).join('/')})`)
        }
      } else {
        // 尝试移除声调后再查找
        const noTonePinyin = removeTone(trimmedPinyin)
        if (hanziMap[noTonePinyin]) {
          const hanziOptions = hanziMap[noTonePinyin]
          if (hanziOptions.length === 1) {
            results.push(hanziOptions[0])
          } else {
            results.push(`${hanziOptions[0]}(${hanziOptions.slice(1).join('/')})`)
          }
        } else {
          results.push(`[${trimmedPinyin}]`)
        }
      }
    })

    setResult(results.join(''))
  }, [hanziMap, removeTone])

  // 根据模式选择转换函数
  const performConversion = useCallback((text: string) => {
    if (mode === 'hanzi-to-pinyin') {
      convertToPinyin(text)
    } else {
      convertToHanzi(text)
    }
  }, [mode, convertToPinyin, convertToHanzi])

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
    setResult('')
    setCopied(null)
  }

  const handleModeSwap = () => {
    setMode(mode === 'hanzi-to-pinyin' ? 'pinyin-to-hanzi' : 'hanzi-to-pinyin')
    setInputText('')
    setResult('')
    setCopied(null)
  }

  const handleOptionChange = (option: string, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      [option]: checked
    }))
  }

  // 实时转换
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performConversion(inputText)
    }, 300) // 防抖

    return () => clearTimeout(timer)
  }, [inputText, performConversion])

  // 语音播放（简化版）
  const playPronunciation = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const sampleTexts = mode === 'hanzi-to-pinyin'
    ? [
        '你好世界',
        '中国人民',
        '学习工作',
        '春夏秋冬',
        '东南西北',
        '红绿蓝黄'
      ]
    : [
        'ni hao shi jie',
        'zhong guo ren min',
        'xue xi gong zuo',
        'chun xia qiu dong',
        'dong nan xi bei',
        'hong lv lan huang'
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">汉字拼音转换器</h1>
          <p className="text-muted-foreground mb-6">
            在线汉字拼音双向转换工具，支持汉字转拼音、拼音转汉字、声调显示、多种格式输出，所有转换都在本地浏览器进行，保护您的隐私
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">本地处理</Badge>
            <Badge variant="secondary">双向转换</Badge>
            <Badge variant="secondary">声调支持</Badge>
            <Badge variant="secondary">语音播放</Badge>
            <Badge variant="outline">{mode === 'hanzi-to-pinyin' ? '汉字→拼音' : '拼音→汉字'}</Badge>
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
                  <Languages className="w-5 h-5" />
                  {mode === 'hanzi-to-pinyin' ? '汉字输入' : '拼音输入'}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'hanzi-to-pinyin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('hanzi-to-pinyin')}
                  >
                    汉字→拼音
                  </Button>
                  <Button
                    variant={mode === 'pinyin-to-hanzi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('pinyin-to-hanzi')}
                  >
                    拼音→汉字
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === 'hanzi-to-pinyin' ? '请输入中文汉字...' : '请输入拼音（用空格分隔）...'}
                className="w-full h-32 p-3 border rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              />

              {/* Sample Texts */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  示例文本
                </label>
                <div className="flex flex-wrap gap-2">
                  {sampleTexts.map((text) => (
                    <Button
                      key={text}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputText(text)}
                    >
                      {text}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleClear} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  清空
                </Button>
                {inputText && (
                  <Button 
                    onClick={() => playPronunciation(inputText)} 
                    variant="outline" 
                    size="sm"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    语音播放
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Options - 只在汉字转拼音模式下显示 */}
        {mode === 'hanzi-to-pinyin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>转换选项</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showTone"
                        checked={options.showTone}
                        onCheckedChange={(checked) =>
                          handleOptionChange('showTone', !!checked)
                        }
                      />
                      <label htmlFor="showTone" className="text-sm cursor-pointer">
                        显示声调符号
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showToneNumber"
                        checked={options.showToneNumber}
                        onCheckedChange={(checked) =>
                          handleOptionChange('showToneNumber', !!checked)
                        }
                      />
                      <label htmlFor="showToneNumber" className="text-sm cursor-pointer">
                        使用数字声调
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="uppercase"
                        checked={options.uppercase}
                        onCheckedChange={(checked) =>
                          handleOptionChange('uppercase', !!checked)
                        }
                      />
                      <label htmlFor="uppercase" className="text-sm cursor-pointer">
                        大写字母
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="withSpaces"
                        checked={options.withSpaces}
                        onCheckedChange={(checked) =>
                          handleOptionChange('withSpaces', !!checked)
                        }
                      />
                      <label htmlFor="withSpaces" className="text-sm cursor-pointer">
                        拼音间加空格
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="onlyPinyin"
                        checked={options.onlyPinyin}
                        onCheckedChange={(checked) =>
                          handleOptionChange('onlyPinyin', !!checked)
                        }
                      />
                      <label htmlFor="onlyPinyin" className="text-sm cursor-pointer">
                        仅显示拼音
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{mode === 'hanzi-to-pinyin' ? '拼音结果' : '汉字结果'}</CardTitle>
                {result && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => playPronunciation(mode === 'hanzi-to-pinyin' ? result : inputText)}
                      variant="outline"
                      size="sm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleCopy(result)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {copied === result ? (
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
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md min-h-32">
                {result ? (
                  <div className="text-lg font-mono leading-relaxed">
                    {result}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Languages className="w-12 h-12 mx-auto mb-2" />
                    <p>{mode === 'hanzi-to-pinyin' ? '输入汉字后将显示拼音结果' : '输入拼音后将显示汉字结果'}</p>
                  </div>
                )}
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
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>• <strong>双向转换</strong>：支持汉字转拼音和拼音转汉字</p>
                  <p>• <strong>声调符号</strong>：显示标准拼音声调</p>
                  <p>• <strong>数字声调</strong>：用1-4数字表示声调</p>
                  <p>• <strong>语音播放</strong>：支持中文语音合成</p>
                </div>
                <div className="space-y-2">
                  <p>• <strong>多音字提示</strong>：显示多个读音选项</p>
                  <p>• <strong>多种格式</strong>：支持不同拼音输出格式</p>
                  <p>• <strong>实时转换</strong>：输入即时显示结果</p>
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
