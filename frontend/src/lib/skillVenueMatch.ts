import type { QingluVenueRecord } from '../data/qingluVenues.generated'
import { QINGLU_VENUES } from '../data/qingluVenues.generated'
import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import type { NearbyPlaceKind } from './nearbyRecommendations'
import type { UserLocation } from './userLocation'
import { routeDietScene } from './evalAgent'
import { filterVenuesForUser } from './venueRegion'
import {
  isRecoveryIntent,
  shouldShowNearbyFood,
  shouldShowNearbyGym,
} from './recommendationIntent'

const VENUE_IMAGE_BY_CUISINE: Array<{ pattern: RegExp; src: string }> = [
  { pattern: /火锅|麻辣烫/, src: '/images/splash/hero-healthy-meal.png' },
  { pattern: /轻食|沙拉|外卖|FOODBOWL/i, src: '/images/splash/hero-healthy-meal.png' },
  { pattern: /川菜|湘|鄂/, src: '/images/splash/hero-healthy-meal.png' },
  { pattern: /日料|寿司/, src: '/images/splash/hero-healthy-meal.png' },
  { pattern: /健身|力量|瑜伽|游泳|拳击/, src: '/images/splash/hero-gym-training.png' },
  { pattern: /推拿|按摩|拉伸|恢复|SPA/i, src: '/images/splash/hero-recovery-stretch.png' },
  { pattern: /飞盘|骑行|徒步|跑|球|活动/, src: '/images/splash/hero-outdoor-play.png' },
]

const DEFAULT_VENUE_IMAGE = '/images/splash/hero-healthy-meal.png'

const GEO_CACHE_KEY = 'qinglu.venue-geocode-v1'

function normalizeName(value: string): string {
  return value
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

function venueImageSrc(venue: QingluVenueRecord): string {
  const key = `${venue.cuisine} ${venue.name} ${venue.type}`
  for (const rule of VENUE_IMAGE_BY_CUISINE) {
    if (rule.pattern.test(key)) return rule.src
  }
  return DEFAULT_VENUE_IMAGE
}

function venueKind(venue: QingluVenueRecord): NearbyPlaceKind {
  if (venue.type === 'gym' || venue.type === 'activity') return 'gym'
  if (venue.type === 'recovery') return 'recovery'
  return 'food'
}

function venueMentionedInText(venue: QingluVenueRecord, normalized: string): boolean {
  const core = normalizeName(venue.name)
  if (core.length < 2) return false
  const aliasHit = (venue.aliases ?? []).some(
    (alias) => alias.length >= 2 && normalized.includes(alias.replace(/\s+/g, '')),
  )
  return (
    aliasHit ||
    normalized.includes(venue.name.replace(/\s+/g, '')) ||
    normalized.toLowerCase().includes(core)
  )
}

export function matchVenuesInText(
  text: string,
  limit = 3,
  location?: UserLocation | null,
): QingluVenueRecord[] {
  const normalized = text.replace(/\s+/g, '')
  if (!normalized.trim()) return []

  const hits: QingluVenueRecord[] = []
  const seen = new Set<string>()

  for (const venue of QINGLU_VENUES) {
    if (!venueMentionedInText(venue, normalized)) continue
    if (seen.has(venue.id)) continue
    seen.add(venue.id)
    hits.push(venue)
  }

  const local = filterVenuesForUser(hits, location)
  return local.slice(0, limit)
}

export function shouldAttachVenueCards(
  userText: string,
  assistantText: string,
  citeNearby: boolean,
): boolean {
  if (!citeNearby) return false
  const combined = `${userText}\n${assistantText}`.trim()
  if (!combined) return false
  if (shouldShowNearbyFood(combined) || shouldShowNearbyGym(combined) || isRecoveryIntent(combined)) {
    return true
  }
  const route = routeDietScene(combined)
  return route.confidence >= 0.5
}

export function buildSkillVenueCards(venues: QingluVenueRecord[]): DetailSheetData[] {
  return venues.map((venue) => {
    const kind = venueKind(venue)
    const tag =
      venue.type === 'takeout'
        ? '外卖推荐'
        : venue.type === 'gym'
          ? '附近健身房'
          : venue.type === 'recovery'
            ? '恢复服务'
            : venue.type === 'activity'
              ? '一起动'
              : '餐饮推荐'

    const tags: string[] = []
    if (venue.cuisine) tags.push(venue.cuisine)
    if (venue.dietScore != null && venue.dietScore >= 4) tags.push('减脂友好')
    if (venue.rating != null) tags.push(`${venue.rating} 分`)

    return {
      kind,
      tag,
      title: venue.name,
      subtitle: venue.area || venue.address,
      tags: tags.slice(0, 3),
      stats: [
        ...(venue.avgPrice != null ? [{ label: '人均', value: `约 ¥${venue.avgPrice}` }] : []),
        ...(venue.dietScore != null
          ? [{ label: '减脂友好', value: `${venue.dietScore}/5` }]
          : []),
      ],
      location: venue.address || venue.area,
      imageSrc: venueImageSrc(venue),
      _venueId: venue.id,
      imageGradient: 'linear-gradient(135deg, #d1fae5 0%, #99f6e4 100%)',
      iconType: kind === 'gym' ? 'gym' : 'food',
      rating: venue.rating != null ? String(venue.rating) : undefined,
      lat: venue.lat,
      lon: venue.lon,
      listingUrl: venue.listingUrl,
      city: venue.area?.split('·')[0],
      _geocodeQuery:
        venue.lat != null && venue.lon != null
          ? undefined
          : `${venue.name} ${venue.area || venue.address}`.trim(),
    } as DetailSheetData & { _geocodeQuery?: string }
  })
}

interface GeocodeHit {
  lat: number
  lon: number
}

function readGeoCache(): Record<string, GeocodeHit> {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) ?? '{}') as Record<string, GeocodeHit>
  } catch {
    return {}
  }
}

function writeGeoCache(cache: Record<string, GeocodeHit>) {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache))
}

export async function geocodeVenueQuery(
  query: string,
  near?: UserLocation | null,
): Promise<GeocodeHit | null> {
  const scopedQuery = near
    ? `${query.trim()} ${near.city} ${near.region}`.trim()
    : query.trim()
  const key = scopedQuery
  if (!key) return null

  const cache = readGeoCache()
  if (cache[key]) return cache[key]

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'cn')
    url.searchParams.set('q', scopedQuery)
    if (near) {
      url.searchParams.set('viewbox', `${near.lon - 0.5},${near.lat + 0.5},${near.lon + 0.5},${near.lat - 0.5}`)
      url.searchParams.set('bounded', '1')
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'zh-CN',
        'User-Agent': 'QingLu/1.0 (venue card geocode)',
      },
    })
    if (!response.ok) return null

    const rows = (await response.json()) as Array<{ lat: string; lon: string }>
    const row = rows[0]
    if (!row) return null

    const hit = { lat: Number(row.lat), lon: Number(row.lon) }
    if (!Number.isFinite(hit.lat) || !Number.isFinite(hit.lon)) return null

    cache[key] = hit
    writeGeoCache(cache)
    return hit
  } catch {
    return null
  }
}

export async function enrichCardsWithGeocode(
  cards: DetailSheetData[],
  near?: UserLocation | null,
): Promise<DetailSheetData[]> {
  const out: DetailSheetData[] = []

  for (const card of cards) {
    const query = (card as DetailSheetData & { _geocodeQuery?: string })._geocodeQuery
    if (!query || (card.lat != null && card.lon != null)) {
      const { _geocodeQuery: _, ...rest } = card as DetailSheetData & { _geocodeQuery?: string }
      out.push(rest)
      continue
    }

    const geo = await geocodeVenueQuery(query, near)
    const { _geocodeQuery: _, ...rest } = card as DetailSheetData & { _geocodeQuery?: string }
    out.push(
      geo
        ? { ...rest, lat: geo.lat, lon: geo.lon }
        : rest,
    )
  }

  return out
}

export function resolveSkillVenueCards(
  userText: string,
  assistantText: string,
  citeNearby: boolean,
  location?: UserLocation | null,
): DetailSheetData[] {
  if (!shouldAttachVenueCards(userText, assistantText, citeNearby)) return []

  const combined = `${userText}\n${assistantText}`
  const fromAssistant = matchVenuesInText(assistantText, 3, location)
  const venues =
    fromAssistant.length > 0 ? fromAssistant : matchVenuesInText(combined, 3, location)

  if (venues.length === 0) return []

  return buildSkillVenueCards(venues)
}
