import type { ConnectionStatus } from '../types/openclaw'
import { QINGLU } from '../data/qingluAssets'

interface AppHeaderProps {
  page: 'home' | 'settings'
  status: ConnectionStatus
  onNavigate: (page: 'home' | 'settings') => void
}

export function AppHeader({ page, status, onNavigate }: AppHeaderProps) {
  return (
    <header className="hero">
      <div className="hero__brand">
        <div className="hero__logo hero__logo--avatar">
          <img src={QINGLU.avatar} alt="" />
        </div>
        <div>
          <p className="eyebrow">美团黑客松 · 赛道一</p>
          <h1>{QINGLU.name}</h1>
          <p className="hero__tagline">基于 OpenClaw 的健身人群本地生活全天候私人搭子</p>
        </div>
      </div>

      <div className="hero__actions">
        <div className={`status-pill status-pill--${status}`}>
          {status === 'checking' && '检测中'}
          {status === 'connected' && '已连接'}
          {status === 'error' && '连接失败'}
          {status === 'idle' && '未检测'}
        </div>

        <nav className="hero__nav">
          <button
            type="button"
            className={`nav-link ${page === 'home' ? 'nav-link--active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            对话
          </button>
          <button
            type="button"
            className={`nav-link ${page === 'settings' ? 'nav-link--active' : ''}`}
            onClick={() => onNavigate('settings')}
          >
            Settings
          </button>
        </nav>
      </div>
    </header>
  )
}
