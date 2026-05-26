import { useMemo } from 'react'
import type { ClusterTurn } from '../../types/agentCluster'
import { SQUAD_ROSTER } from '../../types/agentCluster'
import type { SceneContext } from '../../types/scene'
import { sceneLabel } from '../../lib/detectScene'
import type { YiqidongConfig } from '../../lib/yiqidong'
import { QINGLU } from '../../data/qingluAssets'
import { YiqidongEnvelope } from '../yiqidong/YiqidongEnvelope'
import './PetScenePanel.css'

interface PetScenePanelProps {
  scene: SceneContext
  clusterTurn: ClusterTurn
  yiqidongConfig: YiqidongConfig
  onYiqidongApply: (config: YiqidongConfig) => void
}

const DESK_LAYOUT = [
  { id: 'lead', x: '8%', y: '18%' },
  { id: 'planner', x: '32%', y: '14%' },
  { id: 'executor', x: '56%', y: '18%' },
  { id: 'scorer', x: '20%', y: '52%' },
  { id: 'standby', x: '68%', y: '50%' },
] as const

export function PetScenePanel({
  scene,
  clusterTurn,
  yiqidongConfig,
  onYiqidongApply,
}: PetScenePanelProps) {
  const agentMap = useMemo(
    () => new Map(clusterTurn.agents.map((agent) => [agent.id, agent])),
    [clusterTurn.agents],
  )

  const working = clusterTurn.agents.some((a) => a.status === 'working')

  return (
    <aside className={`pet-scene pet-scene--${scene.sceneId}`} aria-label="轻鹭场景">
      <div className="pet-scene__bg" aria-hidden="true">
        <div className="scene-bg scene-bg--office" />
        <div className="scene-bg scene-bg--gym" />
        <div className="scene-bg scene-bg--hotpot" />
      </div>

      <header className="pet-scene__header">
        <span className="pet-scene__label">{sceneLabel(scene.sceneId)}</span>
        <span className="pet-scene__pose">
          {scene.petPose === 'work'
            ? '在线协助'
            : scene.petPose === 'exercise'
              ? '训练中'
              : scene.petPose === 'eat'
                ? '用餐建议'
                : '待命'}
        </span>
      </header>

      <div className={`pet-scene__stage pet-scene__stage--pose-${scene.petPose}`}>
        <div className={`pet-scene__qinglu ${working ? 'pet-scene__qinglu--active' : ''}`}>
          <img src={QINGLU.hero} alt={QINGLU.name} className="pet-scene__qinglu-img" />
        </div>

        {SQUAD_ROSTER.map((meta) => {
          const layout = DESK_LAYOUT.find((item) => item.id === meta.id)
          const state = agentMap.get(meta.id)
          const status = state?.status ?? 'idle'
          const active = status === 'working'

          return (
            <div
              key={meta.id}
              className={`pet-desk pet-desk--${status} ${active ? 'pet-desk--active' : ''}`}
              style={{ left: layout?.x, top: layout?.y }}
            >
              <span className="pet-desk__name">{meta.title}</span>
              <span className={`pet-desk__dot pet-desk__dot--${status}`} />
            </div>
          )
        })}

        {scene.sceneId === 'office' && (
          <YiqidongEnvelope config={yiqidongConfig} onApply={onYiqidongApply} />
        )}
      </div>
    </aside>
  )
}
