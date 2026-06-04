/** Browser GPS + IP fallback location */

export type LocationSource = 'gps' | 'ip'

export interface UserLocation {
  city: string
  region: string
  country: string
  lat: number
  lon: number
  ip?: string
  source: LocationSource
  accuracy?: number
  fetchedAt: number
}

const CACHE_KEY = 'qinglu.user-location-v2'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function readCache(): UserLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as UserLocation
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null
    if (!data.city || !Number.isFinite(data.lat) || !Number.isFinite(data.lon)) return null
    return data
  } catch {
    return null
  }
}

function writeCache(location: UserLocation) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(location))
}

export function getCachedUserLocation(): UserLocation | null {
  return readCache()
}

export function clearCachedUserLocation() {
  localStorage.removeItem(CACHE_KEY)
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  北京: { lat: 39.9042, lon: 116.4074 },
  上海: { lat: 31.2304, lon: 121.4737 },
}

/** Demo onboarding: seed location without GPS */
export function seedCachedUserLocation(city: string, regionLabel: string) {
  const coords = CITY_COORDS[city] ?? CITY_COORDS['北京']!
  const location: UserLocation = {
    city,
    region: regionLabel,
    country: '中国',
    lat: coords.lat,
    lon: coords.lon,
    source: 'ip',
    fetchedAt: Date.now(),
  }
  writeCache(location)
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Reverse geocode lat/lon → city via Nominatim (OpenStreetMap) */
async function reverseGeocode(lat: number, lon: number): Promise<Pick<UserLocation, 'city' | 'region' | 'country'>> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('format', 'json')
    url.searchParams.set('accept-language', 'zh')

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error('reverse geocode failed')

    const data = (await response.json()) as {
      address?: {
        city?: string
        town?: string
        village?: string
        county?: string
        state?: string
        country?: string
      }
    }

    const addr = data.address ?? {}
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? '未知区域'
    const region = addr.state ?? ''
    const country = addr.country ?? ''

    return { city, region, country }
  } catch {
    return { city: '当前位置', region: '', country: '' }
  }
}

/** Browser Geolocation API (requires user permission) */
export function fetchUserLocationByGps(): Promise<UserLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const geo = await reverseGeocode(latitude, longitude)
        const location: UserLocation = {
          ...geo,
          lat: latitude,
          lon: longitude,
          source: 'gps',
          accuracy,
          fetchedAt: Date.now(),
        }
        writeCache(location)
        resolve(location)
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

/** IP-based location via ipapi.co */
export async function fetchUserLocationByIp(): Promise<UserLocation | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) throw new Error('geo failed')
    const data = (await response.json()) as {
      city?: string
      region?: string
      country_name?: string
      latitude?: number
      longitude?: number
      ip?: string
      error?: boolean
    }

    if (data.error || !data.latitude || !data.longitude) return null

    const location: UserLocation = {
      city: data.city || '未知城市',
      region: data.region || '',
      country: data.country_name || '',
      lat: data.latitude,
      lon: data.longitude,
      ip: data.ip,
      source: 'ip',
      fetchedAt: Date.now(),
    }
    writeCache(location)
    return location
  } catch {
    return null
  }
}

/**
 * Resolve user location: GPS first (with permission prompt), then IP fallback.
 * Returns null if both fail.
 */
export async function resolveUserLocation(options?: { preferFreshGps?: boolean }): Promise<UserLocation | null> {
  const cached = readCache()
  if (cached && !options?.preferFreshGps) {
    // Prefer cached GPS; refresh stale IP cache in background
    if (cached.source === 'gps') return cached
  }

  const gps = await fetchUserLocationByGps()
  if (gps) return gps

  if (cached?.source === 'gps') return cached

  const ip = await fetchUserLocationByIp()
  if (ip) return ip

  return cached
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function distanceMeters(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  return haversineKm(from.lat, from.lon, to.lat, to.lon) * 1000
}

export function formatWalkMinutes(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 80))
  return `约 ${minutes} 分钟`
}

export function locationSourceLabel(source: LocationSource): string {
  return source === 'gps' ? 'GPS 定位' : 'IP 定位'
}
