'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import language files
import zhCNMessages from '@/messages/zh-CN.json'
import enMessages from '@/messages/en.json'

export type LocaleType = 'zh-CN' | 'en'

type Messages = typeof zhCNMessages

const messages: Record<LocaleType, Messages> = {
  'zh-CN': zhCNMessages,
  'en': enMessages
}

// Client-side only function to get default locale
function getInitialLocale(serverLocale: LocaleType): LocaleType {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('NextName-locale') as LocaleType;
    if (saved && messages[saved]) {
      return saved;
    }
  }
  return serverLocale;
}

interface TranslationContextType {
  t: (path: string, variables?: Record<string, string | number>) => string
  locale: LocaleType
  switchLocale: (newLocale: LocaleType) => void
  isClient: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
  initialLocale: LocaleType
}

export function TranslationProvider({ children, initialLocale }: TranslationProviderProps) {
  const [locale, setLocale] = useState(() => getInitialLocale(initialLocale));
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
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
        let fallback: any = messages['en']
        for (const fallbackKey of keys) {
          if (fallback && typeof fallback === 'object' && fallbackKey in fallback) {
            fallback = fallback[fallbackKey]
          } else {
            return path
          }
        }
        value = fallback
        break
      }
    }
    
    if (typeof value !== 'string') {
      return path
    }

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
