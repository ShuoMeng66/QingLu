import { useCallback, useEffect, useMemo, useState } from 'react'
import { isDefaultConversationTitle } from '../lib/i18n/chatCopy'
import { notifyUserDataChanged } from '../lib/userDataSync'
import {
  activeIdStorageKey,
  createEmptyConversation,
  deriveConversationTitle,
  loadConversations,
  migrateLegacyConversationsForCurrentUser,
  saveConversations,
  seedConversationsIfEmpty,
} from '../types/conversation'
import type { Conversation } from '../types/conversation'
import type { ChatMessage } from '../types/openclaw'

function reloadConversationState(): { conversations: Conversation[]; activeId: string } {
  migrateLegacyConversationsForCurrentUser()
  const stored = loadConversations()
  const conversations = stored.length > 0 ? stored : [createEmptyConversation()]
  const activeKey = activeIdStorageKey()
  const savedActiveId = localStorage.getItem(activeKey)
  const activeId =
    savedActiveId && conversations.some((item) => item.id === savedActiveId)
      ? savedActiveId
      : conversations[0].id
  localStorage.setItem(activeKey, activeId)
  return { conversations, activeId }
}

function getInitialState(): { conversations: Conversation[]; activeId: string } {
  const state = reloadConversationState()
  seedConversationsIfEmpty(state.conversations)
  return state
}

export interface DeleteConversationResult {
  createdNew: boolean
}

export function useConversations() {
  const initial = useMemo(() => getInitialState(), [])
  const [conversations, setConversations] = useState<Conversation[]>(initial.conversations)
  const [activeId, setActiveId] = useState(initial.activeId)

  useEffect(() => {
    const onApplied = () => {
      const next = reloadConversationState()
      setConversations(next.conversations)
      setActiveId(next.activeId)
    }
    window.addEventListener('burnpal:user-data-applied', onApplied)
    return () => window.removeEventListener('burnpal:user-data-applied', onApplied)
  }, [])

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId) ?? conversations[0],
    [activeId, conversations],
  )

  const historyConversations = useMemo(
    () =>
      conversations
        .filter((item) => item.id !== activeId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [activeId, conversations],
  )

  const persist = useCallback((next: Conversation[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt)
    setConversations(sorted)
    saveConversations(sorted)
  }, [])

  const selectConversation = useCallback((id: string) => {
    setActiveId((current) => {
      if (current === id) return current
      localStorage.setItem(activeIdStorageKey(), id)
      notifyUserDataChanged()
      return id
    })
  }, [])

  const createNewConversation = useCallback(() => {
    const conversation = createEmptyConversation()
    persist([conversation, ...conversations])
    selectConversation(conversation.id)
    return conversation.id
  }, [conversations, persist, selectConversation])

  const deleteConversation = useCallback(
    (id: string): DeleteConversationResult => {
      let next = conversations.filter((item) => item.id !== id)
      let createdNew = false

      if (next.length === 0) {
        next = [createEmptyConversation()]
        createdNew = true
      }

      persist(next)

      if (activeId === id) {
        selectConversation(next[0].id)
      }

      return { createdNew }
    },
    [activeId, conversations, persist, selectConversation],
  )

  const updateConversationMessages = useCallback(
    (id: string, updater: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[])) => {
      setConversations((current) => {
        const target = current.find((conversation) => conversation.id === id)
        if (!target) return current

        const messages =
          typeof updater === 'function' ? updater(target.messages) : updater
        const now = Date.now()
        const firstUserMessage = messages.find((message) => message.role === 'user')

        const next = current
          .map((conversation) => {
            if (conversation.id !== id) return conversation

            const title =
              isDefaultConversationTitle(conversation.title) && firstUserMessage
                ? deriveConversationTitle(firstUserMessage.content)
                : conversation.title

            return {
              ...conversation,
              title,
              messages,
              updatedAt: now,
            }
          })
          .sort((a, b) => b.updatedAt - a.updatedAt)

        saveConversations(next)
        return next
      })
    },
    [],
  )

  return {
    conversations,
    activeConversation,
    activeId,
    historyConversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    updateConversationMessages,
  }
}
