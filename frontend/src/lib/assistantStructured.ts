import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import type { AssistantMessageMeta } from '../types/openclaw'
import type { NearbyPlace } from './nearbyRecommendations'
import { placeToRichCardData } from './nearbyRecommendations'
import type { UserLocation } from './userLocation'
import { buildSkillVenueCards, matchVenuesInText } from './skillVenueMatch'
import { getConversationRecommendationCards } from './recommendationIntent'

const JSON_BLOCK_RE = /---JSON_START---([\s\S]*?)---JSON_END---/i

export interface FollowUpAction {
  label: string
  message?: string
  action_type?: string
  scene_type?: string
  party_size?: number
  selected_index?: number
}

export interface StructuredSplit {
  displayContent: string
  rawJson: string | null
  payload: Record<string, unknown> | null
  meta: AssistantMessageMeta | null
}

function tryParseJson(block: string): Record<string, unknown> | null {
  const trimmed = block.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // model may wrap extra text; try first `{...}` span
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        return null
      }
    }
  }
  return null
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((item) => item && typeof item === 'object') as Record<string, unknown>[]
}

export function extractRecommendationNamesFromPayload(
  payload: Record<string, unknown> | null,
): string[] {
  if (!payload) return []

  const names: string[] = []
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim() && !names.includes(value.trim())) {
      names.push(value.trim())
    }
  }

  for (const rec of asRecordArray(payload.recommendations)) {
    push(rec.restaurant_name)
    push(rec.store_name)
    push(rec.venue_name)
    push(rec.name)
  }

  for (const rec of asRecordArray(payload.service_recommendations)) {
    push(rec.shop_name)
    push(rec.name)
  }

  push(payload.restaurant_name)
  push(payload.store_name)
  push(payload.venue_name)

  return names.slice(0, 8)
}

export function extractFollowUpActions(payload: Record<string, unknown> | null): FollowUpAction[] {
  if (!payload) return []
  const raw = payload.follow_up_actions
  if (!Array.isArray(raw)) return []

  const actions: FollowUpAction[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const label =
      typeof row.label === 'string'
        ? row.label
        : typeof row.text === 'string'
          ? row.text
          : typeof row.action === 'string'
            ? row.action
            : ''
    if (!label.trim()) continue
    actions.push({
      label: label.trim(),
      message: typeof row.message === 'string' ? row.message : undefined,
      action_type: typeof row.action_type === 'string' ? row.action_type : undefined,
      scene_type: typeof row.scene_type === 'string' ? row.scene_type : undefined,
      party_size: typeof row.party_size === 'number' ? row.party_size : undefined,
      selected_index: typeof row.selected_index === 'number' ? row.selected_index : undefined,
    })
  }
  return actions
}

function payloadKind(payload: Record<string, unknown>): string {
  if (typeof payload.type === 'string') return payload.type
  if (typeof payload.scene_type === 'string') return payload.scene_type
  return 'structured'
}

function recommendationTitle(rec: Record<string, unknown>): string {
  const name =
    rec.restaurant_name ??
    rec.store_name ??
    rec.venue_name ??
    rec.shop_name ??
    rec.name
  return typeof name === 'string' ? name.trim() : ''
}

function recommendationSubtitle(rec: Record<string, unknown>): string | undefined {
  const parts = [
    rec.district,
    rec.area,
    rec.cuisine,
    rec.reason,
    rec.highlight,
  ].filter((v) => typeof v === 'string' && v.trim()) as string[]
  return parts[0]?.trim()
}

function recommendationStats(rec: Record<string, unknown>): Array<{ label: string; value: string }> {
  const stats: Array<{ label: string; value: string }> = []
  if (typeof rec.price === 'string' || typeof rec.price === 'number') {
    stats.push({ label: '价格', value: String(rec.price) })
  }
  if (typeof rec.avg_price === 'string' || typeof rec.avg_price === 'number') {
    stats.push({ label: '人均', value: `约 ¥${rec.avg_price}` })
  }
  if (typeof rec.estimated_kcal === 'number') {
    stats.push({ label: '热量', value: `约 ${rec.estimated_kcal} kcal` })
  }
  if (typeof rec.kcal === 'number') {
    stats.push({ label: '热量', value: `约 ${rec.kcal} kcal` })
  }
  if (typeof rec.rating === 'number') {
    stats.push({ label: '评分', value: String(rec.rating) })
  }
  return stats
}

function iconForPayload(kind: string): 'food' | 'gym' {
  if (/venue|gym|class|activity/i.test(kind)) return 'gym'
  return 'food'
}

function tagForPayload(kind: string): string {
  if (/takeout/i.test(kind)) return '外卖推荐'
  if (/dining|restaurant/i.test(kind)) return '餐饮推荐'
  if (/venue|gym|class/i.test(kind)) return '附近健身房'
  if (/recovery|service/i.test(kind)) return '恢复服务'
  if (/activity/i.test(kind)) return '一起动'
  return '推荐'
}

export function structuredRecommendationsToCards(
  payload: Record<string, unknown> | null,
  location?: UserLocation | null,
): DetailSheetData[] {
  if (!payload) return []

  const kind = payloadKind(payload)
  const lists = [
    ...asRecordArray(payload.recommendations),
    ...asRecordArray(payload.service_recommendations),
  ]

  const cards: DetailSheetData[] = []
  for (const rec of lists) {
    const title = recommendationTitle(rec)
    if (!title) continue

    const platform = rec.platform_card as Record<string, unknown> | undefined
    const searchKeyword =
      typeof platform?.search_keyword === 'string' ? platform.search_keyword : undefined
    const listingUrl =
      typeof platform?.url === 'string' && platform.url ? platform.url : undefined

    const matched = matchVenuesInText(title, 1, location)
    if (matched.length > 0) {
      cards.push(...buildSkillVenueCards(matched))
      continue
    }

    cards.push({
      kind: iconForPayload(kind) === 'gym' ? 'gym' : 'food',
      tag: tagForPayload(kind),
      title,
      subtitle: recommendationSubtitle(rec),
      tags: [
        typeof rec.cuisine === 'string' ? rec.cuisine : '',
        typeof rec.diet_friendly_score === 'number' && rec.diet_friendly_score >= 4
          ? '减脂友好'
          : '',
      ].filter(Boolean) as string[],
      stats: recommendationStats(rec),
      location:
        typeof rec.address === 'string'
          ? rec.address
          : typeof rec.district === 'string'
            ? rec.district
            : searchKeyword,
      iconType: iconForPayload(kind),
      listingUrl: listingUrl ?? undefined,
      city: typeof rec.district === 'string' ? rec.district.split('·')[0] : undefined,
      imageGradient: 'linear-gradient(135deg, #d1fae5 0%, #99f6e4 100%)',
      _geocodeQuery: searchKeyword ?? `${title} ${rec.district ?? ''}`.trim(),
    } as DetailSheetData & { _geocodeQuery?: string })
  }

  return cards.slice(0, 4)
}

export function splitAssistantStructured(text: string): StructuredSplit {
  const match = text.match(JSON_BLOCK_RE)
  if (!match) {
    return {
      displayContent: text.trim(),
      rawJson: null,
      payload: null,
      meta: null,
    }
  }

  const rawJson = match[1]?.trim() ?? ''
  const displayContent = text.replace(JSON_BLOCK_RE, '').trim()
  const payload = tryParseJson(rawJson)
  const recommendationNames = extractRecommendationNamesFromPayload(payload)
  const followUpActions = extractFollowUpActions(payload)

  const meta: AssistantMessageMeta | null = payload
    ? {
        payloadType: payloadKind(payload),
        recommendationNames,
        followUpActions,
        isProfileComplete:
          payload.type === 'profile_complete' ||
          payloadKind(payload) === 'profile_complete',
        isMedicalSafety:
          payload.type === 'medical_safety_response' ||
          payload.scene_type === 'safety',
      }
    : followUpActions.length > 0
      ? { followUpActions, recommendationNames }
      : null

  return { displayContent, rawJson, payload, meta }
}

export function getMessageRecommendationCards(
  assistantContent: string,
  userText: string,
  location: UserLocation | null,
  foodPlaces: NearbyPlace[],
  gym: NearbyPlace | null,
  recovery: NearbyPlace | null,
  options?: { citeNearby?: boolean; assistantMeta?: AssistantMessageMeta | null },
): DetailSheetData[] {
  const meta = options?.assistantMeta
  if (meta?.isMedicalSafety) return []

  const hasJsonBlock = /---JSON_START---/i.test(assistantContent)
  const prose =
    meta || !hasJsonBlock
      ? assistantContent
      : splitAssistantStructured(assistantContent).displayContent

  if (!hasJsonBlock && meta?.recommendationNames?.length) {
    const matched = matchVenuesInText(meta.recommendationNames.join(' '), 3, location)
    if (matched.length > 0) return buildSkillVenueCards(matched)
  }

  if (hasJsonBlock) {
    const payload = splitAssistantStructured(assistantContent).payload
    const structuredCards = structuredRecommendationsToCards(payload, location)
    if (structuredCards.length > 0) return structuredCards

    const names = meta?.recommendationNames ?? extractRecommendationNamesFromPayload(payload)
    if (names.length > 0) {
      const matched = matchVenuesInText(names.join(' '), 3, location)
      if (matched.length > 0) return buildSkillVenueCards(matched)
    }
  }

  return getConversationRecommendationCards(userText, location, foodPlaces, gym, recovery, {
    citeNearby: options?.citeNearby,
    assistantText: prose,
  })
}

export function inferFollowUpSelection(
  action: FollowUpAction,
  lastRecommendations: string[],
): { item: string | null; partySize: number | null } {
  const text = `${action.label} ${action.message ?? ''}`
  const partyMatch = text.match(/(\d+)\s*人/)
  const partySize =
    action.party_size ?? (partyMatch ? Number(partyMatch[1]) : null)

  let index = action.selected_index
  if (index == null) {
    if (/第一|首家|第一家|就这家|选\s*1|第\s*1/.test(text)) index = 0
    else if (/第二|第二家|选\s*2|第\s*2/.test(text)) index = 1
    else if (/第三|第三家|选\s*3|第\s*3/.test(text)) index = 2
  }

  const item =
    index != null && lastRecommendations[index]
      ? lastRecommendations[index]
      : lastRecommendations[0] ?? null

  return { item, partySize: partySize != null && Number.isFinite(partySize) ? partySize : null }
}

export function buildFollowUpUserMessage(action: FollowUpAction): string {
  if (action.message?.trim()) return action.message.trim()
  return action.label.trim()
}

/** OSM fallback cards unchanged */
export { placeToRichCardData }
