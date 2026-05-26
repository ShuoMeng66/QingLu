import { useNavigate } from 'react-router-dom'
import { ConversationRow } from '../components/ConversationRow'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SIDEBAR } from '../copy/ui'
import { useAppContext } from '../context/AppContext'

export function HistoryPage() {
  const navigate = useNavigate()
  const {
    activeConversation,
    historyConversations,
    activeId,
    createNewConversation,
    selectConversation,
    deleteConversation,
  } = useAppContext()

  const handleSelect = (id: string) => {
    selectConversation(id)
    navigate('/chat')
  }

  const handleCreate = () => {
    createNewConversation()
    navigate('/chat')
  }

  return (
    <div className="page page--history">
      <header className="page-header">
        <div>
          <p className="eyebrow">对话</p>
          <h1 className="page-header__title">{SIDEBAR.historySection}</h1>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          + {SIDEBAR.newChat}
        </Button>
      </header>

      <Card className="history-section">
        <h2 className="history-section__label">{SIDEBAR.currentSection}</h2>
        {activeConversation ? (
          <ConversationRow
            conversation={activeConversation}
            active
            current
            onSelect={handleSelect}
            onDelete={deleteConversation}
          />
        ) : (
          <p className="history-empty">{SIDEBAR.noConversation}</p>
        )}
      </Card>

      <Card className="history-section">
        <h2 className="history-section__label">{SIDEBAR.historySection}</h2>
        {historyConversations.length === 0 ? (
          <p className="history-empty">{SIDEBAR.noHistory}</p>
        ) : (
          <div className="conversation-list">
            {historyConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={handleSelect}
                onDelete={deleteConversation}
              />
            ))}
          </div>
        )}
      </Card>

      <p className="page-footer-hint">
        选择对话后将跳转到{' '}
        <a href="/chat" className="page-footer-hint__link">
          对话页
        </a>
      </p>
    </div>
  )
}
