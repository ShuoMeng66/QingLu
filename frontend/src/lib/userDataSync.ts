import { loadAppPreferences, saveAppPreferences } from './appPreferences'
import {
  areMealRemindersEnabled,
  exportAllMealLogs,
  importAllMealLogs,
  setMealRemindersEnabled,
} from './mealLog'
import { loadYiqidongConfig, saveYiqidongConfig } from './yiqidong'
import { exportYiqidongLetters, importYiqidongLetters } from './yiqidongEnvelopes'
import { loadUserProfile, replaceUserProfile } from './userProfile'
import {
  exportConversationSyncState,
  importConversationSyncState,
  mergeConversationSyncStates,
  migrateLegacyConversationsForCurrentUser,
} from '../types/conversation'
import type { LegacyUserDataSnapshot, UserDataSnapshot } from '../types/userData'
import { USER_DATA_VERSION } from '../types/userData'

let applyingRemote = false

export function collectUserDataSnapshot(): UserDataSnapshot {
  return {
    version: USER_DATA_VERSION,
    profile: loadUserProfile(),
    yiqidong: loadYiqidongConfig(),
    mealLogs: exportAllMealLogs(),
    mealRemindersEnabled: areMealRemindersEnabled(),
    preferences: loadAppPreferences(),
    yiqidongLetters: exportYiqidongLetters(),
    conversations: exportConversationSyncState(),
  }
}

export function reconcileUserDataSnapshots(
  local: UserDataSnapshot,
  remote: UserDataSnapshot | LegacyUserDataSnapshot,
): UserDataSnapshot {
  const remoteConversations =
    remote.version === USER_DATA_VERSION && remote.conversations
      ? remote.conversations
      : null

  const conversations = remoteConversations
    ? mergeConversationSyncStates(local.conversations, remoteConversations)
    : local.conversations

  return {
    version: USER_DATA_VERSION,
    profile: { ...local.profile, ...remote.profile },
    yiqidong: { ...local.yiqidong, ...remote.yiqidong },
    mealLogs: { ...local.mealLogs, ...(remote.mealLogs ?? {}) },
    mealRemindersEnabled: remote.mealRemindersEnabled ?? local.mealRemindersEnabled,
    preferences: remote.preferences ?? local.preferences,
    yiqidongLetters: remote.yiqidongLetters ?? local.yiqidongLetters,
    conversations,
  }
}

export function applyUserDataSnapshot(snapshot: UserDataSnapshot | LegacyUserDataSnapshot) {
  migrateLegacyConversationsForCurrentUser()
  applyingRemote = true
  try {
    replaceUserProfile(snapshot.profile)
    saveYiqidongConfig(snapshot.yiqidong)
    importAllMealLogs(snapshot.mealLogs ?? {})
    setMealRemindersEnabled(snapshot.mealRemindersEnabled ?? true)
    saveAppPreferences(snapshot.preferences ?? loadAppPreferences())
    importYiqidongLetters(snapshot.yiqidongLetters ?? [])

    if (snapshot.version === USER_DATA_VERSION && snapshot.conversations) {
      importConversationSyncState(snapshot.conversations)
    }
  } finally {
    applyingRemote = false
  }
}

export function isUserDataSnapshot(
  value: unknown,
): value is UserDataSnapshot | LegacyUserDataSnapshot {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<UserDataSnapshot> & { version?: number }

  if (data.version === USER_DATA_VERSION) {
    return Boolean(data.profile && data.yiqidong && data.conversations)
  }

  if (data.version === 1) {
    return Boolean(data.profile && data.yiqidong)
  }

  return false
}

let pushTimer: number | null = null
let pendingPush: (() => Promise<void>) | null = null

export function scheduleUserDataPush(pushFn: () => Promise<void>, delayMs = 2000) {
  pendingPush = pushFn
  if (pushTimer != null) window.clearTimeout(pushTimer)
  pushTimer = window.setTimeout(() => {
    pushTimer = null
    void pendingPush?.()
    pendingPush = null
  }, delayMs)
}

export function flushUserDataPush() {
  if (pushTimer != null) {
    window.clearTimeout(pushTimer)
    pushTimer = null
  }
  void pendingPush?.()
  pendingPush = null
}

let notifyTimer: number | null = null

export function notifyUserDataChanged() {
  if (applyingRemote) return
  if (notifyTimer != null) window.clearTimeout(notifyTimer)
  notifyTimer = window.setTimeout(() => {
    notifyTimer = null
    window.dispatchEvent(new CustomEvent('qinglu:user-data-changed'))
  }, 500)
}
