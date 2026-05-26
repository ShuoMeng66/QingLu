import type { ConnectionStatus } from '../types/openclaw'
import type { Conversation } from '../types/conversation'
import { BRAND, SIDEBAR } from '../copy/ui'
import { QINGLU } from '../data/qingluAssets'
import { getConnectionStatusLabel } from '../lib/connectionLabel'
import { ConversationRow } from './ConversationRow'

export type AppPage = 'home' | 'settings' | 'yiqidong'

interface AppSidebarProps {
  page: AppPage
  status: ConnectionStatus
  yiqidongSummary: string
  activeConversation: Conversation | undefined
  historyConversations: Conversation[]
  activeId: string
  onNavigate: (page: AppPage) => void
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function AppSidebar({
  page,
  status,
  yiqidongSummary,
  activeConversation,
  historyConversations,
  activeId,
  onNavigate,
  onCreate,
  onSelect,
  onDelete,
}: AppSidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <button type="button" className="brand-mark pressable" onClick={() => onNavigate('home')}>
          <span className="brand-mark__icon brand-mark__icon--avatar">
            <img src={QINGLU.avatar} alt="" />
          </span>
          <span className="brand-mark__text">
            <strong>{BRAND.name}</strong>
            <span>{BRAND.tagline}</span>
          </span>
        </button>
        <span
          className={`connection-dot connection-dot--${status}`}
          title={getConnectionStatusLabel(status)}
        />
      </div>

      <button
        type="button"
        className={`yiqidong-entry pressable ${page === 'yiqidong' ? 'is-active' : ''}`}
        onClick={() => onNavigate('yiqidong')}
      >
        <span className="yiqidong-entry__icon">动</span>
        <span className="yiqidong-entry__text">
          <strong>{SIDEBAR.yiqidong}</strong>
          <span>{yiqidongSummary}</span>
        </span>
      </button>

      <button type="button" className="sidebar-new-chat pressable" onClick={onCreate}>
        <span className="sidebar-new-chat__icon">+</span>
        {SIDEBAR.newChat}
      </button>

      <div className="sidebar-conversations">
        <div className="sidebar-section-label">{SIDEBAR.currentSection}</div>
        <div className="conversation-list conversation-list--current">
          {activeConversation ? (
            <ConversationRow
              conversation={activeConversation}
              active
              current
              onSelect={onSelect}
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
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      </div>

      <div className="app-sidebar__footer">
        <button
          type="button"
          className={`sidebar-nav-item pressable ${page === 'home' ? 'sidebar-nav-item--active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          {SIDEBAR.navChat}
        </button>
        <button
          type="button"
          className={`sidebar-nav-item pressable ${page === 'settings' ? 'sidebar-nav-item--active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          {SIDEBAR.navSettings}
        </button>
      </div>
    </aside>
  )
}
