import type { ConnectionStatus } from '../../types/openclaw'
import type { Conversation } from '../../types/conversation'
import type { ClusterTurn } from '../../types/agentCluster'
import { BRAND, SIDEBAR } from '../../copy/ui'
import { QINGLU } from '../../data/qingluAssets'
import { getConnectionStatusLabel } from '../../lib/connectionLabel'
import { ConversationRow } from '../ConversationRow'
import { SquadAvatarStrip } from './SquadAvatarStrip'
import './AppMenuDrawer.css'

interface AppMenuDrawerProps {
  open: boolean
  status: ConnectionStatus
  clusterTurn: ClusterTurn
  activeConversation: Conversation | undefined
  historyConversations: Conversation[]
  activeId: string
  onClose: () => void
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AppMenuDrawer({
  open,
  status,
  clusterTurn,
  activeConversation,
  historyConversations,
  activeId,
  onClose,
  onCreate,
  onSelect,
  onDelete,
}: AppMenuDrawerProps) {
  if (!open) return null

  return (
    <div className="app-menu md:hidden" role="dialog" aria-modal="true" aria-label="对话列表">
      <button type="button" className="app-menu__backdrop" aria-label="关闭菜单" onClick={onClose} />
      <aside className="app-menu__panel">
        <header className="app-menu__header">
          <div className="app-menu__brand">
            <span className="app-menu__icon app-menu__icon--avatar">
              <img src={QINGLU.avatar} alt="" />
            </span>
            <div>
              <strong>{BRAND.name}</strong>
              <span>{BRAND.tagline}</span>
            </div>
          </div>
          <span
            className={`connection-dot connection-dot--${status}`}
            title={getConnectionStatusLabel(status)}
          />
        </header>

        <div className="mb-3">
          <SquadAvatarStrip clusterTurn={clusterTurn} compact />
        </div>

        <button type="button" className="sidebar-new-chat pressable" onClick={onCreate}>
          <span className="sidebar-new-chat__icon">+</span>
          {SIDEBAR.newChat}
        </button>

        <div className="sidebar-section-label">{SIDEBAR.currentSection}</div>
        <div className="conversation-list conversation-list--current">
          {activeConversation ? (
            <ConversationRow
              conversation={activeConversation}
              active
              current
              onSelect={(id) => {
                onSelect(id)
                onClose()
              }}
              onDelete={onDelete}
            />
          ) : (
            <p className="conversation-empty">{SIDEBAR.noConversation}</p>
          )}
        </div>

        <div className="sidebar-section-label sidebar-section-label--history">
          {SIDEBAR.historySection}
        </div>
        <div className="conversation-list conversation-list--history">
          {historyConversations.length === 0 ? (
            <p className="conversation-empty">{SIDEBAR.noHistory}</p>
          ) : (
            historyConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                onSelect={(id) => {
                  onSelect(id)
                  onClose()
                }}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  )
}
