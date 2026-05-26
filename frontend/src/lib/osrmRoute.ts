/** OSRM 步行路线（公共 demo 服务，开源、免 Key；生产环境建议自托管） */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot'

export interface LatLon {
  lat: number
  lon: number
}

export interface OsrmRouteResult {
  distanceM: number
  durationSec: number
  /** Leaflet 折线坐标 [lat, lon][] */
  polyline: Array<[number, number]>
}

export function formatRouteDuration(seconds: number): string {
  if (seconds < 60) return '< 1 min'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export async function fetchWalkingRoute(
  origin: LatLon,
  destination: LatLon,
  signal?: AbortSignal,
): Promise<OsrmRouteResult | null> {
  const coords = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false`

  try {
    const response = await fetch(url, { signal })
    if (!response.ok) return null

    const payload = (await response.json()) as {
      code?: string
      routes?: Array<{
        distance: number
        duration: number
        geometry?: { coordinates?: Array<[number, number]> }
      }>
    }

    const route = payload.routes?.[0]
    const coordinates = route?.geometry?.coordinates
    if (!route || !coordinates?.length) return null

    return {
      distanceM: route.distance,
      durationSec: route.duration,
      polyline: coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
    }
  } catch {
    return null
  }
}
