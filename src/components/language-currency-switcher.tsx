"use client"

import { Globe, Languages, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations, LocaleType } from '@/hooks/useTranslations'
import { useState, useEffect } from 'react'

interface LanguageSwitcherProps {
  currentLocale?: string // Keep for backward compatibility but not used
}

export function LanguageSwitcher({ 
  currentLocale
}: LanguageSwitcherProps) {
  const { t, locale, switchLocale, isClient } = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 避免水合错误
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // 服务器端渲染时显示默认状态
    return (
      <Button variant="outline" size="icon" className="relative">
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
          中
        </span>
      </Button>
    )
  }

  const languageNames: Record<LocaleType, string> = {
    'en': 'English',
    'zh-CN': '简体中文'
  }

  const languageShort: Record<LocaleType, string> = {
    'en': 'EN',
    'zh-CN': '中文'
  }

  const locales: LocaleType[] = ['zh-CN', 'en']

  const handleLocaleChange = (newLocale: LocaleType) => {
    switchLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{t('header.switchLanguage')}</span>
        {/* 显示当前语言标识 */}
        <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center">
          {locale === 'zh-CN' ? '中' : 'EN'}
        </span>
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-background border rounded-lg shadow-lg z-[9999] overflow-hidden">
          {locales.map((loc) => (
            <div
              key={loc}
              className="flex items-center space-x-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleLocaleChange(loc)}
            >
              <Globe className="h-4 w-4" />
              <span className="flex-1">{languageNames[loc]}</span>
              {loc === locale && (
                <span className="text-primary font-bold">✓</span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}