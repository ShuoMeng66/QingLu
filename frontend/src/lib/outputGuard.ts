import { QINGLU_VENUES } from '../data/qingluVenues.generated'
import { buildUserContextPrompt } from './userContextPrompt'
import { loadAppPreferences } from './appPreferences'
import { sendChat } from './openclaw'
import { isVenueInUserArea, isUserInSkillDemoCities } from './venueRegion'
import type { UserLocation } from './userLocation'
import type { OpenClawConfig } from '../types/openclaw'
import type { ChatMessage } from '../types/openclaw'
import { debugPerf } from './debugPerf'

export const DEFAULT_GUARD_AGENT =
  import.meta.env.VITE_GUARD_AGENT?.trim() || 'deepseek-v4-flash'

const GUARD_TIMEOUT_MS = 22_000

const SAFE_FALLBACK =
  '抱歉，这版回复未通过质检。请再说一下你的需求（例如附近吃什么、今日还能吃多少），我会按你当前位置重新推荐。'

export interface OutputGuardResult {
  finalContent: string
  approved: boolean
  issues: string[]
  guardUsed: 'local' | 'llm' | 'revise' | 'passthrough' | 'fallback'
}

interface GuardLlmPayload {
  approved?: boolean
  issues?: string[]
  revisedContent?: string | null
  severity?: 'low' | 'high'
}

function extractJsonObject(text: string): GuardLlmPayload | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0]) as GuardLlmPayload
  } catch {
    return null
  }
}

function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, '')
}

function venueMentionedInDraft(venueName: string, normalized: string): boolean {
  const core = venueName
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
  if (core.length < 2) return false
  return (
    normalized.includes(venueName.replace(/\s+/g, '')) ||
    normalized.toLowerCase().includes(core)
  )
}

/** 草稿中出现但不在用户生活圈的 Skill 门店 */
export function detectRemoteVenueMentions(
  draft: string,
  location: UserLocation | null | undefined,
): string[] {
  if (!location) return []
  const normalized = normalizeForMatch(draft)
  const remote: string[] = []

  for (const venue of QINGLU_VENUES) {
    if (!venueMentionedInDraft(venue.name, normalized)) continue
    if (!isVenueInUserArea(venue, location)) {
      remote.push(venue.name)
    }
  }

  return remote
}

function detectMarkdownViolations(draft: string): string[] {
  const issues: string[] = []
  if (/^#{1,6}\s/m.test(draft)) issues.push('使用了 Markdown 标题')
  if (/^\|.+\|/m.test(draft) && draft.includes('|---')) issues.push('使用了 Markdown 表格')
  if (/```/.test(draft)) issues.push('使用了代码块')
  return issues
}

export interface LocalGuardResult {
  passed: boolean
  issues: string[]
}

export function runLocalOutputGuard(
  draft: string,
  userMessage: string,
  location: UserLocation | null | undefined,
): LocalGuardResult {
  const issues: string[] = []
  const trimmed = draft.trim()

  if (!trimmed) {
    issues.push('回复为空')
  }

  issues.push(...detectMarkdownViolations(trimmed))

  const remoteVenues = detectRemoteVenueMentions(trimmed, location)
  if (remoteVenues.length > 0) {
    issues.push(
      `推荐了与用户位置不符的门店：${remoteVenues.slice(0, 3).join('、')}`,
    )
  }

  if (location && !isUserInSkillDemoCities(location)) {
    const demoCityPattern = /上海|北京|陆家嘴|中关村|浦东新区|海淀区/i
    if (demoCityPattern.test(trimmed) && /店|餐厅|外卖|麦当劳|星巴克|海底捞/i.test(trimmed)) {
      issues.push('用户不在京沪演示数据覆盖区，却引用了京沪具体分店或地标')
    }
  }

  if (/你(住|在)哪|哪个区|配送地址|告诉我.*地址/i.test(trimmed) && userMessage.length > 0) {
    const ctx = buildUserContextPrompt()
    if (ctx.includes('配送/生活圈') || ctx.includes('禁止再次询问')) {
      issues.push('重复追问用户已知的位置信息')
    }
  }

  return { passed: issues.length === 0, issues }
}

function buildGuardSystemPrompt(): string {
  return [
    '你是 QingLu 输出守门 Agent，在回复展示给用户之前做最后一道质检。',
    '检查：①是否推荐了与用户位置不符的具体门店；②是否编造 Skill 未收录的店名；③是否违反 IM 短句（无 Markdown 标题/表格/代码块）；④是否重复追问 App 已知的地址/热量。',
    '用户不在北京/上海时，不得把京沪 JSON 示例店当作附近推荐。',
    '仅输出 JSON：{"approved":true|false,"issues":["…"],"revisedContent":"修订全文或null","severity":"low|high"}',
    '若 approved 为 false 且能安全修订，在 revisedContent 给出完整替代回复（短句、有 kcal 时保留数字）；否则 revisedContent 为 null。',
  ].join('\n')
}

async function callGuardLlm(
  config: OpenClawConfig,
  userMessage: string,
  draft: string,
  localIssues: string[],
  signal: AbortSignal | undefined,
  mode: 'review' | 'revise',
): Promise<GuardLlmPayload | null> {
  const userContext = buildUserContextPrompt()
  const prefs = loadAppPreferences()

  const userContent =
    mode === 'review'
      ? [
          `用户问题：${userMessage}`,
          `助手草稿：\n${draft}`,
          `本地规则已发现问题：${localIssues.length ? localIssues.join('；') : '无'}`,
          `用户偏好：${prefs.ai.tone} / ${prefs.ai.detail}`,
          userContext,
          '请质检草稿并输出 JSON。',
        ].join('\n\n')
      : [
          `用户问题：${userMessage}`,
          `原草稿：\n${draft}`,
          `必须修复的问题：\n${localIssues.map((i) => `- ${i}`).join('\n')}`,
          userContext,
          '请重写完整回复，输出 JSON，approved 应为 true，revisedContent 为修订后的全文。',
        ].join('\n\n')

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), GUARD_TIMEOUT_MS)
  if (signal?.aborted) {
    controller.abort()
  } else {
    signal?.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const reply = await sendChat(
      config,
      [{ id: 'guard-user', role: 'user', content: userContent } satisfies ChatMessage],
      'qinglu-output-guard',
      controller.signal,
      buildGuardSystemPrompt(),
      { model: DEFAULT_GUARD_AGENT, enableThinking: false },
    )
    return extractJsonObject(reply)
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

export async function runOutputGuard(params: {
  config: OpenClawConfig
  connected: boolean
  enabled: boolean
  userMessage: string
  draft: string
  userLocation?: UserLocation | null
  signal?: AbortSignal
}): Promise<OutputGuardResult> {
  const { config, connected, enabled, userMessage, draft, userLocation, signal } = params
  const trimmedDraft = draft.trim()

  if (!enabled) {
    return {
      finalContent: trimmedDraft || SAFE_FALLBACK,
      approved: true,
      issues: [],
      guardUsed: 'passthrough',
    }
  }

  const guardStart = performance.now()
  const local = runLocalOutputGuard(trimmedDraft, userMessage, userLocation)

  // #region agent log
  debugPerf(
    'outputGuard.ts:runOutputGuard',
    'local_guard_done',
    {
      passed: local.passed,
      issueCount: local.issues.length,
      draftLen: trimmedDraft.length,
      localMs: Math.round(performance.now() - guardStart),
    },
    'B',
  )
  // #endregion

  if (local.passed && local.issues.length === 0) {
    // #region agent log
    debugPerf(
      'outputGuard.ts:runOutputGuard',
      'skip_llm_local_clean',
      { totalMs: Math.round(performance.now() - guardStart) },
      'B',
    )
    // #endregion
    return {
      finalContent: trimmedDraft,
      approved: true,
      issues: [],
      guardUsed: 'local',
    }
  }

  if (!connected || !config.token.trim()) {
    if (local.passed) {
      return {
        finalContent: trimmedDraft,
        approved: true,
        issues: [],
        guardUsed: 'local',
      }
    }
    return {
      finalContent: SAFE_FALLBACK,
      approved: false,
      issues: local.issues,
      guardUsed: 'fallback',
    }
  }

  let llm = await callGuardLlm(
    config,
    userMessage,
    trimmedDraft,
    local.issues,
    signal,
    'review',
  )

  let issues = [...local.issues, ...(llm?.issues ?? [])]
  let approved = local.passed && (llm?.approved !== false)
  let finalContent = trimmedDraft

  if (llm?.revisedContent?.trim() && llm.approved === false) {
    finalContent = llm.revisedContent.trim()
    approved = true
    issues = llm.issues ?? issues
    return { finalContent, approved, issues, guardUsed: 'llm' }
  }

  if (!approved) {
    const revise = await callGuardLlm(
      config,
      userMessage,
      trimmedDraft,
      issues,
      signal,
      'revise',
    )
    if (revise?.revisedContent?.trim()) {
      const revised = revise.revisedContent.trim()
      const recheck = runLocalOutputGuard(revised, userMessage, userLocation)
      if (recheck.passed) {
        return {
          finalContent: revised,
          approved: true,
          issues,
          guardUsed: 'revise',
        }
      }
    }
    if (local.passed && llm == null) {
      return {
        finalContent: trimmedDraft,
        approved: true,
        issues: [],
        guardUsed: 'passthrough',
      }
    }
    return {
      finalContent: SAFE_FALLBACK,
      approved: false,
      issues,
      guardUsed: 'fallback',
    }
  }

  // #region agent log
  debugPerf(
    'outputGuard.ts:runOutputGuard',
    'guard_complete',
    {
      guardUsed: llm ? 'llm' : 'local',
      approved: true,
      totalMs: Math.round(performance.now() - guardStart),
    },
    'B',
  )
  // #endregion

  return {
    finalContent,
    approved: true,
    issues: [],
    guardUsed: llm ? 'llm' : 'local',
  }
}
