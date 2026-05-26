import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppMenuDrawer } from './AppMenuDrawer'
import { AppNav } from './AppNav'
import { WorkspaceSidebar } from './WorkspaceSidebar'
import { useAppContext } from '../../context/AppContext'
import '../../styles/chat-shell.css'

export function ChatShell() {
  const [navOpen, setNavOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const ctx = useAppContext()

  return (
    <div className="chat-shell">
      <div className="app-shell__bg" aria-hidden="true" />

      <header className="chat-shell__header app-shell__header">
        <AppNav
          mobileOpen={navOpen}
          onMobileToggle={() => setNavOpen((open) => !open)}
          yiqidongUnread={ctx.yiqidongUnread}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      </header>

      <div className="chat-shell__frame">
        <WorkspaceSidebar
          status={ctx.status}
          clusterTurn={ctx.clusterTurn}
          activeConversation={ctx.activeConversation}
          historyConversations={ctx.historyConversations}
          activeId={ctx.activeId}
          onCreate={ctx.createNewConversation}
          onSelect={ctx.selectConversation}
          onDelete={ctx.deleteConversation}
        />

        <div className="chat-shell__main">
          <Outlet />
        </div>
      </div>

      <AppMenuDrawer
        open={sidebarOpen}
        status={ctx.status}
        clusterTurn={ctx.clusterTurn}
        activeConversation={ctx.activeConversation}
        historyConversations={ctx.historyConversations}
        activeId={ctx.activeId}
        onClose={() => setSidebarOpen(false)}
        onCreate={() => {
          ctx.createNewConversation()
          setSidebarOpen(false)
        }}
        onSelect={ctx.selectConversation}
        onDelete={ctx.deleteConversation}
      />
    </div>
  )
}
