import type { OpenClawConfig } from '../types/openclaw'
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../types/openclaw'

export function loadConfig(): OpenClawConfig {
  const defaults = { ...DEFAULT_CONFIG }

  // .env.local 中配置了 token 时，始终以环境变量为准（避免旧 localStorage 导致离线）
  if (import.meta.env.VITE_OPENCLAW_TOKEN?.trim()) {
    return defaults
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.config)
    if (!raw) return defaults

    const saved = JSON.parse(raw) as Partial<OpenClawConfig>
    return {
      baseUrl: saved.baseUrl?.trim() || defaults.baseUrl,
      token: saved.token?.trim() || defaults.token,
      agent: saved.agent?.trim() || defaults.agent,
    }
  } catch {
    return defaults
  }
}

export function saveConfig(config: OpenClawConfig): void {
  localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config))
}

export function getUserId(): string {
  let userId = localStorage.getItem(STORAGE_KEYS.userId)
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEYS.userId, userId)
  }
  return userId
}

export function createMessageId(): string {
  return crypto.randomUUID()
}
