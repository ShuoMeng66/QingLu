import type { TaskPlan, TaskScore } from '../types/agentCluster'
import type { MessageFeedback } from '../types/agentCluster'

export interface SkillInvokeRecord {
  skill: string
  command?: string
  at: number
}

export interface AgentTrajectory {
  id: string
  conversationId: string
  messageId?: string
  createdAt: number
  updatedAt: number
  task: { userMessage: string; focus: string }
  plan: TaskPlan | null
  execution: {
    systemPrompt: string
    assistantReply: string
    skillInvokes?: SkillInvokeRecord[]
  }
  outcome: {
    score: TaskScore | null
    feedback: MessageFeedback | null
    userFollowUp: boolean
    starterId?: string
    interestId?: string
  }
  labels: { success: boolean; errorTags?: string[] }
}

export interface TrajectoryExportBundle {
  exportedAt: number
  trajectories: AgentTrajectory[]
}
