/** One-time migration from burnpal.* localStorage keys to qinglu.* */

const KEY_MAP: Record<string, string> = {
  'burnpal.meal-log-v1': 'qinglu.meal-log-v1',
  'burnpal.meal-reminders-v1': 'qinglu.meal-reminders-v1',
  'burnpal.meal-reminders-enabled': 'qinglu.meal-reminders-enabled',
  'burnpal.venue-geocode-v1': 'qinglu.venue-geocode-v1',
  'burnpal.user-profile-v1': 'qinglu.user-profile-v1',
  'burnpal.today-snapshot-v1': 'qinglu.today-snapshot-v1',
  'burnpal.discovery-dismissed': 'qinglu.discovery-dismissed',
  'burnpal.app-preferences-v1': 'qinglu.app-preferences-v1',
  'burnpal.auth.token': 'qinglu.auth.token',
  'burnpal.auth.user': 'qinglu.auth.user',
  'burnpal.nearby-recommendations-v1': 'qinglu.nearby-recommendations-v1',
  'burnpal.chat.historyCollapsed': 'qinglu.chat.historyCollapsed',
  'burnpal.chat.dashboardCollapsed': 'qinglu.chat.dashboardCollapsed',
  'burnpal.user-location-v2': 'qinglu.user-location-v2',
  'burnpal.venue-facade-v1': 'qinglu.venue-facade-v1',
}

let migrated = false

export function migrateBurnpalStorageKeys(): void {
  if (migrated || typeof localStorage === 'undefined') return
  migrated = true
  for (const [oldKey, newKey] of Object.entries(KEY_MAP)) {
    try {
      const raw = localStorage.getItem(oldKey)
      if (raw == null) continue
      if (localStorage.getItem(newKey) == null) {
        localStorage.setItem(newKey, raw)
      }
      localStorage.removeItem(oldKey)
    } catch {
      /* ignore quota / private mode */
    }
  }
}
