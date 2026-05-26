import type { AgentTrajectory } from '../types/trajectory'
import { computeStats } from './agentFeedback'
import { computeStarterMetrics, loadTelemetryEvents } from './icebreakerTelemetry'
import { getTrajectories } from './trajectoryLogger'

export interface EvalSnapshot {
  at: number
  starterCtr: number
  firstMessageRate: number
  thumbsUpRate: number
  avgScore: number
  trajectoryCount: number
  successRate: number
}

function avgScore(trajectories: AgentTrajectory[]): number {
  const scored = trajectories.filter((t) => t.outcome.score)
  if (scored.length === 0) return 0
  return scored.reduce((sum, t) => sum + (t.outcome.score?.total ?? 0), 0) / scored.length
}

function successRate(trajectories: AgentTrajectory[]): number {
  if (trajectories.length === 0) return 0
  return trajectories.filter((t) => t.labels.success).length / trajectories.length
}

export function computeEvalSnapshot(): EvalSnapshot {
  const trajectories = getTrajectories()
  const feedback = computeStats()
  const starter = computeStarterMetrics()
  const thumbsUpRate = feedback.total > 0 ? feedback.up / feedback.total : 0

  return {
    at: Date.now(),
    starterCtr: starter.ctr,
    firstMessageRate: starter.firstMessageRate,
    thumbsUpRate,
    avgScore: avgScore(trajectories),
    trajectoryCount: trajectories.length,
    successRate: successRate(trajectories),
  }
}

export function compareEvalSnapshots(before: EvalSnapshot, after: EvalSnapshot): {
  deltaCtr: number
  deltaFirstMessage: number
  deltaThumbsUp: number
  deltaAvgScore: number
  deltaSuccessRate: number
} {
  return {
    deltaCtr: after.starterCtr - before.starterCtr,
    deltaFirstMessage: after.firstMessageRate - before.firstMessageRate,
    deltaThumbsUp: after.thumbsUpRate - before.thumbsUpRate,
    deltaAvgScore: after.avgScore - before.avgScore,
    deltaSuccessRate: after.successRate - before.successRate,
  }
}

export function holdOutSplit(trajectories: AgentTrajectory[], ratio = 0.2): {
  evolveSet: AgentTrajectory[]
  holdOutSet: AgentTrajectory[]
} {
  const sorted = [...trajectories].sort((a, b) => a.createdAt - b.createdAt)
  const cut = Math.max(1, Math.floor(sorted.length * (1 - ratio)))
  return {
    evolveSet: sorted.slice(0, cut),
    holdOutSet: sorted.slice(cut),
  }
}

export function logEvalSnapshot(label: string): EvalSnapshot {
  const snapshot = computeEvalSnapshot()
  if (typeof console !== 'undefined') {
    console.info(`[eval:${label}]`, snapshot, {
      telemetryEvents: loadTelemetryEvents().length,
    })
  }
  return snapshot
}
