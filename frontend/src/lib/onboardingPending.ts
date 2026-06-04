import { SYSTEM_ONBOARDING_SIGNAL } from './qingluSystemPrompt'
import { loadUserProfile } from './userProfile'

const PENDING_KEY = 'qinglu.pending-after-profile-v1'

export function rememberPendingUserQuestion(message: string): void {
  const trimmed = message.trim()
  if (!trimmed || trimmed === SYSTEM_ONBOARDING_SIGNAL) return
  if (loadUserProfile().profile_complete) return
  localStorage.setItem(PENDING_KEY, trimmed)
}

export function consumePendingUserQuestion(): string | null {
  const value = localStorage.getItem(PENDING_KEY)?.trim()
  localStorage.removeItem(PENDING_KEY)
  return value || null
}

export function clearPendingUserQuestion(): void {
  localStorage.removeItem(PENDING_KEY)
}
