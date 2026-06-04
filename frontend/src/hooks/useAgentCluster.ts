import { useCallback, useMemo, useState } from 'react'
import { decomposeTask, scoreResponse } from '../lib/agentCluster'
import { computeStats, saveFeedback } from '../lib/agentFeedback'
import type {
  ClusterPhase,
  ClusterTurn,
  FeedbackStats,
  MessageFeedback,
  SquadAgentId,
  SquadAgentState,
  TaskPlan,
  TaskScore,
} from '../types/agentCluster'
import { SQUAD_ROSTER } from '../types/agentCluster'

function idleAgents(): SquadAgentState[] {
  return SQUAD_ROSTER.map((agent) => ({
    id: agent.id,
    status: agent.id === 'standby' ? 'rest' : 'idle',
  }))
}

function agentsForPhase(phase: ClusterPhase): SquadAgentState[] {
  const base = idleAgents()
  const set = (id: SquadAgentId, status: SquadAgentState['status']) => {
    const item = base.find((a) => a.id === id)
    if (item) item.status = status
  }

  switch (phase) {
    case 'orchestrating':
      set('lead', 'working')
      set('standby', 'rest')
      break
    case 'planning':
      set('lead', 'done')
      set('planner', 'working')
      break
    case 'executing':
      set('planner', 'done')
      set('executor', 'working')
      break
    case 'reviewing':
      set('executor', 'done')
      set('scorer', 'working')
      break
    case 'scoring':
      set('executor', 'done')
      set('scorer', 'working')
      break
    case 'idle':
    default:
      break
  }
  return base
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function useAgentCluster(options?: {
  scoreAnswer?: (question: string, answer: string) => Promise<TaskScore>
}) {
  const [turn, setTurn] = useState<ClusterTurn>({
    userMessage: '',
    plan: null,
    score: null,
    phase: 'idle',
    agents: idleAgents(),
  })
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats>(() => computeStats())

  const setPhase = useCallback((phase: ClusterPhase, patch: Partial<ClusterTurn> = {}) => {
    setTurn((current) => ({
      ...current,
      phase,
      agents: agentsForPhase(phase),
      ...patch,
    }))
  }, [])

  const prepareTurn = useCallback(async (userMessage: string): Promise<TaskPlan> => {
    const plan = decomposeTask(userMessage)
    setTurn({
      userMessage,
      plan: null,
      score: null,
      phase: 'orchestrating',
      agents: agentsForPhase('orchestrating'),
    })
    await sleep(280)
    setPhase('planning', { plan })
    await sleep(420)
    setPhase('executing')
    return plan
  }, [setPhase])

  const setReviewing = useCallback(
    (active: boolean) => {
      if (active) setPhase('reviewing')
    },
    [setPhase],
  )

  const finishExecution = useCallback(async (userMessage: string, answer: string) => {
    setPhase('scoring')
    await sleep(360)
    const score = options?.scoreAnswer
      ? await options.scoreAnswer(userMessage, answer)
      : scoreResponse(userMessage, answer)
    setPhase('idle', { score })
    return score
  }, [options?.scoreAnswer, setPhase])

  const resetTurn = useCallback(() => {
    setTurn({
      userMessage: '',
      plan: null,
      score: null,
      phase: 'idle',
      agents: idleAgents(),
    })
  }, [])

  const submitFeedback = useCallback((messageId: string, vote: MessageFeedback) => {
    const stats = saveFeedback(messageId, vote)
    setFeedbackStats(stats)
    return stats
  }, [])

  const activeAgentId = useMemo((): SquadAgentId | null => {
    const working = turn.agents.find((a) => a.status === 'working')
    return working?.id ?? null
  }, [turn.agents])

  return {
    turn,
    activeAgentId,
    feedbackStats,
    prepareTurn,
    finishExecution,
    setReviewing,
    resetTurn,
    submitFeedback,
  }
}
