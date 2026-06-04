import { scoreResponseWithEvalAgent } from './evalAgent'
import { sendChat } from './openclaw'
import type { TaskScore } from '../types/agentCluster'
import type { OpenClawConfig } from '../types/openclaw'

function parseEvalJson(text: string): TaskScore | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      total?: number
      dimensions?: Array<{ label?: string; value?: number }>
      note?: string
    }

    if (typeof parsed.total !== 'number' || !Array.isArray(parsed.dimensions)) {
      return null
    }

    const dimensions = parsed.dimensions
      .filter((item) => item.label && typeof item.value === 'number')
      .slice(0, 5)
      .map((item) => ({
        label: item.label!,
        value: Math.min(100, Math.max(0, Math.round(item.value!))),
      }))

    if (dimensions.length === 0) return null

    return {
      total: Math.min(100, Math.max(0, Math.round(parsed.total))),
      dimensions,
      note: parsed.note?.trim() || 'AI 质量检查完成',
    }
  } catch {
    return null
  }
}

/** 在线时用 LLM 做质量测评；失败则回退本地规则引擎 */
export async function scoreResponseSmart(
  config: OpenClawConfig,
  connected: boolean,
  question: string,
  answer: string,
): Promise<TaskScore & { scorer: 'llm' | 'local' }> {
  const local = scoreResponseWithEvalAgent(question, answer)

  if (!connected || !config.token.trim() || !answer.trim()) {
    return { ...local, note: `${local.note} · 本地规则`, scorer: 'local' }
  }

  try {
    const reply = await sendChat(
      config,
      [
        {
          id: 'eval-user',
          role: 'user',
          content: `用户问题：${question}\n\n助手回答：${answer}\n\n请评估回答质量。`,
        },
      ],
      'qinglu-eval-agent',
      undefined,
      [
        '你是 QingLu 回复质量评估 Agent（对齐 RLHF 反馈闭环）。',
        '从信息提取、方案质量、数据依据、可执行性、场景贴合五个维度各打 0-100 分，并给出 total 总分与一句 note。',
        '仅输出 JSON，格式：',
        '{"total":82,"dimensions":[{"label":"信息提取","value":80},{"label":"方案质量","value":85},{"label":"数据依据","value":78},{"label":"可执行性","value":84},{"label":"场景贴合","value":81}],"note":"简短评语"}',
      ].join('\n'),
    )

    const llmScore = parseEvalJson(reply)
    if (llmScore) {
      return { ...llmScore, note: `${llmScore.note} · AI 质量`, scorer: 'llm' }
    }
  } catch {
    // fall through
  }

  return { ...local, note: `${local.note} · 本地规则回退`, scorer: 'local' }
}
