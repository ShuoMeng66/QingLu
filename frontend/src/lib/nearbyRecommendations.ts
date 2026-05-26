import {
  distanceMeters,
  formatDistance,
  formatWalkMinutes,
  type UserLocation,
} from './userLocation'

export type NearbyPlaceKind = 'food' | 'gym' | 'recovery'

export interface NearbyPlace {
  id: string
  kind: NearbyPlaceKind
  name: string
  address: string
  lat: number
  lon: number
  distanceM: number
  tags: string[]
}

const FOOD_AMENITIES = 'restaurant|cafe|fast_food'
const RECOMMENDATIONS_CACHE_KEY = 'burnpal.nearby-recommendations-v1'
const CACHE_TTL_MS = 30 * 60 * 1000

interface CachedRecommendations {
  locationKey: string
  places: NearbyPlace[]
  fetchedAt: number
}

function locationKey(location: UserLocation): string {
  return `${location.lat.toFixed(3)},${location.lon.toFixed(3)}`
}

function readCache(location: UserLocation): NearbyPlace[] | null {
  try {
    const raw = localStorage.getItem(RECOMMENDATIONS_CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CachedRecommendations
    if (data.locationKey !== locationKey(location)) return null
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null
    return data.places
  } catch {
    return null
  }
}

function writeCache(location: UserLocation, places: NearbyPlace[]) {
  const payload: CachedRecommendations = {
    locationKey: locationKey(location),
    places,
    fetchedAt: Date.now(),
  }
  localStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(payload))
}

async function queryOverpass(query: string): Promise<Array<{ lat: number; lon: number; tags: Record<string, string> }>> {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!response.ok) throw new Error('overpass failed')

  const data = (await response.json()) as {
    elements?: Array<{
      type: string
      id: number
      lat?: number
      lon?: number
      center?: { lat: number; lon: number }
      tags?: Record<string, string>
    }>
  }

  const elements: Array<{ lat: number; lon: number; tags: Record<string, string> }> = []

  for (const element of data.elements ?? []) {
    const lat = element.lat ?? element.center?.lat
    const lon = element.lon ?? element.center?.lon
    if (lat == null || lon == null) continue
    elements.push({
      lat,
      lon,
      tags: { ...(element.tags ?? {}), _osm_id: String(element.id) },
    })
  }

  return elements
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:city'] ?? tags['addr:suburb'] ?? tags['addr:district'],
    tags['addr:street'],
    tags['addr:housenumber'],
  ].filter(Boolean)
  if (parts.length > 0) return parts.join('')
  return tags['addr:full'] ?? tags['addr:place'] ?? '地址见地图'
}

function mapElements(
  elements: Array<{ lat: number; lon: number; tags: Record<string, string> }>,
  kind: NearbyPlaceKind,
  location: UserLocation,
): NearbyPlace[] {
  const seen = new Set<string>()

  return elements
    .map((element) => {
      const name = element.tags.name ?? element.tags.brand
      if (!name) return null

      const key = name.trim().toLowerCase()
      if (seen.has(key)) return null
      seen.add(key)

      const distanceM = distanceMeters(location, { lat: element.lat, lon: element.lon })
      const tags: string[] = []

      if (kind === 'food') {
        if (element.tags.cuisine) tags.push(element.tags.cuisine)
        if (element.tags.diet?.includes('vegetarian')) tags.push('素食友好')
        if (element.tags.amenity === 'cafe') tags.push('咖啡轻食')
        if (tags.length === 0) tags.push('附近餐饮')
      } else if (kind === 'recovery') {
        if (element.tags.leisure === 'park') tags.push('城市公园')
        if (element.tags.leisure === 'garden') tags.push('花园')
        if (tags.length === 0) tags.push('户外恢复')
      } else {
        if (element.tags.opening_hours?.includes('24/7')) tags.push('24 小时')
        if (element.tags.sport) tags.push(element.tags.sport)
        if (tags.length === 0) tags.push('健身')
      }

      return {
        id: `${kind}-${element.tags._osm_id ?? name}`,
        kind,
        name,
        address: buildAddress(element.tags),
        lat: element.lat,
        lon: element.lon,
        distanceM,
        tags: tags.slice(0, 3),
      }
    })
    .filter((place): place is NearbyPlace => place != null)
    .sort((a, b) => a.distanceM - b.distanceM)
}

export async function fetchNearbyRecommendations(location: UserLocation): Promise<NearbyPlace[]> {
  const cached = readCache(location)
  if (cached) return cached

  const { lat, lon } = location
  const foodQuery = `
    [out:json][timeout:20];
    (
      node["amenity"~"${FOOD_AMENITIES}"](around:2500,${lat},${lon});
      way["amenity"~"${FOOD_AMENITIES}"](around:2500,${lat},${lon});
    );
    out center 12;
  `
  const gymQuery = `
    [out:json][timeout:20];
    (
      node["leisure"="fitness_centre"](around:3000,${lat},${lon});
      way["leisure"="fitness_centre"](around:3000,${lat},${lon});
      node["sport"="fitness"](around:3000,${lat},${lon});
    );
    out center 12;
  `
  const recoveryQuery = `
    [out:json][timeout:20];
    (
      node["leisure"~"park|garden"](around:2500,${lat},${lon});
      way["leisure"~"park|garden"](around:2500,${lat},${lon});
    );
    out center 8;
  `

  const [foodElements, gymElements, recoveryElements] = await Promise.all([
    queryOverpass(foodQuery).catch(() => []),
    queryOverpass(gymQuery).catch(() => []),
    queryOverpass(recoveryQuery).catch(() => []),
  ])

  const food = mapElements(foodElements, 'food', location).slice(0, 1)
  const gym = mapElements(gymElements, 'gym', location).slice(0, 1)
  const recovery = mapElements(recoveryElements, 'recovery', location).slice(0, 1)
  const places = [...food, ...gym, ...recovery]

  if (places.length > 0) writeCache(location, places)
  return places
}

export function placeToRichCardData(place: NearbyPlace) {
  const distance = formatDistance(place.distanceM)
  const walk = formatWalkMinutes(place.distanceM)
  const geo = { lat: place.lat, lon: place.lon, kind: place.kind }

  if (place.kind === 'food') {
    return {
      ...geo,
      tag: '轻食推荐',
      title: place.name,
      subtitle: place.tags.join(' · ') || '附近餐饮',
      tags: place.tags.length > 0 ? place.tags : ['附近', '可外食'],
      stats: [
        { label: '距离', value: distance },
        { label: '步行', value: walk },
      ],
      location: `${distance} · ${place.address}`,
      imageGradient: 'linear-gradient(135deg, #d1fae5 0%, #99f6e4 100%)',
      iconType: 'food' as const,
    }
  }

  if (place.kind === 'recovery') {
    return {
      ...geo,
      tag: '恢复场地',
      title: place.name,
      subtitle: place.tags.join(' · ') || '附近户外恢复空间',
      tags: place.tags.length > 0 ? place.tags : ['拉伸', '散步'],
      stats: [
        { label: '距离', value: distance },
        { label: '步行', value: walk },
      ],
      location: `${distance} · ${place.address}`,
      imageGradient: 'linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)',
      iconType: 'food' as const,
    }
  }

  return {
    ...geo,
    tag: '附近健身房',
    title: place.name,
    subtitle: place.tags.join(' · ') || '附近健身场所',
    tags: place.tags.length > 0 ? place.tags : ['力量训练'],
    stats: [
      { label: '距离', value: distance },
      { label: '步行', value: walk },
    ],
    location: `${distance} · ${place.address}`,
    imageGradient: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
    iconType: 'gym' as const,
  }
}
