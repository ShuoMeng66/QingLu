import type { ClusterTurn, FeedbackStats } from '../../types/agentCluster'
import { SQUAD_ROSTER } from '../../types/agentCluster'
import { QINGLU } from '../../data/qingluAssets'
import './AgentSquadPanel.css'

interface AgentSquadPanelProps {
  turn: ClusterTurn
  feedbackStats: FeedbackStats
}

export function AgentSquadPanel({ turn, feedbackStats }: AgentSquadPanelProps) {
  const agentMap = new Map(turn.agents.map((a) => [a.id, a]))
  const working = turn.agents.some((a) => a.status === 'working')

  return (
    <aside className="agent-squad" aria-label="轻鹭">
      <header className="agent-squad__header">
        <h2 className="agent-squad__title">{QINGLU.name}</h2>
        <p className="agent-squad__subtitle">饮食 · 热量 · 运动 · 个性化建议</p>
      </header>

      <div className="agent-squad__hero">
        <img
          src={QINGLU.avatar}
          alt={QINGLU.name}
          className={`agent-squad__portrait ${working ? 'agent-squad__portrait--active' : ''}`}
        />
      </div>

      <div className="agent-squad__grid">
        {SQUAD_ROSTER.map((meta) => {
          const state = agentMap.get(meta.id)
          const status = state?.status ?? 'idle'
          const active = status === 'working'

          return (
            <div
              key={meta.id}
              className={`agent-desk agent-desk--${status} ${active ? 'agent-desk--active' : ''}`}
            >
              <div className="agent-desk__meta">
                <span className="agent-desk__title">{meta.title}</span>
                <span className="agent-desk__role">{meta.role}</span>
              </div>
              <span className={`agent-desk__dot agent-desk__dot--${status}`} />
            </div>
          )
        })}
      </div>

      <div className="agent-squad__ppo">
        <span className="agent-squad__ppo-label">偏好学习</span>
        <span className="agent-squad__ppo-value">
          {feedbackStats.total === 0
            ? '点赞/点踩回答以优化组织方式'
            : `👍 ${feedbackStats.up} · 👎 ${feedbackStats.down}`}
        </span>
      </div>
    </aside>
  )
}
