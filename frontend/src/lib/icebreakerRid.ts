import type { Conversation } from '../types/conversation'
import type { TriggerInterest } from '../types/icebreaker'
import type { YiqidongConfig } from './yiqidong'
import { decomposeTask } from './agentCluster'
import { computeStats } from './agentFeedback'
import { getInterestWeights } from './icebreakerTelemetry'
import { loadUserProfile } from './userProfile'

const INTEREST_CATALOG: Omit<TriggerInterest, 'weight' | 'evidence'>[] = [
  { id: 'calorie_gap', label: '热量缺口' },
  { id: 'meal_plan', label: '饮食搭配' },
  { id: 'workout_plan', label: '运动计划' },
  { id: 'recovery', label: '恢复管理' },
  { id: 'habit', label: '习惯养成' },
]

function summarizeSessions(conversations: Conversation[]): string[] {
  return conversations
    .filter((c) => c.messages.length > 0)
    .slice(0, 5)
    .map((c) => {
      const userMsgs = c.messages.filter((m) => m.role === 'user').slice(0, 2)
      const snippet = userMsgs.map((m) => m.content.slice(0, 80)).join('；')
      return `${c.title}：${snippet}`
    })
}

function scoreFromText(text: string, interestId: string): number {
  let score = 0
  if (interestId === 'calorie_gap' && /减|脂|体重|热量|卡路里|BMI|缺口/.test(text)) score += 2
  if (interestId === 'meal_plan' && /吃|餐|点|外卖|聚|蛋白|搭配/.test(text)) score += 2
  if (interestId === 'workout_plan' && /练|跑|深蹲|有氧|HIIT|力量|运动/.test(text)) score += 2
  if (interestId === 'recovery' && /睡|休息|疲劳|恢复|拉伸/.test(text)) score += 2
  if (interestId === 'habit' && /习惯|坚持|打卡|自律|计划/.test(text)) score += 2
  return score
}

export function distillTriggerInterests(input: {
  conversations: Conversation[]
  yiqidongConfig: YiqidongConfig
  recentInput?: string
}): TriggerInterest[] {
  const profile = loadUserProfile()
  const summaries = summarizeSessions(input.conversations)
  const sessionCount = input.conversations.filter((c) => c.messages.length > 0).length
  const gating = Math.min(1, sessionCount / 5)
  const banditWeights = getInterestWeights()
  const feedback = computeStats()

  const corpus = [
    ...summaries,
    input.recentInput ?? '',
    profile.goal === 'fat_loss' ? '减脂目标' : '',
    profile.training?.frequency_per_week
      ? `每周训练${profile.training.frequency_per_week}次`
      : '',
  ].join('\n')

  const scored = INTEREST_CATALOG.map((base) => {
    let raw = scoreFromText(corpus, base.id)
    const evidence: string[] = []

    if (base.id === 'calorie_gap' && profile.goal === 'fat_loss') {
      raw += 1.5
      evidence.push('画像：减脂目标')
    }
    if (base.id === 'workout_plan' && input.yiqidongConfig.mode !== 'off') {
      raw += 1
      evidence.push('一起动已开启')
    }
    if (base.id === 'meal_plan' && profile.preferences?.favorite_cuisines?.length) {
      raw += 0.5
      evidence.push('画像：饮食偏好')
    }

    for (const summary of summaries) {
      const s = scoreFromText(summary, base.id)
      if (s > 0) evidence.push(`历史：${summary.slice(0, 40)}…`)
      raw += s * gating
    }

    if (input.recentInput) {
      const focus = decomposeTask(input.recentInput).focus
      if (base.id === 'calorie_gap' && focus.includes('减脂')) raw += 1
      if (base.id === 'meal_plan' && focus.includes('饮食')) raw += 1
      if (base.id === 'workout_plan' && focus.includes('训练')) raw += 1
      if (base.id === 'recovery' && focus.includes('恢复')) raw += 1
    }

    if (feedback.total >= 2 && feedback.up / feedback.total >= 0.72) {
      if (base.id === 'calorie_gap') raw += 0.3
    }

    const bandit = banditWeights[base.id] ?? 0.5
    const weight = Math.min(1, (0.4 + raw * 0.12) * (0.6 + 0.4 * gating) + bandit * 0.2)

    return { ...base, weight, evidence: evidence.slice(0, 3) }
  })

  scored.sort((a, b) => b.weight - a.weight)
  return scored.slice(0, 5)
}
