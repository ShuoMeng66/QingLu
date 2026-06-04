import type { QingluSkillModuleId } from '../generated/qingluSkillModules'
import {
  extractJsonBlock,
  extractRecommendationNamesFromPayload,
  splitAssistantStructured,
} from './assistantStructured'

export interface SessionContext {
  current_skill: QingluSkillModuleId | null
  scene_type: string | null
  last_recommendations: string[]
  selected_item: string | null
  party_size: number | null
  current_area: string | null
}

const STORAGE_KEY = 'qinglu.session-context-v1'

export const EMPTY_SESSION_CONTEXT: SessionContext = {
  current_skill: null,
  scene_type: null,
  last_recommendations: [],
  selected_item: null,
  party_size: null,
  current_area: null,
}

export function loadSessionContext(): SessionContext {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SESSION_CONTEXT, last_recommendations: [] }
    const parsed = JSON.parse(raw) as SessionContext
    return {
      ...EMPTY_SESSION_CONTEXT,
      ...parsed,
      last_recommendations: Array.isArray(parsed.last_recommendations)
        ? parsed.last_recommendations
        : [],
    }
  } catch {
    return { ...EMPTY_SESSION_CONTEXT, last_recommendations: [] }
  }
}

export function saveSessionContext(ctx: SessionContext): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx))
}

/** First message in a thread: seed area from today/location */
export function seedSessionContextForTurn(patch: {
  current_area?: string
  current_skill?: QingluSkillModuleId | null
  scene_type?: string | null
}): SessionContext {
  const prev = loadSessionContext()
  const next: SessionContext = {
    ...prev,
    current_area: patch.current_area ?? prev.current_area,
    current_skill: patch.current_skill ?? prev.current_skill,
    scene_type: patch.scene_type ?? prev.scene_type,
  }
  saveSessionContext(next)
  return next
}

/** After assistant reply: extract store/restaurant names from ---JSON_START--- blocks (best-effort) */
export function updateSessionFromAssistantReply(
  reply: string,
  routedSkill: QingluSkillModuleId | null,
): void {
  const prev = loadSessionContext()
  const split = splitAssistantStructured(reply)
  const fromPayload = extractRecommendationNamesFromPayload(split.payload)
  const names = fromPayload.length > 0 ? fromPayload : extractRecommendationNames(reply)

  const sceneFromPayload =
    typeof split.payload?.scene_type === 'string' ? split.payload.scene_type : null

  const next: SessionContext = {
    ...prev,
    current_skill: routedSkill ?? prev.current_skill,
    scene_type: sceneFromPayload ?? prev.scene_type,
    last_recommendations: names.length > 0 ? names : prev.last_recommendations,
  }
  saveSessionContext(next)
}

export function setSessionSelection(item: string, partySize?: number): void {
  const prev = loadSessionContext()
  saveSessionContext({
    ...prev,
    selected_item: item,
    party_size: partySize ?? prev.party_size,
  })
}

function extractRecommendationNames(text: string): string[] {
  const extracted = extractJsonBlock(text)
  const block = extracted.rawJson
  if (!block) return []
  const names: string[] = []
  const patterns = [
    /"restaurant_name"\s*:\s*"([^"]+)"/g,
    /"store_name"\s*:\s*"([^"]+)"/g,
    /"venue_name"\s*:\s*"([^"]+)"/g,
    /"name"\s*:\s*"([^"]+)"/g,
  ]
  for (const re of patterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(block)) !== null) {
      const n = m[1]?.trim()
      if (n && !names.includes(n)) names.push(n)
    }
  }
  return names.slice(0, 8)
}
