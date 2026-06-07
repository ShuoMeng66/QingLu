import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import type { AssistantMessageMeta } from '../types/openclaw'
import type { NearbyPlace } from './nearbyRecommendations'
import { placeToRichCardData } from './nearbyRecommendations'
import type { UserLocation } from './userLocation'
import { buildSkillVenueCards, matchVenuesInText } from './skillVenueMatch'
import { getConversationRecommendationCards } from './recommendationIntent'
import { buildTakeoutDetailCard } from './takeoutVenueData'

const JSON_BLOCK_RE = /---JSON_START---([\s\S]*?)---JSON_END---/i
const JSON_START_RE = /---JSON_START---/i

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

export function extractJsonBlock(text: string): {
  rawJson: string | null
  complete: boolean
} {
  const startMatch = text.match(JSON_START_RE)
  if (!startMatch || startMatch.index == null) {
    return { rawJson: null, complete: false }
  }

  const bodyStart = startMatch.index + startMatch[0].length
  const tail = text.slice(bodyStart)
  const endMatch = tail.match(/---JSON_END---/i)
  if (endMatch && endMatch.index != null) {
    return { rawJson: tail.slice(0, endMatch.index).trim(), complete: true }
  }

  return { rawJson: tail.trim(), complete: false }
}

function repairTruncatedJson(trimmed: string): string | null {
  const candidates = [
    trimmed,
    `${trimmed}"}`,
    `${trimmed}]}`,
    `${trimmed}}]}`,
    `${trimmed}"}]}`,
    `${trimmed}]}`,
    `${trimmed}}`,
  ]
  for (const candidate of candidates) {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start < 0 || end <= start) continue
    const slice = candidate.slice(start, end + 1)
    try {
      const parsed = JSON.parse(slice) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return slice
      }
    } catch {
      /* try next */
    }
  }
  return null
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
    const repaired = repairTruncatedJson(trimmed)
    if (repaired) {
      try {
        const parsed = JSON.parse(repaired) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        /* fall through */
      }
    }
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        return parsePartialRecommendationPayload(trimmed)
      }
    }
    return parsePartialRecommendationPayload(trimmed)
  }
  return null
}

/** Best-effort when stream ends before ---JSON_END--- */
function parsePartialRecommendationPayload(block: string): Record<string, unknown> | null {
  const recs: Record<string, unknown>[] = []
  const objectRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
  let match: RegExpExecArray | null
  while ((match = objectRe.exec(block)) !== null) {
    try {
      const row = JSON.parse(match[0]) as Record<string, unknown>
      if (
        row.store_name ||
        row.restaurant_name ||
        row.item_id ||
        row.name ||
        row.venue_name
      ) {
        recs.push(row)
      }
    } catch {
      /* skip fragment */
    }
  }
  if (recs.length === 0) return null
  return {
    scene_type: 'takeout',
    recommendations: recs,
  }
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
  const platform = rec.platform_card as Record<string, unknown> | undefined
  if (typeof platform?.title === 'string' && platform.title.trim()) {
    return platform.title.trim()
  }
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
  const platform = rec.platform_card as Record<string, unknown> | undefined
  if (typeof platform?.meta === 'string' && platform.meta.trim()) {
    stats.push({ label: '参考', value: platform.meta.trim() })
  }
  if (typeof rec.price === 'string' || typeof rec.price === 'number') {
    stats.push({ label: '价格', value: String(rec.price) })
  }
  if (typeof rec.avg_price === 'string' || typeof rec.avg_price === 'number') {
    stats.push({ label: '人均', value: `约 ¥${rec.avg_price}` })
  }
  if (typeof rec.avg_price_yuan === 'string' || typeof rec.avg_price_yuan === 'number') {
    stats.push({ label: '价格', value: `约 ¥${rec.avg_price_yuan}` })
  }
  if (typeof rec.kcal_range === 'string' && rec.kcal_range.trim()) {
    stats.push({ label: '热量', value: rec.kcal_range.trim() })
  }
  if (typeof rec.estimated_kcal === 'number') {
    stats.push({ label: '消耗', value: `约 ${rec.estimated_kcal} kcal` })
  }
  if (typeof rec.kcal === 'number') {
    stats.push({ label: '热量', value: `约 ${rec.kcal} kcal` })
  }
  if (typeof rec.protein_g === 'number') {
    stats.push({ label: '蛋白质', value: `约 ${rec.protein_g} g` })
  }
  if (typeof rec.intensity === 'string' && rec.intensity.trim()) {
    stats.push({ label: '强度', value: rec.intensity.trim() })
  }
  if (typeof rec.rating === 'number') {
    stats.push({ label: '评分', value: String(rec.rating) })
  }
  return stats
}

function hasPlatformCardData(rec: Record<string, unknown>): boolean {
  const platform = rec.platform_card as Record<string, unknown> | undefined
  return Boolean(
    (typeof rec.image === 'string' && rec.image.trim()) ||
      (typeof platform?.title === 'string' && platform.title.trim()),
  )
}

function buildPlatformDetailCard(
  rec: Record<string, unknown>,
  kind: string,
): DetailSheetData | null {
  const title = recommendationTitle(rec)
  if (!title) return null

  const platform = rec.platform_card as Record<string, unknown> | undefined
  const platformSubtitle =
    typeof platform?.subtitle === 'string' && platform.subtitle.trim()
      ? platform.subtitle.trim()
      : undefined
  const platformTags = Array.isArray(platform?.tags)
    ? platform.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : []
  const reason =
    typeof rec.recommendation_reason === 'string' && rec.recommendation_reason.trim()
      ? rec.recommendation_reason.trim()
      : typeof rec.reason === 'string' && rec.reason.trim()
        ? rec.reason.trim()
        : undefined

  const imageSrc =
    typeof rec.image === 'string' && rec.image.trim() ? rec.image.trim() : undefined
  const listingUrl =
    typeof platform?.url === 'string' && platform.url ? platform.url : undefined
  const searchKeyword =
    typeof platform?.search_keyword === 'string' ? platform.search_keyword : undefined

  return {
    kind: iconForPayload(kind) === 'gym' ? 'gym' : 'food',
    tag: tagForPayload(kind),
    title,
    subtitle: platformSubtitle ?? reason ?? recommendationSubtitle(rec),
    intro: platformSubtitle ?? reason,
    tags: platformTags.length > 0 ? platformTags.slice(0, 4) : [],
    stats: recommendationStats(rec),
    location:
      typeof rec.address === 'string'
        ? rec.address
        : typeof rec.district === 'string'
          ? rec.district
          : typeof rec.distance === 'string'
            ? rec.distance
            : searchKeyword,
    imageSrc,
    iconType: iconForPayload(kind),
    listingUrl: listingUrl ?? undefined,
    city: typeof rec.district === 'string' ? rec.district.split('·')[0] : undefined,
    imageGradient: 'linear-gradient(135deg, #d1fae5 0%, #99f6e4 100%)',
    _geocodeQuery: searchKeyword ?? `${title} ${rec.district ?? ''}`.trim(),
  } as DetailSheetData & { _geocodeQuery?: string }
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

function isTakeoutPayload(kind: string, payload: Record<string, unknown>): boolean {
  if (/takeout/i.test(kind)) return true
  const scene = typeof payload.scene_type === 'string' ? payload.scene_type : ''
  return /takeout/i.test(scene)
}

export function structuredRecommendationsToCards(
  payload: Record<string, unknown> | null,
  location?: UserLocation | null,
): DetailSheetData[] {
  if (!payload) return []

  const kind = payloadKind(payload)
  const takeoutScene = isTakeoutPayload(kind, payload)
  const lists = [
    ...asRecordArray(payload.recommendations),
    ...asRecordArray(payload.service_recommendations),
  ]

  const cards: DetailSheetData[] = []
  for (const rec of lists) {
    const title = recommendationTitle(rec)
    if (!title) continue

    if (takeoutScene) {
      const takeoutCard = buildTakeoutDetailCard(rec)
      if (takeoutCard) {
        cards.push(takeoutCard)
        continue
      }
    }

    if (hasPlatformCardData(rec)) {
      const platformCard = buildPlatformDetailCard(rec, kind)
      if (platformCard) {
        cards.push(platformCard)
        continue
      }
    }

    const platform = rec.platform_card as Record<string, unknown> | undefined
    const searchKeyword =
      typeof platform?.search_keyword === 'string' ? platform.search_keyword : undefined
    const listingUrl =
      typeof platform?.url === 'string' && platform.url ? platform.url : undefined

    const matched = matchVenuesInText(title, 1, location)
    if (matched.length > 0 && !takeoutScene) {
      cards.push(...buildSkillVenueCards(matched))
      continue
    }

    if (takeoutScene) {
      const fallback = buildTakeoutDetailCard(rec)
      if (fallback) {
        cards.push(fallback)
        continue
      }
    }

    const fallbackCard = buildPlatformDetailCard(rec, kind)
    if (fallbackCard) {
      cards.push(fallbackCard)
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

function stripJsonFromDisplay(text: string): string {
  if (JSON_BLOCK_RE.test(text)) {
    return text.replace(JSON_BLOCK_RE, '').trim()
  }
  const start = text.search(JSON_START_RE)
  if (start < 0) return text.trim()
  return text.slice(0, start).trim()
}

export function splitAssistantStructured(text: string): StructuredSplit {
  const closed = text.match(JSON_BLOCK_RE)
  const extracted = closed
    ? { rawJson: closed[1]?.trim() ?? '', complete: true }
    : extractJsonBlock(text)

  if (!extracted.rawJson) {
    return {
      displayContent: text.trim(),
      rawJson: null,
      payload: null,
      meta: null,
    }
  }

  const rawJson = extracted.rawJson
  const displayContent = stripJsonFromDisplay(text)
  const payload = tryParseJson(rawJson)
  const recommendationNames = extractRecommendationNamesFromPayload(payload)
  const followUpActions = extractFollowUpActions(payload)

  const meta: AssistantMessageMeta | null = payload
    ? {
        payloadType: payloadKind(payload),
        recommendationNames,
        followUpActions,
        structuredPayload: payload,
        jsonBlockComplete: extracted.complete,
        isProfileComplete:
          payload.type === 'profile_complete' ||
          payloadKind(payload) === 'profile_complete',
        isMedicalSafety:
          payload.type === 'medical_safety_response' ||
          payload.scene_type === 'safety',
      }
    : followUpActions.length > 0 || recommendationNames.length > 0
      ? {
          followUpActions,
          recommendationNames,
          structuredPayload: null,
          jsonBlockComplete: extracted.complete,
          payloadType: undefined,
        }
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

  const hasJsonBlock = JSON_START_RE.test(assistantContent)
  const payload =
    meta?.structuredPayload ??
    (hasJsonBlock ? splitAssistantStructured(assistantContent).payload : null)
  const prose =
    meta?.structuredPayload || !hasJsonBlock
      ? assistantContent
      : splitAssistantStructured(assistantContent).displayContent

  if (payload) {
    const structuredCards = structuredRecommendationsToCards(payload, location)
    if (structuredCards.length > 0) return structuredCards
  }

  if (!hasJsonBlock && meta?.recommendationNames?.length) {
    const matched = matchVenuesInText(meta.recommendationNames.join(' '), 3, location)
    if (matched.length > 0) return buildSkillVenueCards(matched)
  }

  if (hasJsonBlock || meta?.structuredPayload) {
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
