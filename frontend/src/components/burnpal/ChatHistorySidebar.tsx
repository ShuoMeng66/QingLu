import { Info, MessageSquarePlus, Settings, Trash2, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Conversation } from '../../types/conversation'
import { formatConversationTime } from '../../types/conversation'
import { useI18n } from '../../hooks/useI18n'
import { displayConversationTitle } from '../../lib/i18n/chatCopy'
import { BurnPalLogo } from './BurnPalLogo'

interface ChatHistorySidebarProps {
  activeConversation: Conversation | undefined
  historyConversations: Conversation[]
  activeId: string
  loading?: boolean
  onCreate: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onOpenYiqidong?: () => void
  yiqidongUnread?: number
  className?: string
}

function HistoryItem({
  conversation,
  active,
  current,
  onSelect,
  onDelete,
}: {
  conversation: Conversation
  active: boolean
  current?: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { locale, t } = useI18n()
  const preview =
    conversation.messages.find((message) => message.role === 'user')?.content ||
    t('sidebar.previewFallback')
  const title = displayConversationTitle(conversation.title, locale)

  return (
    <div
      className={`sidebar-history-item group flex items-start gap-1 rounded-2xl px-2 py-1.5 transition-colors ${
        active ? 'sidebar-history-item--active bg-white/70' : 'sidebar-history-item--idle hover:bg-white/50'
      }`}
    >
      <button
        type="button"
        className="min-w-0 flex-1 px-2 py-1 text-left"
        onClick={() => onSelect(conversation.id)}
      >
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-body-primary">{title}</p>
          {current && (
            <span className="shrink-0 rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-lime-700">
              {t('sidebar.badgeCurrent')}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-body-secondary">{preview}</p>
        <p className="mt-1 text-[10px] text-body-secondary/80">
          {formatConversationTime(conversation.updatedAt)}
        </p>
      </button>
      <button
        type="button"
        className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 opacity-0 transition-opacity hover:bg-white/80 hover:text-red-400 group-hover:opacity-100"
        aria-label={t('sidebar.deleteConversation', { title })}
        onClick={() => onDelete(conversation.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ChatHistorySidebar({
  activeConversation,
  historyConversations,
  activeId,
  loading = false,
  onCreate,
  onSelect,
  onDelete,
  onOpenYiqidong,
  yiqidongUnread = 0,
  className = '',
}: ChatHistorySidebarProps) {
  const { t } = useI18n()

  return (
    <aside
      className={`flex h-full w-[280px] shrink-0 flex-col overflow-hidden burnpal-shell-panel ${className}`}
    >
      <div className="px-4 py-4">
        <Link to="/chat">
          <BurnPalLogo compact />
        </Link>
      </div>

      <div className="burnpal-shell-divider" aria-hidden="true" />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <button
          type="button"
          disabled={loading}
          className="btn-vitality flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
          onClick={onCreate}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {t('sidebar.newChat')}
        </button>

        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-body-secondary/70">
            {t('sidebar.current')}
          </p>
          <div className="mt-1">
            {activeConversation ? (
              <HistoryItem
                conversation={activeConversation}
                active={activeConversation.id === activeId}
                current
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ) : (
              <p className="px-3 py-2 text-xs text-body-secondary">{t('sidebar.noConversation')}</p>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-body-secondary/70">
            {t('sidebar.history')}
          </p>
          <div className="burnpal-scroll-hidden mt-1 min-h-0 flex-1 overflow-y-auto">
            {historyConversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-body-secondary">{t('sidebar.noHistory')}</p>
            ) : (
              historyConversations.map((conversation) => (
                <HistoryItem
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
      </div>

      <div className="burnpal-shell-divider" aria-hidden="true" />

      <div className="mt-auto p-3">
        <nav className="flex flex-col gap-1">
          {onOpenYiqidong && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-body-secondary hover:bg-white/50 dark:hover:bg-white/5"
              onClick={onOpenYiqidong}
            >
              <Zap className="h-4 w-4" />
              {t('sidebar.yiqidong')}
              {yiqidongUnread > 0 && (
                <span className="ml-auto rounded-full bg-lime-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {yiqidongUnread}
                </span>
              )}
            </button>
          )}
          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-body-secondary hover:bg-white/50 dark:hover:bg-white/5"
          >
            <Settings className="h-4 w-4" />
            {t('sidebar.settings')}
          </Link>
          <Link
            to="/about"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-body-secondary hover:bg-white/50 dark:hover:bg-white/5"
          >
            <Info className="h-4 w-4" />
            {t('sidebar.about')}
          </Link>
        </nav>
      </div>
    </aside>
  )
}
