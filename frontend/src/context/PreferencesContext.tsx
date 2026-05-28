import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyTheme,
  loadAppPreferences,
  saveAppPreferences,
  type AiPreferences,
  LOCALE_BCP47,
  type AppLocale,
  type AppPreferences,
  type AppTheme,
} from '../lib/appPreferences'
import { translate, type MessageKey } from '../lib/i18n/messages'
import { areMealRemindersEnabled, setMealRemindersEnabled } from '../lib/mealLog'

interface PreferencesContextValue {
  preferences: AppPreferences
  setTheme: (theme: AppTheme) => void
  setLocale: (locale: AppLocale) => void
  setAiPreferences: (patch: Partial<AiPreferences>) => void
  setMealReminders: (enabled: boolean) => void
  setLocationShare: (enabled: boolean) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences())

  useEffect(() => {
    applyTheme(preferences.theme)
    document.documentElement.lang = LOCALE_BCP47[preferences.locale]
  }, [preferences.theme, preferences.locale])

  useEffect(() => {
    const reload = () => setPreferences(loadAppPreferences())
    window.addEventListener('burnpal:user-data-applied', reload)
    return () => window.removeEventListener('burnpal:user-data-applied', reload)
  }, [])

  useEffect(() => {
    const mealEnabled = areMealRemindersEnabled()
    if (mealEnabled !== preferences.mealReminders) {
      setPreferences((current) => ({ ...current, mealReminders: mealEnabled }))
    }
  }, [])

  const persist = useCallback((patch: Partial<AppPreferences>) => {
    const next = saveAppPreferences(patch)
    setPreferences(next)
    return next
  }, [])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setTheme: (theme) => persist({ theme }),
      setLocale: (locale) => persist({ locale }),
      setAiPreferences: (patch) =>
        persist({ ai: { ...preferences.ai, ...patch } }),
      setMealReminders: (mealReminders) => {
        setMealRemindersEnabled(mealReminders)
        persist({ mealReminders })
      },
      setLocationShare: (locationShare) => persist({ locationShare }),
      t: (key, params) => translate(preferences.locale, key, params),
    }),
    [preferences, persist],
  )

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
