import { SYSTEM_ONBOARDING_SIGNAL } from './qingluSystemPrompt'
import { loadUserProfile } from './userProfile'

const PENDING_KEY = 'qinglu.pending-after-profile-v1'
const AUTO_FOLLOWUP_COUNT_KEY = 'qinglu.profile-auto-followup-count'

/** Guard against model repeatedly emitting profile_complete */
export const MAX_PROFILE_AUTO_FOLLOWUP_TURNS = 1

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
  localStorage.removeItem(AUTO_FOLLOWUP_COUNT_KEY)
}

export function canRunProfileAutoFollowup(): boolean {
  const count = Number(localStorage.getItem(AUTO_FOLLOWUP_COUNT_KEY) ?? '0')
  return count < MAX_PROFILE_AUTO_FOLLOWUP_TURNS
}

export function markProfileAutoFollowupRan(): void {
  const count = Number(localStorage.getItem(AUTO_FOLLOWUP_COUNT_KEY) ?? '0')
  localStorage.setItem(AUTO_FOLLOWUP_COUNT_KEY, String(count + 1))
}
