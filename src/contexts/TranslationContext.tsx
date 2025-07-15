'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import language files
import zhCNMessages from '@/messages/zh-CN.json'
import enMessages from '@/messages/en.json'

type Messages = typeof zhCNMessages
type LocaleType = 'zh-CN' | 'en'

const messages: Record<LocaleType, Messages> = {
  'zh-CN': zhCNMessages,
  'en': enMessages
}

// Detect if browser language is Chinese (including simplified and traditional)
function detectChineseLanguage(): boolean {
  if (typeof window === 'undefined') return true // SSR fallback to Chinese
  
  const lang = navigator.language || navigator.languages?.[0] || 'en'
  return lang.startsWith('zh')
}

// Get default locale based on browser language
function getDefaultLocale(): LocaleType {
  return detectChineseLanguage() ? 'zh-CN' : 'en'
}

interface TranslationContextType {
  t: (path: string, variables?: Record<string, string | number>) => string
  locale: LocaleType
  switchLocale: (newLocale: LocaleType) => void
  isChineseLocale: boolean
  isClient: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [locale, setLocale] = useState<LocaleType>('zh-CN') // 默认使用中文，避免水合错误
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 只在客户端运行时检查localStorage和浏览器语言
    setIsClient(true)
    const saved = localStorage.getItem('NextName-locale') as LocaleType
    if (saved && (saved === 'zh-CN' || saved === 'en')) {
      setLocale(saved)
    } else {
      setLocale(getDefaultLocale())
    }
  }, [])

  useEffect(() => {
    // Save to localStorage when locale changes (only on client side)
    if (isClient) {
      localStorage.setItem('NextName-locale', locale)
    }
  }, [locale, isClient])

  const t = (path: string, variables?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let value: any = messages[locale]
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Fallback to English if path not found in current locale
        let fallback: any = messages['en']
        for (const fallbackKey of keys) {
          if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
            fallback = fallback[fallbackKey]
          } else {
            console.warn(`Translation key not found: ${path}`)
            return path
          }
        }
        value = fallback
        break
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${path}`)
      return path
    }

    // Handle variable substitution
    if (variables) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return variables[key]?.toString() || match
      })
    }
    
    return value
  }

  const switchLocale = (newLocale: LocaleType) => {
    setLocale(newLocale)
  }

  const value = {
    t,
    locale,
    switchLocale,
    isChineseLocale: locale === 'zh-CN',
    isClient
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslations() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationProvider')
  }
  return context
}

export type { LocaleType }