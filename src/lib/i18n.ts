// 简化的国际化配置，不依赖next-intl

export const locales = ['en', 'zh-CN'] as const
export type Locale = typeof locales[number]

export const currencies = {
  'en': 'USD',
  'zh-CN': 'CNY'
} as const

export const currencySymbols = {
  USD: '$',
  CNY: '¥'
} as const