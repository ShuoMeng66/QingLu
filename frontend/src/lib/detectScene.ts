import type { ChatMessage } from '../types/openclaw'
import type { SceneContext, SceneId } from '../types/scene'

interface DetectSceneInput {
  messages?: ChatMessage[]
  input?: string
}

const EATING_PATTERNS = [
  /火锅/,
  /hotpot/i,
  /涮/,
  /毛肚/,
  /番茄锅/,
  /烧烤/,
  /bbq/i,
  /烤串/,
  /烤肉/,
  /吃/,
  /外卖/,
  /点菜/,
  /聚餐/,
  /午餐/,
  /晚餐/,
  /早餐/,
  /饮食/,
  /餐盒/,
  /食物/,
  /减脂餐/,
  /轻食/,
]

const EXERCISE_PATTERNS = [
  /足球/,
  /踢球/,
  /篮球/,
  /投篮/,
  /跑步/,
  /跑团/,
  /跑步机/,
  /慢跑/,
  /马拉松/,
  /哑铃/,
  /举重/,
  /力量训练/,
  /练胸/,
  /练背/,
  /深蹲/,
  /硬拉/,
  /健身房/,
  /锻炼/,
  /运动/,
  /飞盘/,
  /骑行/,
  /徒步/,
  /羽毛球/,
  /练后/,
  /瑜伽/,
  /游泳/,
  /有氧/,
  /无氧/,
  /HIIT/i,
  /拉伸/,
  /恢复/,
]

function collectTexts({ messages = [], input = '' }: DetectSceneInput): string {
  const chunks: string[] = []
  if (input.trim()) chunks.push(input.trim())

  for (const message of messages.slice(-6)) {
    const weight = message.role === 'user' ? 2 : 1
    for (let i = 0; i < weight; i += 1) {
      chunks.push(message.content)
    }
  }

  return chunks.join('\n')
}

function scorePatterns(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0)
}

export function detectScene(input: DetectSceneInput): SceneContext {
  const text = collectTexts(input)
  if (!text.trim()) {
    return { sceneId: 'office', petPose: 'work' }
  }

  const eatScore = scorePatterns(text, EATING_PATTERNS)
  const exScore = scorePatterns(text, EXERCISE_PATTERNS)

  if (exScore === 0 && eatScore === 0) {
    return { sceneId: 'office', petPose: 'work' }
  }

  if (exScore >= eatScore) {
    return { sceneId: 'gym', petPose: 'exercise' }
  }

  return { sceneId: 'hotpot', petPose: 'eat' }
}

export function sceneLabel(sceneId: SceneId): string {
  switch (sceneId) {
    case 'gym':
      return '健身房'
    case 'hotpot':
      return '火锅局'
    default:
      return '办公室'
  }
}
