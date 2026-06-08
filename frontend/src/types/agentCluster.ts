import type { EvalReport } from './evalAgent'

export type SquadAgentId = 'lead' | 'planner' | 'executor' | 'scorer' | 'standby'

export type ClusterPhase =
  | 'idle'
  | 'orchestrating'
  | 'planning'
  | 'executing'
  | 'scoring'

export type AgentStatus = 'idle' | 'working' | 'done' | 'rest'

export interface TaskPlan {
  steps: string[]
  focus: string
}

export interface ScoreDimension {
  label: string
  value: number
}

export interface TaskScore {
  total: number
  dimensions: ScoreDimension[]
  note: string
  /** 测评 Agent 完整报告（飞书 Skill 1 三模块） */
  evalReport?: EvalReport
}

export interface SquadAgentMeta {
  id: SquadAgentId
  /** 对外展示名 */
  title: string
  /** 职责 */
  role: string
}

export interface SquadAgentState {
  id: SquadAgentId
  status: AgentStatus
}

export interface ClusterTurn {
  userMessage: string
  plan: TaskPlan | null
  score: TaskScore | null
  phase: ClusterPhase
  agents: SquadAgentState[]
}

export type MessageFeedback = 'up' | 'down'

export interface FeedbackRecord {
  messageId: string
  vote: MessageFeedback
  at: number
}

export interface FeedbackStats {
  up: number
  down: number
  total: number
  preferenceHint: string
}

export const SQUAD_ROSTER: SquadAgentMeta[] = [
  { id: 'lead', title: '准备', role: '理解你的问题与场景' },
  { id: 'planner', title: '规划', role: '整理饮食与训练要点' },
  { id: 'executor', title: '回复', role: '组织回答与方案' },
  { id: 'scorer', title: '测评', role: '评估回复质量与场景匹配' },
  { id: 'standby', title: '待命', role: '随时继续聊' },
]
