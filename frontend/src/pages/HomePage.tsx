import { ChatView } from '../components/ChatView'

import type { QuickPromptMeta } from '../components/ChatView'

import type { ClusterTurn, MessageFeedback } from '../types/agentCluster'

import type { ConnectionStatus, ChatMessage } from '../types/openclaw'

import type { Conversation } from '../types/conversation'

import type { YiqidongConfig } from '../lib/yiqidong'



interface HomePageProps {

  conversationTitle: string

  messages: ChatMessage[]

  input: string

  loading: boolean

  connected: boolean

  status: ConnectionStatus

  clusterTurn: ClusterTurn

  yiqidongConfig: YiqidongConfig

  activeConversation: Conversation | undefined

  historyConversations: Conversation[]

  allConversations: Conversation[]

  activeId: string

  onInputChange: (value: string) => void

  onSend: (text?: string, meta?: QuickPromptMeta) => void

  onStop: () => void

  onRegenerate: () => void

  onEditMessage: (messageId: string, content: string) => void

  onRetryMessage: (messageId: string) => void

  onMessageFeedback: (messageId: string, vote: MessageFeedback) => void

  onYiqidongApply: (config: YiqidongConfig) => void

  onCreateConversation: () => void

  onSelectConversation: (id: string) => void

  onDeleteConversation: (id: string) => void
}



export function HomePage({

  conversationTitle,

  onSend,

  ...rest

}: HomePageProps) {

  return (

    <ChatView
      title={conversationTitle}
      onSend={() => onSend()}
      onQuickPrompt={(text, meta) => onSend(text, meta)}
      {...rest}
    />

  )

}


