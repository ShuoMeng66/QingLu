import type { TaskPlan, TaskScore, MessageFeedback } from '../types/agentCluster'
import type { AgentTrajectory, TrajectoryExportBundle } from '../types/trajectory'

const STORAGE_KEY = 'xiaozhua.trajectories-v1'
const MAX_TRAJECTORIES = 300

function loadAll(): AgentTrajectory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as AgentTrajectory[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function persist(trajectories: AgentTrajectory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trajectories.slice(-MAX_TRAJECTORIES)))
}

export function createTrajectoryDraft(input: {
  conversationId: string
  userMessage: string
  focus: string
  plan: TaskPlan
  systemPrompt: string
  starterId?: string
  interestId?: string
}): AgentTrajectory {
  const now = Date.now()
  const trajectory: AgentTrajectory = {
    id: crypto.randomUUID(),
    conversationId: input.conversationId,
    createdAt: now,
    updatedAt: now,
    task: { userMessage: input.userMessage, focus: input.focus },
    plan: input.plan,
    execution: { systemPrompt: input.systemPrompt, assistantReply: '' },
    outcome: {
      score: null,
      feedback: null,
      userFollowUp: false,
      starterId: input.starterId,
      interestId: input.interestId,
    },
    labels: { success: false },
  }
  const all = [...loadAll(), trajectory]
  persist(all)
  return trajectory
}

export function completeTrajectory(input: {
  conversationId: string
  userMessage: string
  assistantReply: string
  score: TaskScore
  messageId?: string
}): AgentTrajectory | null {
  const all = loadAll()
  const idx = [...all]
    .reverse()
    .findIndex(
      (t) =>
        t.conversationId === input.conversationId &&
        t.task.userMessage === input.userMessage &&
        !t.execution.assistantReply,
    )
  if (idx < 0) return null
  const realIdx = all.length - 1 - idx
  const traj = all[realIdx]
  traj.execution.assistantReply = input.assistantReply
  traj.outcome.score = input.score
  traj.messageId = input.messageId
  traj.updatedAt = Date.now()
  traj.labels.success = input.score.evalReport?.pass ?? input.score.total >= 75
  if (!traj.labels.success) {
    const tags: string[] = ['low_score']
    if (input.score.evalReport && input.score.evalReport.routing.confidence < 0.6) {
      tags.push('weak_route')
    }
    if (input.score.evalReport?.globalRules.checks.some((c) => !c.pass)) {
      tags.push('global_rule_miss')
    }
    traj.labels.errorTags = tags
  }
  all[realIdx] = traj
  persist(all)
  return traj
}

export function updateTrajectoryFeedback(
  messageId: string,
  feedback: MessageFeedback,
): AgentTrajectory | null {
  const all = loadAll()
  const idx = all.findIndex((t) => t.messageId === messageId)
  if (idx < 0) return null
  const traj = all[idx]
  traj.outcome.feedback = feedback
  traj.updatedAt = Date.now()
  if (feedback === 'up') traj.labels.success = true
  if (feedback === 'down') {
    traj.labels.success = false
    traj.labels.errorTags = [...(traj.labels.errorTags ?? []), 'user_downvote']
  }
  all[idx] = traj
  persist(all)
  return traj
}

export function markTrajectoryFollowUp(conversationId: string): void {
  const all = loadAll()
  const recent = all.filter((t) => t.conversationId === conversationId)
  if (recent.length === 0) return
  const last = recent[recent.length - 1]
  last.outcome.userFollowUp = true
  last.updatedAt = Date.now()
  persist(all)
}

export function getTrajectories(): AgentTrajectory[] {
  return loadAll()
}

export function exportTrajectoriesJsonl(): string {
  return loadAll().map((t) => JSON.stringify(t)).join('\n')
}

export function exportTrajectoryBundle(): TrajectoryExportBundle {
  return { exportedAt: Date.now(), trajectories: loadAll() }
}

export function downloadTrajectoriesExport(): void {
  const blob = new Blob([exportTrajectoriesJsonl()], { type: 'application/x-ndjson' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `xiaozhua-trajectories-${Date.now()}.jsonl`
  a.click()
  URL.revokeObjectURL(url)
}
