import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ParticleCanvas } from '../ParticleCanvas'
import { AppNav } from './AppNav'
import { useAppContext } from '../../context/AppContext'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { yiqidongUnread } = useAppContext()

  return (
    <div className="app-shell">
      <div className="app-shell__bg" aria-hidden="true" />
      <ParticleCanvas />

      <header className="app-shell__header">
        <AppNav
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((open) => !open)}
          yiqidongUnread={yiqidongUnread}
        />
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  )
}
