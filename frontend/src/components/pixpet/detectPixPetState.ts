import type { ChatMessage } from '../../types/openclaw'
import type { AppPage } from '../AppSidebar'
import {
  IDLE_STATE,
  type EatingVariant,
  type ExerciseVariant,
  type PixPetState,
} from './types'

interface DetectInput {
  messages?: ChatMessage[]
  input?: string
  page?: AppPage
}

type Scored<T extends string> = { key: T; score: number }

const EATING_RULES: { key: EatingVariant; patterns: RegExp[] }[] = [
  { key: 'hotpot', patterns: [/火锅/, /hotpot/i, /涮/, /毛肚/, /番茄锅/, /菌汤/, /红锅/] },
  { key: 'bbq', patterns: [/烧烤/, /bbq/i, /烤串/, /烤肉/, /串串/, /炭烤/] },
  { key: 'meal', patterns: [/吃/, /外卖/, /点菜/, /聚餐/, /午餐/, /晚餐/, /早餐/, /饮食/, /餐盒/, /食物/, /减脂餐/, /轻食/] },
]

const EXERCISE_RULES: { key: ExerciseVariant; patterns: RegExp[] }[] = [
  { key: 'football', patterns: [/足球/, /踢球/, /soccer/i] },
  { key: 'basketball', patterns: [/篮球/, /投篮/, /运球/, /basketball/i] },
  { key: 'treadmill', patterns: [/跑步/, /跑团/, /跑步机/, /慢跑/, /马拉松/, /夜跑/, /五公里/, /5km/i, /10km/i] },
  { key: 'dumbbell', patterns: [/哑铃/, /举重/, /力量训练/, /练胸/, /练背/, /深蹲/, /硬拉/, /健身房/] },
  {
    key: 'workout',
    patterns: [/锻炼/, /运动/, /飞盘/, /骑行/, /徒步/, /羽毛球/, /练后/, /瑜伽/, /游泳/, /有氧/, /无氧/, /一起动/],
  },
]

function scoreRules<T extends string>(
  text: string,
  rules: { key: T; patterns: RegExp[] }[],
): Scored<T>[] {
  return rules
    .map(({ key, patterns }) => ({
      key,
      score: patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
}

function collectTexts({ messages = [], input = '' }: DetectInput): string[] {
  const chunks: string[] = []
  if (input.trim()) chunks.push(input.trim())

  const recent = messages.slice(-6)
  for (const message of recent) {
    const weight = message.role === 'user' ? 2 : 1
    for (let i = 0; i < weight; i += 1) {
      chunks.push(message.content)
    }
  }

  return chunks
}

export function detectPixPetState(detectInput: DetectInput): PixPetState {
  const text = collectTexts(detectInput).join('\n')
  if (!text.trim()) {
    if (detectInput.page === 'yiqidong') {
      return { mode: 'exercising', exercise: 'workout' }
    }
    return IDLE_STATE
  }

  const eating = scoreRules(text, EATING_RULES)
  const exercising = scoreRules(text, EXERCISE_RULES)

  let eatScore = eating.reduce((sum, item) => sum + item.score, 0)
  let exScore = exercising.reduce((sum, item) => sum + item.score, 0)

  if (detectInput.page === 'yiqidong') {
    exScore += 3
  }

  if (exScore === 0 && eatScore === 0) {
    return detectInput.page === 'yiqidong'
      ? { mode: 'exercising', exercise: 'workout' }
      : IDLE_STATE
  }

  if (exScore >= eatScore) {
    return {
      mode: 'exercising',
      exercise: exercising[0]?.key ?? 'workout',
    }
  }

  return {
    mode: 'eating',
    eating: eating[0]?.key ?? 'meal',
  }
}
