import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import type { UserLocation } from './userLocation'
import { formatLocationLabel } from './citySkyline'

const FACADE_CACHE_KEY = 'qinglu.venue-facade-v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const ENRICH_TIMEOUT_MS = 45_000

export interface VenueEnrichPayload {
  id: string
  name: string
  area?: string
  address?: string
}

export interface VenueEnrichHit {
  id: string
  facadeImageUrl?: string
  facadeSummary?: string
  sources?: string[]
  confidence?: 'high' | 'low'
}

interface FacadeCacheEntry {
  hit: VenueEnrichHit
  at: number
}

type SkillVenueCard = DetailSheetData & {
  _venueId?: string
  _geocodeQuery?: string
  _placeholderImageSrc?: string
  facadeSummary?: string
  sourceUrls?: string[]
  realFacade?: boolean
}

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function readFacadeCache(): Record<string, FacadeCacheEntry> {
  try {
    return JSON.parse(
      localStorage.getItem(FACADE_CACHE_KEY) ?? '{}',
    ) as Record<string, FacadeCacheEntry>
  } catch {
    return {}
  }
}

function writeFacadeCache(cache: Record<string, FacadeCacheEntry>) {
  localStorage.setItem(FACADE_CACHE_KEY, JSON.stringify(cache))
}

function facadeCacheKey(venueId: string, location?: UserLocation | null): string {
  if (!location) return venueId
  return `${venueId}@${formatLocationLabel(location.city, location.region)}`
}

function getCachedHit(venueId: string, location?: UserLocation | null): VenueEnrichHit | null {
  const cache = readFacadeCache()
  const entry = cache[facadeCacheKey(venueId, location)]
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    delete cache[facadeCacheKey(venueId, location)]
    writeFacadeCache(cache)
    return null
  }
  return entry.hit
}

function setCachedHit(venueId: string, hit: VenueEnrichHit, location?: UserLocation | null) {
  const cache = readFacadeCache()
  cache[facadeCacheKey(venueId, location)] = { hit, at: Date.now() }
  writeFacadeCache(cache)
}

export function isSkillVenueCard(card: DetailSheetData): boolean {
  return Boolean((card as SkillVenueCard)._venueId)
}

export function stripVenueCardInternals(card: DetailSheetData): DetailSheetData {
  const skill = card as SkillVenueCard
  const {
    _venueId: _id,
    _geocodeQuery: _geo,
    _placeholderImageSrc: _ph,
    ...rest
  } = skill
  if (_ph && !rest.placeholderImageSrc) {
    rest.placeholderImageSrc = _ph
  }
  return rest
}

function collectEnrichPayload(cards: DetailSheetData[]): VenueEnrichPayload[] {
  const payloads: VenueEnrichPayload[] = []
  for (const card of cards) {
    const skill = card as SkillVenueCard
    const id = skill._venueId
    if (!id) continue
    payloads.push({
      id,
      name: card.title,
      area: card.subtitle,
      address: card.location,
    })
  }
  return payloads
}

async function fetchVenueEnrichment(
  venues: VenueEnrichPayload[],
  userLocation?: UserLocation | null,
): Promise<VenueEnrichHit[]> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), ENRICH_TIMEOUT_MS)
  try {
    const response = await fetch('/api/venue/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        venues,
        userLocation: userLocation
          ? {
              city: userLocation.city,
              region: userLocation.region,
              lat: userLocation.lat,
              lon: userLocation.lon,
            }
          : undefined,
      }),
      signal: controller.signal,
    })
    const raw = await response.json().catch(() => ({}))
    if (!response.ok) return []
    const rows = (raw as { venues?: VenueEnrichHit[] }).venues
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  } finally {
    window.clearTimeout(timer)
  }
}

function applyHit(card: DetailSheetData, hit: VenueEnrichHit): DetailSheetData {
  const skill = card as SkillVenueCard
  const placeholder =
    skill._placeholderImageSrc ?? skill.imageSrc

  const next: SkillVenueCard = { ...skill }
  if (hit.facadeSummary) next.facadeSummary = hit.facadeSummary
  if (hit.sources?.length) next.sourceUrls = hit.sources
  if (hit.facadeImageUrl && isValidHttpsUrl(hit.facadeImageUrl)) {
    next.imageSrc = hit.facadeImageUrl
    next.realFacade = true
    if (!next._placeholderImageSrc && placeholder) {
      next._placeholderImageSrc = placeholder
    }
  }
  return next
}

/**
 * Enrich Skill-matched venue cards with real facade images (Venue Scout).
 * OSM fallback cards are returned unchanged.
 */
export async function enrichCardsWithFacade(
  cards: DetailSheetData[],
  userLocation?: UserLocation | null,
): Promise<DetailSheetData[]> {
  if (cards.length === 0) return cards

  const skillCards = cards.filter(isSkillVenueCard)
  if (skillCards.length === 0) return cards

  const withPlaceholder = cards.map((card) => {
    if (!isSkillVenueCard(card)) return card
    const skill = card as SkillVenueCard
    return {
      ...skill,
      _placeholderImageSrc: skill._placeholderImageSrc ?? skill.imageSrc,
    } satisfies SkillVenueCard
  })

  const payloads = collectEnrichPayload(withPlaceholder)
  if (payloads.length === 0) return withPlaceholder.map(stripVenueCardInternals)

  const cachedById = new Map<string, VenueEnrichHit>()
  const toFetch: VenueEnrichPayload[] = []

  for (const payload of payloads) {
    const cached = getCachedHit(payload.id, userLocation)
    if (cached) cachedById.set(payload.id, cached)
    else toFetch.push(payload)
  }

  if (toFetch.length > 0) {
    const fetched = await fetchVenueEnrichment(toFetch, userLocation)
    for (const hit of fetched) {
      if (!hit?.id) continue
      setCachedHit(hit.id, hit, userLocation)
      cachedById.set(hit.id, hit)
    }
  }

  const merged = withPlaceholder.map((card) => {
    const id = (card as SkillVenueCard)._venueId
    if (!id) return stripVenueCardInternals(card)
    const hit = cachedById.get(id)
    if (!hit) return stripVenueCardInternals(card)
    return stripVenueCardInternals(applyHit(card, hit))
  })

  return merged
}
