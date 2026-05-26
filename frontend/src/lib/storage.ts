import type { OpenClawConfig } from '../types/openclaw'
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../types/openclaw'

/** Direct serverless path — avoids /openclaw-api rewrite + SPA fallback conflicts on Vercel */
const PRODUCTION_PROXY_BASE = '/api/openclaw/v1'

function resolveProductionBaseUrl(): string {
  const envBase = import.meta.env.VITE_OPENCLAW_BASE_URL?.trim()
  if (!envBase) return PRODUCTION_PROXY_BASE
  if (envBase.startsWith('/openclaw-api')) return PRODUCTION_PROXY_BASE
  return envBase
}

function productionConfig(): OpenClawConfig {
  return {
    baseUrl: resolveProductionBaseUrl(),
    token: '',
    agent: import.meta.env.VITE_OPENCLAW_AGENT?.trim() || DEFAULT_CONFIG.agent,
  }
}

export function loadConfig(): OpenClawConfig {
  if (import.meta.env.PROD) {
    return productionConfig()
  }

  const defaults = { ...DEFAULT_CONFIG }
  const envBaseUrl = import.meta.env.VITE_OPENCLAW_BASE_URL?.trim()

  if (import.meta.env.VITE_OPENCLAW_TOKEN?.trim() || envBaseUrl) {
    return {
      baseUrl: envBaseUrl || defaults.baseUrl,
      token: defaults.token,
      agent: import.meta.env.VITE_OPENCLAW_AGENT?.trim() || defaults.agent,
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.config)
    if (!raw) return defaults

    const saved = JSON.parse(raw) as Partial<OpenClawConfig>
    const savedBase = saved.baseUrl?.trim()
    const baseUrl =
      defaults.baseUrl.startsWith('/') && savedBase && !savedBase.startsWith('/')
        ? defaults.baseUrl
        : savedBase || defaults.baseUrl

    return {
      baseUrl,
      token: saved.token?.trim() || defaults.token,
      agent: saved.agent?.trim() || defaults.agent,
    }
  } catch {
    return defaults
  }
}

export function saveConfig(config: OpenClawConfig): void {
  if (import.meta.env.PROD) return
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
