import type { Conversation } from '../types/conversation'
import { formatConversationTime } from '../types/conversation'

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeId: string
  loading: boolean
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onCreate,
  onSelect,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <aside className="conversation-sidebar">
      <div className="conversation-sidebar__header">
        <div>
          <p className="eyebrow">对话</p>
          <h3>历史记录</h3>
        </div>
        <button type="button" className="btn btn--primary btn--compact" disabled={loading} onClick={onCreate}>
          新建对话
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <p className="conversation-empty">暂无历史对话</p>
        ) : (
          conversations.map((conversation) => {
            const preview =
              conversation.messages.find((message) => message.role === 'user')?.content ||
              '开始和轻鹭聊聊减脂与生活选择…'

            return (
              <div
                key={conversation.id}
                className={`conversation-item ${conversation.id === activeId ? 'conversation-item--active' : ''}`}
              >
                <button
                  type="button"
                  className="conversation-item__main"
                  disabled={loading}
                  onClick={() => onSelect(conversation.id)}
                >
                  <span className="conversation-item__title">{conversation.title}</span>
                  <span className="conversation-item__preview">{preview}</span>
                  <span className="conversation-item__time">
                    {formatConversationTime(conversation.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  className="conversation-item__delete"
                  aria-label={`删除对话 ${conversation.title}`}
                  disabled={loading}
                  onClick={() => onDelete(conversation.id)}
                >
                  ×
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
