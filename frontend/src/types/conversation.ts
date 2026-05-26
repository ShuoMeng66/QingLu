import type { ChatMessage } from './openclaw'
import { STORAGE_KEYS } from './openclaw'
import { notifyUserDataChanged } from '../lib/userDataSync'

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
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.conversations)
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
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations))
  notifyUserDataChanged()
}

/** Seed local storage on first visit without triggering cloud sync. */
export function seedConversationsIfEmpty(conversations: Conversation[]): void {
  if (loadConversations().length > 0) return
  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations))
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
    activeConversationId: localStorage.getItem(STORAGE_KEYS.activeConversationId),
    primaryConversationId: localStorage.getItem(STORAGE_KEYS.primaryConversationId),
  }
}

export function importConversationSyncState(state: ConversationSyncState): string {
  const conversations =
    Array.isArray(state.conversations) && state.conversations.length > 0
      ? state.conversations.filter((item) => item?.id && Array.isArray(item.messages))
      : [createEmptyConversation()]

  localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations))

  const activeId =
    state.activeConversationId &&
    conversations.some((item) => item.id === state.activeConversationId)
      ? state.activeConversationId
      : conversations[0].id

  localStorage.setItem(STORAGE_KEYS.activeConversationId, activeId)

  if (
    state.primaryConversationId &&
    conversations.some((item) => item.id === state.primaryConversationId)
  ) {
    localStorage.setItem(STORAGE_KEYS.primaryConversationId, state.primaryConversationId)
  } else {
    ensurePrimaryConversationId(conversations)
  }

  return activeId
}

export function ensurePrimaryConversationId(conversations: Conversation[]): string {
  const stored = localStorage.getItem(STORAGE_KEYS.primaryConversationId)
  if (stored && conversations.some((item) => item.id === stored)) {
    return stored
  }

  const oldest = [...conversations].sort((a, b) => a.createdAt - b.createdAt)[0]
  const primaryId = oldest?.id
  if (primaryId) {
    localStorage.setItem(STORAGE_KEYS.primaryConversationId, primaryId)
  }
  return primaryId ?? ''
}

export function isPrimaryConversation(id: string, conversations: Conversation[]): boolean {
  const primaryId = ensurePrimaryConversationId(conversations)
  return Boolean(primaryId && id === primaryId)
}

export function formatConversationTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}
