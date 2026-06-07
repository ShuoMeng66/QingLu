import { ChatView } from '../components/ChatView'

import type { QuickPromptMeta } from '../components/ChatView'

import { useAppContext } from '../context/AppContext'
import { usePreferences } from '../context/PreferencesContext'
import { displayConversationTitle, getDefaultConversationTitle } from '../lib/i18n/chatCopy'

export function ChatPage() {
  const ctx = useAppContext()
  const { preferences } = usePreferences()

  const onSend = (text?: string, meta?: QuickPromptMeta) => {
    void ctx.handleSend(text, meta)
  }

  const title = displayConversationTitle(
    ctx.activeConversation?.title ?? getDefaultConversationTitle(preferences.locale),
    preferences.locale,
  )

  return (
    <ChatView
      title={title}
      messages={ctx.messages}
      input={ctx.input}
      loading={ctx.loading}
      connected={ctx.connected}
      demoPresentationEnabled={ctx.demoPresentationEnabled}
      status={ctx.status}
      statusMessage={ctx.statusMessage}
      clusterTurn={ctx.clusterTurn}
      yiqidongConfig={ctx.yiqidongConfig}
      activeConversation={ctx.activeConversation}
      historyConversations={ctx.historyConversations}
      allConversations={ctx.conversations}
      activeId={ctx.activeId}
      onInputChange={ctx.setInput}
      onSend={() => onSend()}
      onQuickPrompt={(text, meta) => onSend(text, meta)}
      onStop={ctx.handleStop}
      onRegenerate={ctx.handleRegenerate}
      onEditMessage={ctx.handleEditMessage}
      onRetryMessage={ctx.handleRetryMessage}
      onFollowUpAction={(action) => void ctx.handleFollowUpAction(action)}
      onMessageFeedback={ctx.submitFeedback}
      onYiqidongApply={ctx.handleYiqidongApply}
      onCreateConversation={ctx.createNewConversation}
      onSelectConversation={ctx.selectConversation}
      onDeleteConversation={ctx.deleteConversation}
      onOpenYiqidong={() => ctx.openYiqidongModal('settings')}
      yiqidongUnread={ctx.yiqidongUnread}
    />
  )
}
