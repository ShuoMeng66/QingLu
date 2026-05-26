import type { Conversation } from '../types/conversation'
import { formatConversationTime } from '../types/conversation'

interface ConversationRowProps {
  conversation: Conversation
  active: boolean
  current?: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function ConversationRow({
  conversation,
  active,
  current = false,
  onSelect,
  onDelete,
}: ConversationRowProps) {
  return (
    <div
      className={`conversation-item ${active ? 'conversation-item--active' : ''} ${current ? 'conversation-item--current' : ''}`}
    >
      <button
        type="button"
        className="conversation-item__main pressable"
        onClick={() => onSelect(conversation.id)}
      >
        <span className="conversation-item__title-row">
          <span className="conversation-item__title">{conversation.title}</span>
          {current && <span className="conversation-item__badge">当前</span>}
        </span>
        <span className="conversation-item__meta">
          {formatConversationTime(conversation.updatedAt)}
        </span>
      </button>
      <button
        type="button"
        className="conversation-item__delete pressable"
        aria-label={`删除对话 ${conversation.title}`}
        onClick={() => onDelete(conversation.id)}
      >
        ×
      </button>
    </div>
  )
}
