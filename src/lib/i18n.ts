import { createNavigation } from 'next-intl/navigation'

export const locales = ['en', 'zh-CN'] as const
export type Locale = typeof locales[number]

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales
})

export const currencies = {
  'en': 'USD',
  'zh-CN': 'CNY'
} as const

export const currencySymbols = {
  USD: '$',
  CNY: '¥'
} as const