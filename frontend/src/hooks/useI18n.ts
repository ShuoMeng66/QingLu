import { usePreferences } from '../context/PreferencesContext'
import type { MessageKey } from '../lib/i18n/messages'

export function useI18n() {
  const { preferences, t } = usePreferences()
  return {
    locale: preferences.locale,
    t: (key: MessageKey, params?: Record<string, string | number>) => t(key, params),
  }
}
