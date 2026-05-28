/** Locale IDs — keep free of appPreferences/userDataSync to avoid circular imports. */

export type AppLocale = 'zh' | 'zh-HK' | 'zh-TW' | 'en' | 'ja' | 'ko'

export const VALID_LOCALES: AppLocale[] = ['zh', 'zh-HK', 'zh-TW', 'en', 'ja', 'ko']

export const LOCALE_BCP47: Record<AppLocale, string> = {
  zh: 'zh-CN',
  'zh-HK': 'zh-HK',
  'zh-TW': 'zh-TW',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (VALID_LOCALES as string[]).includes(value)
}
