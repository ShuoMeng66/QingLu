import type { ChatMessage } from '../types/openclaw'
import type { Conversation } from '../types/conversation'

const STORAGE_KEY = 'qinglu.demo-presentation-v1'
export const DEMO_PRESENTATION_CONVERSATION_ID = 'demo-presentation-main'

interface DemoPresentationState {
  enabled: boolean
  savedNormalActiveId: string | null
  conversation: Conversation
}

function defaultConversation(): Conversation {
  const now = Date.now()
  return {
    id: DEMO_PRESENTATION_CONVERSATION_ID,
    title: 'Demo · 小明',
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
}

function loadState(): DemoPresentationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        enabled: false,
        savedNormalActiveId: null,
        conversation: defaultConversation(),
      }
    }
    const parsed = JSON.parse(raw) as Partial<DemoPresentationState>
    return {
      enabled: Boolean(parsed.enabled),
      savedNormalActiveId:
        typeof parsed.savedNormalActiveId === 'string' ? parsed.savedNormalActiveId : null,
      conversation: parsed.conversation?.id
        ? (parsed.conversation as Conversation)
        : defaultConversation(),
    }
  } catch {
    return {
      enabled: false,
      savedNormalActiveId: null,
      conversation: defaultConversation(),
    }
  }
}

function saveState(state: DemoPresentationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event('qinglu:demo-presentation-changed'))
}

export function isDemoPresentationEnabled(): boolean {
  return loadState().enabled
}

export function getDemoPresentationConversation(): Conversation {
  return loadState().conversation
}

export function getSavedNormalActiveId(): string | null {
  return loadState().savedNormalActiveId
}

export function setDemoPresentationEnabled(
  enabled: boolean,
  savedNormalActiveId?: string | null,
): DemoPresentationState {
  const current = loadState()
  const next: DemoPresentationState = {
    ...current,
    enabled,
    savedNormalActiveId:
      savedNormalActiveId !== undefined ? savedNormalActiveId : current.savedNormalActiveId,
  }
  saveState(next)
  return next
}

export function updateDemoPresentationMessages(
  next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
): Conversation {
  const state = loadState()
  const messages =
    typeof next === 'function' ? next(state.conversation.messages) : next
  const conversation: Conversation = {
    ...state.conversation,
    messages,
    updatedAt: Date.now(),
  }
  saveState({ ...state, conversation })
  return conversation
}

export function resetDemoPresentationConversation(): Conversation {
  const state = loadState()
  const conversation = defaultConversation()
  saveState({ ...state, conversation })
  return conversation
}

export function touchDemoConversationTitle(firstUserLine: string) {
  const state = loadState()
  const title = firstUserLine.replace(/\s+/g, ' ').trim().slice(0, 24) || state.conversation.title
  if (state.conversation.title === title) return
  saveState({
    ...state,
    conversation: { ...state.conversation, title, updatedAt: Date.now() },
  })
}
