import { createContext, useContext } from 'react'
import type { QuickPromptMeta } from '../components/ChatView'
import type { ClusterTurn } from '../types/agentCluster'
import type { ConnectionStatus, OpenClawConfig, OpenClawModel } from '../types/openclaw'
import type { Conversation } from '../types/conversation'
import type { YiqidongConfig } from '../lib/yiqidong'

export interface AppContextValue {
  // Connection & config
  config: OpenClawConfig
  draftConfig: OpenClawConfig
  status: ConnectionStatus
  statusMessage: string
  models: OpenClawModel[]
  connected: boolean
  setDraftConfig: (next: OpenClawConfig) => void
  syncDraftFromActive: () => void
  handleSaveSettings: () => void
  handleResetSettings: () => void
  handleTestSettings: () => Promise<void>

  // Conversations
  activeConversation: Conversation | undefined
  activeId: string
  historyConversations: Conversation[]
  conversations: Conversation[]
  demoPresentationEnabled: boolean
  selectConversation: (id: string) => void
  createNewConversation: () => void
  deleteConversation: (id: string) => { createdNew: boolean }

  // Chat
  input: string
  setInput: (value: string) => void
  messages: import('../types/openclaw').ChatMessage[]
  loading: boolean
  handleSend: (text?: string, meta?: QuickPromptMeta) => Promise<void>
  handleFollowUpAction: (action: import('../types/openclaw').FollowUpActionMeta) => Promise<void>
  handleStop: () => void
  handleRegenerate: () => void
  handleEditMessage: (messageId: string, content: string) => void
  handleRetryMessage: (messageId: string) => void

  // Agent cluster
  clusterTurn: ClusterTurn
  submitFeedback: (messageId: string, vote: import('../types/agentCluster').MessageFeedback) => void

  // Yiqidong
  yiqidongConfig: YiqidongConfig
  yiqidongUnread: number
  handleYiqidongApply: (config: YiqidongConfig) => void
  openYiqidongModal: (tab: 'inbox' | 'settings', letterId?: string | null) => void
  questLetter: import('../lib/yiqidongEnvelopes').YiqidongLetter | null | undefined
  handleQuestAcknowledge: (letterId: string) => void
  handleQuestDismiss: (letterId: string) => void

  // User profile & meal
  userProfile: import('../lib/userProfile').UserProfile
  refreshUserProfile: () => void
  mealRemindersEnabled: boolean
}

export const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return ctx
}

/** Safe when page is outside AppProvider (e.g. legacy routes). */
export function useOptionalAppContext(): AppContextValue | null {
  return useContext(AppContext)
}

export const AppContextProvider = AppContext.Provider
