export type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error'

export interface OpenClawConfig {
  baseUrl: string
  token: string
  agent: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  status?: 'done' | 'error' | 'aborted'
}

export type ApiChatRole = 'user' | 'assistant' | 'system'

export interface ApiChatMessage {
  role: ApiChatRole
  content: string
}

export interface OpenClawModel {
  id: string
  object?: string
  owned_by?: string
}

export interface ConnectionResult {
  ok: boolean
  models: OpenClawModel[]
  message: string
}

export const DEFAULT_CONFIG: OpenClawConfig = {
  baseUrl: import.meta.env.VITE_OPENCLAW_BASE_URL || '/openclaw-api/v1',
  token: import.meta.env.VITE_OPENCLAW_TOKEN || '',
  agent: import.meta.env.VITE_OPENCLAW_AGENT || 'deepseek-v4-flash',
}

export const STORAGE_KEYS = {
  config: 'xiaozhua.openclaw.config',
  userId: 'xiaozhua.openclaw.userId',
  conversations: 'xiaozhua.conversations',
  activeConversationId: 'xiaozhua.activeConversationId',
  primaryConversationId: 'xiaozhua.primaryConversationId',
} as const
