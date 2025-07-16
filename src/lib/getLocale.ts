import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

export type LocaleType = 'zh-CN' | 'en';

const SUPPORTED_LOCALES: LocaleType[] = ['zh-CN', 'en'];
const DEFAULT_LOCALE: LocaleType = 'zh-CN';

export function getLocale(): LocaleType {
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language');

  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => {
      const parts = lang.trim().split(';');
      return { code: parts[0], q: parts[1] ? parseFloat(parts[1].split('=')[1]) : 1.0 };
    });

    languages.sort((a, b) => b.q - a.q);

    for (const lang of languages) {
      if (lang.code.startsWith('zh')) return 'zh-CN';
      if (lang.code.startsWith('en')) return 'en';
    }
  }

  return DEFAULT_LOCALE;
}
