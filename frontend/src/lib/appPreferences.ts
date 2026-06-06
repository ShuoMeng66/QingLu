import {
  isAppLocale,
  LOCALE_BCP47,
  VALID_LOCALES,
  type AppLocale,
} from './i18n/localeIds'
import { notifyUserDataChanged } from './userDataSync'

export type AppTheme = 'light' | 'dark'
export type { AppLocale }
export { LOCALE_BCP47, VALID_LOCALES }
export type AiTone = 'friendly' | 'professional' | 'coach'
export type AiDetail = 'concise' | 'balanced' | 'detailed'

export interface AiPreferences {
  tone: AiTone
  detail: AiDetail
  useEmoji: boolean
  citeNearby: boolean
  /** @deprecated 展示前质检常驻开启，不再提供用户开关 */
  outputGuard?: boolean
}

export interface AppPreferences {
  theme: AppTheme
  locale: AppLocale
  ai: AiPreferences
  mealReminders: boolean
  locationShare: boolean
}

const STORAGE_KEY = 'qinglu.app-preferences-v1'

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'light',
  locale: 'zh',
  ai: {
    tone: 'friendly',
    detail: 'balanced',
    useEmoji: true,
    citeNearby: true,
  },
  mealReminders: true,
  locationShare: true,
}

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES, ai: { ...DEFAULT_PREFERENCES.ai } }
    const parsed = JSON.parse(raw) as Partial<AppPreferences>
    const locale = isAppLocale(parsed.locale) ? parsed.locale : DEFAULT_PREFERENCES.locale
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      locale,
      ai: { ...DEFAULT_PREFERENCES.ai, ...parsed.ai },
    }
  } catch {
    return { ...DEFAULT_PREFERENCES, ai: { ...DEFAULT_PREFERENCES.ai } }
  }
}

export function saveAppPreferences(patch: Partial<AppPreferences>): AppPreferences {
  const current = loadAppPreferences()
  const next: AppPreferences = {
    ...current,
    ...patch,
    ai: patch.ai ? { ...current.ai, ...patch.ai } : current.ai,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme
}
