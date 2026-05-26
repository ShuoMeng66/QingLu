import { useMemo } from 'react'
import type { ClusterTurn } from '../../types/agentCluster'
import { SQUAD_ROSTER } from '../../types/agentCluster'
import type { YiqidongConfig } from '../../lib/yiqidong'
import { BRAND, FOCUS_PILLARS } from '../../copy/ui'
import { YiqidongEntryButton } from '../yiqidong/YiqidongEntryButton'
import './FatLossPanel.css'

interface FatLossPanelProps {
  clusterTurn: ClusterTurn
  yiqidongConfig: YiqidongConfig
  yiqidongUnread: number
  onOpenYiqidongSettings: () => void
  onOpenYiqidongInbox: () => void
}

const PIPELINE_IDS = ['lead', 'planner', 'executor', 'scorer'] as const

const STATUS_LABEL: Record<string, string> = {
  idle: '待命',
  working: '进行中',
  done: '完成',
  rest: '休息',
}

export function FatLossPanel({
  clusterTurn,
  yiqidongConfig,
  yiqidongUnread,
  onOpenYiqidongSettings,
  onOpenYiqidongInbox,
}: FatLossPanelProps) {
  const agentMap = useMemo(
    () => new Map(clusterTurn.agents.map((agent) => [agent.id, agent])),
    [clusterTurn.agents],
  )

  const focusHint =
    clusterTurn.plan?.focus ??
    (clusterTurn.phase === 'idle' ? '从饮食、热量与运动开始聊' : '正在整理你的问题…')

  return (
    <aside className="fat-loss-panel" aria-label="减脂助手">
      <header className="fat-loss-panel__header">
        <div className="fat-loss-panel__brand">
          <span className="fat-loss-panel__eyebrow">减脂助手</span>
          <h2 className="fat-loss-panel__title">{BRAND.name}</h2>
          <p className="fat-loss-panel__tagline">{BRAND.tagline}</p>
        </div>
        <YiqidongEntryButton
          config={yiqidongConfig}
          unread={yiqidongUnread}
          onOpenSettings={onOpenYiqidongSettings}
        />
      </header>

      <section className="fat-loss-panel__focus" aria-label="今日焦点">
        <p className="fat-loss-panel__section-label">今日焦点</p>
        <p className="fat-loss-panel__focus-hint">{focusHint}</p>
        <ul className="fat-loss-pillars">
          {FOCUS_PILLARS.map((pillar) => (
            <li key={pillar.id} className={`fat-loss-pillar fat-loss-pillar--${pillar.id}`}>
              <span className="fat-loss-pillar__icon" aria-hidden="true">
                {pillar.icon}
              </span>
              <span className="fat-loss-pillar__label">{pillar.label}</span>
              <span className="fat-loss-pillar__hint">{pillar.hint}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="fat-loss-panel__pipeline" aria-label="处理进度">
        <p className="fat-loss-panel__section-label">处理进度</p>
        <ol className="fat-loss-pipeline">
          {PIPELINE_IDS.map((id) => {
            const meta = SQUAD_ROSTER.find((item) => item.id === id)
            const status = agentMap.get(id)?.status ?? 'idle'
            return (
              <li
                key={id}
                className={[
                  'fat-loss-pipeline__step',
                  `fat-loss-pipeline__step--${status}`,
                  clusterTurn.phase !== 'idle' && status === 'working'
                    ? 'fat-loss-pipeline__step--active'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="fat-loss-pipeline__dot" aria-hidden="true" />
                <span className="fat-loss-pipeline__name">{meta?.title ?? id}</span>
                <span className="fat-loss-pipeline__status">{STATUS_LABEL[status]}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <button
        type="button"
        className="fat-loss-inbox pressable"
        onClick={onOpenYiqidongInbox}
      >
        <span className="fat-loss-inbox__icon" aria-hidden="true">
          ✉
        </span>
        <span className="fat-loss-inbox__text">
          <strong>运动信件</strong>
          <span>{yiqidongUnread > 0 ? `${yiqidongUnread} 封未读提醒` : '查看一起动提醒'}</span>
        </span>
        {yiqidongUnread > 0 && (
          <span className="fat-loss-inbox__badge" aria-label={`${yiqidongUnread} 封未读`}>
            {yiqidongUnread}
          </span>
        )}
      </button>
    </aside>
  )
}
