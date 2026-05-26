import { CHAT, SIDEBAR } from '../../copy/ui'

interface ChatTopBarProps {
  connected: boolean
  loading: boolean
  title: string
  onNewChat: () => void
  onOpenSettings: () => void
  onOpenMobileMenu: () => void
}

export function ChatTopBar({
  connected,
  loading,
  title,
  onNewChat,
  onOpenSettings,
  onOpenMobileMenu,
}: ChatTopBarProps) {
  const statusLabel = connected
    ? loading
      ? CHAT.statusClusterWorking
      : CHAT.statusOnline
    : CHAT.statusOffline

  return (
    <header className="chat-topbar-func">
      <a href="/" className="chat-topbar-func__back" aria-label="返回封面">
        ←
      </a>

      <div className="chat-topbar-func__center">
        <h1 className="chat-topbar-func__title">{title}</h1>
        <span className={`chat-topbar-func__status ${connected ? 'is-live' : ''}`}>
          {statusLabel}
        </span>
      </div>

      <div className="chat-topbar-func__actions">
        <button
          type="button"
          className="chat-topbar-func__btn"
          onClick={onNewChat}
          title={SIDEBAR.newChat}
        >
          +
        </button>
        <a href="/history" className="chat-topbar-func__btn" title={SIDEBAR.historySection}>
          ☰
        </a>
        <button
          type="button"
          className="chat-topbar-func__btn"
          onClick={onOpenSettings}
          title={SIDEBAR.navSettings}
        >
          ⚙
        </button>
        <button
          type="button"
          className="chat-topbar-func__btn chat-topbar-func__btn--menu md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="打开侧边栏"
        >
          ≡
        </button>
      </div>
    </header>
  )
}
