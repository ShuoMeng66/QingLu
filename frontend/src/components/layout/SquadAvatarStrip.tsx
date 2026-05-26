import type { ClusterPhase, ClusterTurn } from '../../types/agentCluster'
import { QINGLU } from '../../data/qingluAssets'
import { CHAT } from '../../copy/ui'

interface SquadAvatarStripProps {
  clusterTurn: ClusterTurn
  compact?: boolean
}

function statusLabel(phase: ClusterPhase, working: boolean): string {
  if (working) return CHAT.statusClusterWorking
  if (phase === 'idle') return CHAT.statusOnline
  return CHAT.statusGenerating
}

export function SquadAvatarStrip({ clusterTurn, compact = false }: SquadAvatarStripProps) {
  const working = clusterTurn.agents.some((a) => a.status === 'working')
  const status = statusLabel(clusterTurn.phase, working)

  return (
    <div
      className={`rounded-2xl border border-emerald-100/90 bg-white/75 backdrop-blur-sm ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <div className={`flex items-center gap-3 ${compact ? 'gap-2.5' : ''}`}>
        <div
          className={`relative shrink-0 overflow-hidden rounded-full border-2 transition-all duration-300 ${
            working
              ? 'border-vitality-green ring-2 ring-vitality-mint/50'
              : 'border-emerald-100/80'
          } ${compact ? 'h-12 w-12' : 'h-14 w-14'}`}
        >
          <img
            src={QINGLU.avatar}
            alt={QINGLU.name}
            className="h-full w-full object-cover object-top"
            loading="lazy"
          />
          {working && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-vitality-green ring-2 ring-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-vitality-green-deep">
            AI 减脂管家
          </p>
          <p className={`truncate font-black text-ink ${compact ? 'text-sm' : 'text-base'}`}>
            {QINGLU.name}
          </p>
          <p className={`truncate text-body ${compact ? 'text-[10px]' : 'text-xs'}`}>{status}</p>
        </div>
      </div>
    </div>
  )
}
