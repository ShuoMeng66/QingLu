export type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error'

export interface OpenClawConfig {
  baseUrl: string
  token: string
  agent: string
}

export interface FollowUpActionMeta {
  label: string
  message?: string
  action_type?: string
  scene_type?: string
  party_size?: number
  selected_index?: number
}

export interface AssistantMessageMeta {
  payloadType?: string
  recommendationNames: string[]
  followUpActions: FollowUpActionMeta[]
  isProfileComplete?: boolean
  isMedicalSafety?: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  status?: 'done' | 'error' | 'aborted'
  /** Parsed from ---JSON_START--- block after stream completes */
  assistantMeta?: AssistantMessageMeta
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
