const STORAGE_KEY = 'qinglu.developer-mode-v1'

export function isDeveloperModeEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setDeveloperModeEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, '1')
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    window.dispatchEvent(new Event('qinglu:developer-mode-changed'))
  } catch {
    /* ignore quota / private mode */
  }
}
