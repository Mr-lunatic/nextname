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

import { getLocale } from '@/lib/getLocale';

// Get default locale based on server-side detection or client-side fallback
function getDefaultLocale(): LocaleType {
  if (typeof window !== 'undefined') {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    return lang.startsWith('zh') ? 'zh-CN' : 'en';
  }
  // This function will be more for client-side fallback now
  return 'zh-CN';
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
  const [locale, setLocale] = useState<LocaleType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('NextName-locale') as LocaleType;
      if (saved && (saved === 'zh-CN' || saved === 'en')) {
        return saved;
      }
      return getDefaultLocale();
    }
    return 'zh-CN'; // Default for SSR
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

export { getLocale };
export type { LocaleType }