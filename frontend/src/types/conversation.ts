import { getStoredUser } from '../lib/api/client'
import type { ChatMessage } from './openclaw'
import { STORAGE_KEYS } from './openclaw'
import { notifyUserDataChanged } from '../lib/userDataSync'

const LEGACY_CONVERSATIONS_KEY = STORAGE_KEYS.conversations

function conversationsStorageKey(): string {
  const userId = getStoredUser()?.id
  return userId ? `${STORAGE_KEYS.conversations}::${userId}` : LEGACY_CONVERSATIONS_KEY
}

export function activeIdStorageKey(): string {
  const userId = getStoredUser()?.id
  return userId
    ? `${STORAGE_KEYS.activeConversationId}::${userId}`
    : STORAGE_KEYS.activeConversationId
}

function primaryIdStorageKey(): string {
  const userId = getStoredUser()?.id
  return userId
    ? `${STORAGE_KEYS.primaryConversationId}::${userId}`
    : STORAGE_KEYS.primaryConversationId
}

/** 登录后把未登录时写在全局 key 里的对话迁到当前账号 */
export function migrateLegacyConversationsForCurrentUser(): void {
  const userId = getStoredUser()?.id
  if (!userId) return

  const scopedKey = `${STORAGE_KEYS.conversations}::${userId}`
  if (localStorage.getItem(scopedKey)) return

  const legacy = localStorage.getItem(LEGACY_CONVERSATIONS_KEY)
  if (!legacy) return

  localStorage.setItem(scopedKey, legacy)

  const legacyActive = localStorage.getItem(STORAGE_KEYS.activeConversationId)
  if (legacyActive) {
    localStorage.setItem(`${STORAGE_KEYS.activeConversationId}::${userId}`, legacyActive)
  }

  const legacyPrimary = localStorage.getItem(STORAGE_KEYS.primaryConversationId)
  if (legacyPrimary) {
    localStorage.setItem(`${STORAGE_KEYS.primaryConversationId}::${userId}`, legacyPrimary)
  }
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

export function deriveConversationTitle(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return '新对话'
  return normalized.length > 28 ? `${normalized.slice(0, 28)}…` : normalized
}

export function createEmptyConversation(): Conversation {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function loadConversations(): Conversation[] {
  migrateLegacyConversationsForCurrentUser()
  try {
    const raw = localStorage.getItem(conversationsStorageKey())
    if (!raw) return []

    const parsed = JSON.parse(raw) as Conversation[]
    return parsed
      .filter((item) => item?.id && Array.isArray(item.messages))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveConversations(conversations: Conversation[]): void {
  localStorage.setItem(conversationsStorageKey(), JSON.stringify(conversations))
  notifyUserDataChanged()
}

/** Seed local storage on first visit without triggering cloud sync. */
export function seedConversationsIfEmpty(conversations: Conversation[]): void {
  if (loadConversations().length > 0) return
  localStorage.setItem(conversationsStorageKey(), JSON.stringify(conversations))
}

export interface ConversationSyncState {
  conversations: Conversation[]
  activeConversationId: string | null
  primaryConversationId: string | null
}

export function exportConversationSyncState(): ConversationSyncState {
  const conversations = loadConversations()
  return {
    conversations,
    activeConversationId: localStorage.getItem(activeIdStorageKey()),
    primaryConversationId: localStorage.getItem(primaryIdStorageKey()),
  }
}

export function countConversationMessages(state: ConversationSyncState): number {
  return state.conversations.reduce(
    (sum, conversation) =>
      sum + conversation.messages.filter((message) => message.content?.trim()).length,
    0,
  )
}

/** 登录云同步：保留本地与云端里消息更多的那份，避免空云端覆盖聊天记录 */
export function mergeConversationSyncStates(
  local: ConversationSyncState,
  remote: ConversationSyncState,
): ConversationSyncState {
  const localCount = countConversationMessages(local)
  const remoteCount = countConversationMessages(remote)

  if (remoteCount === 0 && localCount > 0) return local
  if (localCount === 0 && remoteCount > 0) return remote

  const map = new Map<string, Conversation>()
  for (const conversation of [...local.conversations, ...remote.conversations]) {
    const existing = map.get(conversation.id)
    if (!existing) {
      map.set(conversation.id, conversation)
      continue
    }
    const pick =
      conversation.messages.length > existing.messages.length ||
      conversation.updatedAt > existing.updatedAt
        ? conversation
        : existing
    map.set(conversation.id, pick)
  }

  const conversations = [...map.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  const fallback = conversations.length > 0 ? conversations : [createEmptyConversation()]

  const activeConversationId =
    [local.activeConversationId, remote.activeConversationId].find(
      (id) => id && fallback.some((item) => item.id === id),
    ) ?? fallback[0].id

  const primaryConversationId =
    [local.primaryConversationId, remote.primaryConversationId].find(
      (id) => id && fallback.some((item) => item.id === id),
    ) ?? null

  return {
    conversations: fallback,
    activeConversationId,
    primaryConversationId,
  }
}

export function importConversationSyncState(state: ConversationSyncState): string {
  const conversations =
    Array.isArray(state.conversations) && state.conversations.length > 0
      ? state.conversations.filter((item) => item?.id && Array.isArray(item.messages))
      : [createEmptyConversation()]

  localStorage.setItem(conversationsStorageKey(), JSON.stringify(conversations))

  const activeId =
    state.activeConversationId &&
    conversations.some((item) => item.id === state.activeConversationId)
      ? state.activeConversationId
      : conversations[0].id

  localStorage.setItem(activeIdStorageKey(), activeId)

  if (
    state.primaryConversationId &&
    conversations.some((item) => item.id === state.primaryConversationId)
  ) {
    localStorage.setItem(primaryIdStorageKey(), state.primaryConversationId)
  } else {
    ensurePrimaryConversationId(conversations)
  }

  return activeId
}

export function ensurePrimaryConversationId(conversations: Conversation[]): string {
  const stored = localStorage.getItem(primaryIdStorageKey())
  if (stored && conversations.some((item) => item.id === stored)) {
    return stored
  }

  const oldest = [...conversations].sort((a, b) => a.createdAt - b.createdAt)[0]
  const primaryId = oldest?.id
  if (primaryId) {
    localStorage.setItem(primaryIdStorageKey(), primaryId)
  }
  return primaryId ?? ''
}

export function isPrimaryConversation(id: string, conversations: Conversation[]): boolean {
  const primaryId = ensurePrimaryConversationId(conversations)
  return Boolean(primaryId && id === primaryId)
}

export function formatConversationTime(
  timestamp: number,
  locale: string = 'zh-CN',
): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })
}
