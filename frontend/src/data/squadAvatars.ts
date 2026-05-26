import type { SquadAgentId } from '../types/agentCluster'
import { QINGLU } from './qingluAssets'

export interface SquadAvatarMeta {
  agentId: SquadAgentId
  src: string
  alt: string
}

/** 轻鹭统一形象 — 各 Agent 阶段共用同一头像 */
export const SQUAD_AVATARS: SquadAvatarMeta[] = [
  { agentId: 'lead', src: QINGLU.avatar, alt: QINGLU.name },
  { agentId: 'planner', src: QINGLU.avatar, alt: QINGLU.name },
  { agentId: 'executor', src: QINGLU.avatar, alt: QINGLU.name },
  { agentId: 'scorer', src: QINGLU.avatar, alt: QINGLU.name },
  { agentId: 'standby', src: QINGLU.avatar, alt: QINGLU.name },
]

export function avatarForAgent(agentId: SquadAgentId): SquadAvatarMeta {
  return SQUAD_AVATARS.find((a) => a.agentId === agentId)!
}
