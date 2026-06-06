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

/** 仅以下问题可拦截展示；格式/风格类问题只记录、不挡回复 */
const CRITICAL_ISSUE_PATTERNS = [
  /推荐了与用户位置不符的门店/,
  /用户不在京沪演示数据覆盖区/,
  /重复追问用户已知的位置信息/,
]

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

function isCriticalIssue(issue: string): boolean {
  return CRITICAL_ISSUE_PATTERNS.some((re) => re.test(issue))
}

function partitionIssues(issues: string[]): { critical: string[]; nonCritical: string[] } {
  const critical: string[] = []
  const nonCritical: string[] = []
  for (const issue of issues) {
    if (isCriticalIssue(issue)) critical.push(issue)
    else nonCritical.push(issue)
  }
  return { critical, nonCritical }
}

function detectMarkdownViolations(draft: string, hasStructuredPayload: boolean): string[] {
  const issues: string[] = []
  if (/^#{1,6}\s/m.test(draft)) issues.push('使用了 Markdown 标题')
  if (/^\|.+\|/m.test(draft) && draft.includes('|---')) issues.push('使用了 Markdown 表格')
  if (/```/.test(draft)) issues.push('使用了代码块')
  const emojiCount = (draft.match(/[\u{1F300}-\u{1FAFF}]/gu) ?? []).length
  const emojiLimit = hasStructuredPayload ? 14 : 10
  if (emojiCount > emojiLimit || (draft.length > 220 && emojiCount > 8)) {
    issues.push('emoji 或装饰符号偏多，建议改为短句 IM 风格')
  }
  const bulletLines = draft.split('\n').filter((l) => /^\s*[-*•]\s/.test(l)).length
  const bulletLimit = hasStructuredPayload ? 10 : 6
  if (bulletLines >= bulletLimit) {
    issues.push('列表略长，外卖/推荐场景建议保留一句摘要')
  }
  return issues
}

export interface LocalGuardResult {
  passed: boolean
  issues: string[]
  criticalIssues: string[]
  nonCriticalIssues: string[]
}

export function runLocalOutputGuard(
  draft: string,
  userMessage: string,
  location: UserLocation | null | undefined,
  options?: { hasStructuredPayload?: boolean; rawDraft?: string },
): LocalGuardResult {
  const issues: string[] = []
  const trimmed = draft.trim()
  const hasStructuredPayload = options?.hasStructuredPayload ?? false
  const rawDraft = options?.rawDraft?.trim() ?? trimmed

  if (!trimmed && !hasStructuredPayload) {
    issues.push('回复为空')
  }

  issues.push(...detectMarkdownViolations(trimmed, hasStructuredPayload))

  const remoteVenues = detectRemoteVenueMentions(rawDraft, location)
  if (remoteVenues.length > 0) {
    issues.push(
      `推荐了与用户位置不符的门店：${remoteVenues.slice(0, 3).join('、')}`,
    )
  }

  if (location && !isUserInSkillDemoCities(location)) {
    const demoCityPattern = /上海|北京|陆家嘴|中关村|浦东新区|海淀区/i
    if (demoCityPattern.test(rawDraft) && /店|餐厅|外卖|麦当劳|星巴克|海底捞/i.test(rawDraft)) {
      issues.push('用户不在京沪演示数据覆盖区，却引用了京沪具体分店或地标')
    }
  }

  if (/你(住|在)哪|哪个区|配送地址|告诉我.*地址/i.test(trimmed) && userMessage.length > 0) {
    const ctx = buildUserContextPrompt()
    if (ctx.includes('配送/生活圈') || ctx.includes('禁止再次询问')) {
      issues.push('重复追问用户已知的位置信息')
    }
  }

  const { critical, nonCritical } = partitionIssues(issues)
  return {
    passed: critical.length === 0,
    issues,
    criticalIssues: critical,
    nonCriticalIssues: nonCritical,
  }
}

function buildGuardSystemPrompt(): string {
  return [
    '你是 QingLu 输出守门 Agent，在回复展示给用户之前做最后一道质检。',
    '默认倾向放行：只有严重问题才 approved:false 且 severity:high。',
    '严重问题（必须拦截）：①推荐了与用户位置不符的具体门店；②用户不在京沪却把京沪 JSON 示例店当附近推荐；③重复追问 App 已知的地址/热量；④明显编造 Skill 未收录的店名并当作真推荐。',
    '非严重问题（应放行）：Markdown/emoji/列表略长、摘要过短、文字为空但含 ---JSON_START--- 结构化卡片。',
    '含结构化卡片时，文字可为 1–2 句摘要或为空；以卡片内容为准，不要因格式拦下。',
    '格式类问题请 severity:low，优先 approved:true；能轻改则在 revisedContent 给出修订，否则 revisedContent 为 null 但仍可 approved:true。',
    '仅输出 JSON：{"approved":true|false,"issues":["…"],"revisedContent":"修订全文或null","severity":"low|high"}',
  ].join('\n')
}

async function callGuardLlm(
  config: OpenClawConfig,
  userMessage: string,
  draft: string,
  localIssues: string[],
  signal: AbortSignal | undefined,
  mode: 'review' | 'revise',
  hasStructuredPayload: boolean,
): Promise<GuardLlmPayload | null> {
  const userContext = buildUserContextPrompt()
  const prefs = loadAppPreferences()

  const structuredNote = hasStructuredPayload
    ? '助手草稿含结构化 JSON 卡片，展示文字可为空或极短，请重点检查门店位置与事实性。'
    : ''

  const userContent =
    mode === 'review'
      ? [
          `用户问题：${userMessage}`,
          `助手草稿：\n${draft}`,
          structuredNote,
          `本地规则已发现问题：${localIssues.length ? localIssues.join('；') : '无'}`,
          `用户偏好：${prefs.ai.tone} / ${prefs.ai.detail}`,
          userContext,
          '请质检草稿并输出 JSON。',
        ]
          .filter(Boolean)
          .join('\n\n')
      : [
          `用户问题：${userMessage}`,
          `原草稿：\n${draft}`,
          structuredNote,
          `必须修复的严重问题：\n${localIssues.map((i) => `- ${i}`).join('\n')}`,
          userContext,
          '请重写完整回复，输出 JSON，approved 应为 true，revisedContent 为修订后的全文。',
        ]
          .filter(Boolean)
          .join('\n\n')

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

function collectCriticalIssues(issues: string[]): string[] {
  return issues.filter(isCriticalIssue)
}

function shouldBlockReply(params: {
  criticalIssues: string[]
  llm: GuardLlmPayload | null
}): boolean {
  const { criticalIssues, llm } = params
  if (criticalIssues.length === 0) return false
  if (llm?.approved === true) return false
  if (llm?.severity === 'low') return false
  return true
}

export async function runOutputGuard(params: {
  config: OpenClawConfig
  connected: boolean
  enabled: boolean
  userMessage: string
  draft: string
  rawDraft?: string
  hasStructuredPayload?: boolean
  userLocation?: UserLocation | null
  signal?: AbortSignal
}): Promise<OutputGuardResult> {
  const {
    config,
    connected,
    enabled,
    userMessage,
    draft,
    rawDraft = draft,
    hasStructuredPayload = false,
    userLocation,
    signal,
  } = params
  const trimmedDraft = draft.trim()
  const guardDraft = rawDraft.trim() || trimmedDraft

  if (!enabled) {
    return {
      finalContent: trimmedDraft,
      approved: true,
      issues: [],
      guardUsed: 'passthrough',
    }
  }

  const guardStart = performance.now()
  const local = runLocalOutputGuard(trimmedDraft, userMessage, userLocation, {
    hasStructuredPayload,
    rawDraft: guardDraft,
  })

  debugPerf(
    'outputGuard.ts:runOutputGuard',
    'local_guard_done',
    {
      passed: local.passed,
      criticalCount: local.criticalIssues.length,
      nonCriticalCount: local.nonCriticalIssues.length,
      hasStructuredPayload,
      draftLen: trimmedDraft.length,
      localMs: Math.round(performance.now() - guardStart),
    },
    'B',
  )

  if (local.issues.length === 0) {
    debugPerf(
      'outputGuard.ts:runOutputGuard',
      'skip_llm_local_clean',
      { totalMs: Math.round(performance.now() - guardStart) },
      'B',
    )
    return {
      finalContent: trimmedDraft,
      approved: true,
      issues: [],
      guardUsed: 'local',
    }
  }

  if (!connected || !config.token.trim()) {
    if (local.criticalIssues.length === 0) {
      return {
        finalContent: trimmedDraft,
        approved: true,
        issues: local.issues,
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
    guardDraft,
    local.issues,
    signal,
    'review',
    hasStructuredPayload,
  )

  let issues = [...local.issues, ...(llm?.issues ?? [])]
  const criticalIssues = collectCriticalIssues(issues)

  if (llm?.revisedContent?.trim()) {
    const revised = llm.revisedContent.trim()
    const recheck = runLocalOutputGuard(revised, userMessage, userLocation, {
      hasStructuredPayload,
      rawDraft: guardDraft,
    })
    if (recheck.criticalIssues.length === 0) {
      return {
        finalContent: revised,
        approved: true,
        issues: llm.issues ?? issues,
        guardUsed: llm.approved === false ? 'revise' : 'llm',
      }
    }
  }

  if (!shouldBlockReply({ criticalIssues, llm })) {
    debugPerf(
      'outputGuard.ts:runOutputGuard',
      'guard_complete',
      {
        guardUsed: 'llm',
        approved: true,
        totalMs: Math.round(performance.now() - guardStart),
      },
      'B',
    )
    return {
      finalContent: trimmedDraft,
      approved: true,
      issues: local.nonCriticalIssues,
      guardUsed: 'llm',
    }
  }

  const revise = await callGuardLlm(
    config,
    userMessage,
    guardDraft,
    criticalIssues,
    signal,
    'revise',
    hasStructuredPayload,
  )

  if (revise?.revisedContent?.trim()) {
    const revised = revise.revisedContent.trim()
    const recheck = runLocalOutputGuard(revised, userMessage, userLocation, {
      hasStructuredPayload,
      rawDraft: guardDraft,
    })
    if (recheck.criticalIssues.length === 0) {
      return {
        finalContent: revised,
        approved: true,
        issues,
        guardUsed: 'revise',
      }
    }
  }

  if (llm == null && local.criticalIssues.length === 0) {
    return {
      finalContent: trimmedDraft,
      approved: true,
      issues: local.issues,
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
