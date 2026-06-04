import { Link } from 'react-router-dom'
import { SquadAvatarStrip } from '../components/layout/SquadAvatarStrip'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { BRAND, CONNECTION_STATUS_LABEL, EMPTY_STATE, FOCUS_PILLARS, SIDEBAR } from '../copy/ui'
import { getConnectionStatusLabel } from '../lib/connectionLabel'
import { useOptionalAppContext } from '../context/AppContext'

export function DashboardPage() {
  const {
    status,
    connected,
    clusterTurn,
    activeConversation,
    yiqidongUnread,
    createNewConversation,
    openYiqidongModal,
  } = useOptionalAppContext() ?? {
    status: 'idle' as const,
    connected: false,
    clusterTurn: {
      phase: 'idle' as const,
      plan: null,
      score: null,
      userMessage: '',
      agents: [],
    },
    activeConversation: undefined,
    yiqidongUnread: 0,
    createNewConversation: () => {},
    openYiqidongModal: () => {},
  }

  return (
    <div className="page page--dashboard">
      <section className="page-hero">
        <p className="eyebrow">欢迎回来</p>
        <h1 className="page-hero__title">{BRAND.name}</h1>
        <p className="page-hero__lead">{BRAND.description}</p>
        <div className="page-hero__status">
          <span className={`connection-pill connection-pill--${status}`}>
            {getConnectionStatusLabel(status)}
          </span>
          {connected && (
            <span className="page-hero__status-note">{CONNECTION_STATUS_LABEL.connected}</span>
          )}
        </div>
      </section>

      <SquadAvatarStrip clusterTurn={clusterTurn} />

      <div className="dashboard-grid">
        <Card hover className="dashboard-card">
          <span className="dashboard-card__icon">💬</span>
          <h2 className="dashboard-card__title">开始对话</h2>
          <p className="dashboard-card__text">
            {activeConversation
              ? `继续「${activeConversation.title}」`
              : EMPTY_STATE.lead}
          </p>
          <div className="dashboard-card__actions">
            <Link to="/chat">
              <Button variant="primary">进入对话</Button>
            </Link>
            <Button variant="ghost" onClick={createNewConversation}>
              {SIDEBAR.newChat}
            </Button>
          </div>
        </Card>

        <Card hover className="dashboard-card">
          <span className="dashboard-card__icon">✉</span>
          <h2 className="dashboard-card__title">{SIDEBAR.yiqidong}</h2>
          <p className="dashboard-card__text">
            {yiqidongUnread > 0
              ? `你有 ${yiqidongUnread} 封未读运动信件`
              : '设置提醒，让运动成为日常'}
          </p>
          <div className="dashboard-card__actions">
            <Link to="/quests">
              <Button variant="secondary">查看任务</Button>
            </Link>
            <Button variant="ghost" onClick={() => openYiqidongModal('inbox')}>
              信箱
            </Button>
          </div>
        </Card>

        <Card hover className="dashboard-card">
          <span className="dashboard-card__icon">⚙</span>
          <h2 className="dashboard-card__title">{SIDEBAR.navSettings}</h2>
          <p className="dashboard-card__text">连接 OpenClaw、选择模型与开发者选项</p>
          <div className="dashboard-card__actions">
            <Link to="/settings">
              <Button variant="ghost">打开设置</Button>
            </Link>
          </div>
        </Card>
      </div>

      <section className="dashboard-pillars">
        <h2 className="dashboard-pillars__label">{EMPTY_STATE.todayLabel}</h2>
        <ul className="dashboard-pillars__list">
          {FOCUS_PILLARS.map((pillar) => (
            <li key={pillar.id}>
              <Card padding="sm" className="dashboard-pillar">
                <span className="dashboard-pillar__icon">{pillar.icon}</span>
                <div>
                  <strong>{pillar.label}</strong>
                  <span>{pillar.hint}</span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
