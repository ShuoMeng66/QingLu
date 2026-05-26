import { sendChat } from './openclaw'
import type { OpenClawConfig } from '../types/openclaw'
import { estimateMealCalories } from './mealLog'

export type CalorieEstimateSource = 'ai' | 'rules'

export interface CalorieEstimateResult {
  kcal: number
  source: CalorieEstimateSource
}

function clampKcal(value: number): number {
  if (!Number.isFinite(value)) return 450
  return Math.min(3000, Math.max(80, Math.round(value)))
}

function parseKcalFromText(text: string): number | null {
  const match = text.match(/(\d{2,4})\s*(?:kcal|大卡|千卡|cal|Cal)?/i)
  if (!match) return null
  return clampKcal(Number(match[1]))
}

/** 在线时走 OpenClaw 估算，离线回退关键词规则 */
export async function estimateMealCaloriesSmart(
  description: string,
  config: OpenClawConfig,
  connected: boolean,
): Promise<CalorieEstimateResult> {
  const fallback = clampKcal(estimateMealCalories(description))

  if (!connected || !config.token.trim()) {
    return { kcal: fallback, source: 'rules' }
  }

  try {
    const reply = await sendChat(
      config,
      [
        {
          id: 'meal-estimate-user',
          role: 'user',
          content: `估算以下饮食的热量（kcal），只返回一个整数数字，不要解释：\n${description.trim()}`,
        },
      ],
      'meal-calorie-estimator',
      undefined,
      '你是专业营养师。根据用户描述估算这一餐的总热量（kcal）。只输出一个整数，例如：520',
    )

    const parsed = parseKcalFromText(reply)
    if (parsed != null) {
      return { kcal: parsed, source: 'ai' }
    }
  } catch {
    // fall through
  }

  return { kcal: fallback, source: 'rules' }
}
