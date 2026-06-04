import type { AppPreferences } from '../lib/appPreferences'
import type { MealLogEntry } from '../lib/mealLog'
import type { YiqidongConfig } from '../lib/yiqidong'
import type { YiqidongLetter } from '../lib/yiqidongEnvelopes'
import type { UserProfile } from '../lib/userProfile'
import type { SessionContext } from '../lib/sessionContext'
import type { ConversationSyncState } from './conversation'

export const USER_DATA_VERSION = 2 as const

export interface UserDataSnapshot {
  version: typeof USER_DATA_VERSION
  profile: UserProfile
  yiqidong: YiqidongConfig
  mealLogs: Record<string, MealLogEntry[]>
  mealRemindersEnabled: boolean
  preferences: AppPreferences
  yiqidongLetters: YiqidongLetter[]
  conversations: ConversationSyncState
  /** Multi-turn recommendation / follow-up state (optional for older snapshots) */
  sessionContext?: SessionContext
}

/** v1 cloud payloads (no conversations) — still accepted on login */
export interface LegacyUserDataSnapshot {
  version: 1
  profile: UserProfile
  yiqidong: YiqidongConfig
  mealLogs?: Record<string, MealLogEntry[]>
  mealRemindersEnabled?: boolean
  preferences?: AppPreferences
  yiqidongLetters?: YiqidongLetter[]
}

export interface AuthUser {
  id: string
  email: string
  displayName: string | null
}

export interface AuthSession {
  token: string
  user: AuthUser
}
