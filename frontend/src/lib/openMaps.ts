/** 打开外部地图导航（默认 Google Maps 步行路线；备用 OSM / 高德 / geo） */

export interface NavigationOrigin {
  lat: number
  lon: number
}

function openUrl(url: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** Google Maps — 步行导航（需可访问 google.com，与系统/VPN 代理一致） */
function googleMapsNavigationUrl(
  lat: number,
  lon: number,
  _label?: string,
  origin?: NavigationOrigin,
): string {
  const destination = encodeURIComponent(`${lat},${lon}`)
  if (origin) {
    const o = encodeURIComponent(`${origin.lat},${origin.lon}`)
    return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${destination}&travelmode=walking`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`
}

function googleMapsMarkerUrl(lat: number, lon: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
}

/** OSM + OSRM 步行路线（开源，无需 API Key） */
function osmDirectionsUrl(
  destLat: number,
  destLon: number,
  origin?: NavigationOrigin,
): string {
  const dest = `${destLat},${destLon}`
  const route = origin ? `${origin.lat},${origin.lon};${dest}` : `;${dest}`
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${encodeURIComponent(route)}`
}

/** OSM 标记点（无起点时 fallback） */
function osmMarkerUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
}

/** 移动端 geo: 协议，唤起系统默认地图 App */
function geoUrl(lat: number, lon: number, label?: string): string {
  const name = encodeURIComponent(label?.trim() || 'Destination')
  return `geo:${lat},${lon}?q=${lat},${lon}(${name})`
}

/** 高德 Web URI — 标记点 */
function amapMarkerUrl(lat: number, lon: number, label?: string): string {
  const name = encodeURIComponent(label?.trim() || '目的地')
  return `https://uri.amap.com/marker?position=${lon},${lat}&name=${name}&coordinate=gaode&callnative=1`
}

/** 高德 Web URI — 步行导航 */
function amapNavigationUrl(
  lat: number,
  lon: number,
  label?: string,
  origin?: NavigationOrigin,
): string {
  const dest = encodeURIComponent(label?.trim() || '目的地')
  const to = `${lon},${lat},${dest}`
  if (origin) {
    const from = `${origin.lon},${origin.lat},${encodeURIComponent('我的位置')}`
    return `https://uri.amap.com/navigation?from=${from}&to=${to}&mode=walk&callnative=1`
  }
  return `https://uri.amap.com/navigation?to=${to}&mode=walk&callnative=1`
}

export function isChinaRegion(meta?: { country?: string; region?: string } | null): boolean {
  if (!meta) return false
  const country = meta.country ?? ''
  const region = meta.region ?? ''
  return (
    /中国|china/i.test(country) ||
    /省|自治区|特别行政区/.test(region) ||
    /^(CN|CHN)$/i.test(country)
  )
}

/** 默认 Google Maps 步行导航（适合开代理访问 Google 的场景） */
export function openSmartNavigation(
  lat: number,
  lon: number,
  label?: string,
  origin?: NavigationOrigin,
  _regionMeta?: { country?: string; region?: string },
) {
  if (origin) {
    openUrl(googleMapsNavigationUrl(lat, lon, label, origin))
    return
  }
  openUrl(googleMapsMarkerUrl(lat, lon))
}

export function openExternalNavigation(
  lat: number,
  lon: number,
  label?: string,
  origin?: NavigationOrigin,
) {
  openSmartNavigation(lat, lon, label, origin)
}

/** 备用入口：显式选择地图（设置页或长按可用） */
export function openNavigationWithProvider(
  lat: number,
  lon: number,
  label?: string,
  provider: 'google' | 'osm' | 'amap' | 'geo' = 'google',
  origin?: NavigationOrigin,
) {
  const urls: Record<typeof provider, string> = {
    google: origin
      ? googleMapsNavigationUrl(lat, lon, label, origin)
      : googleMapsMarkerUrl(lat, lon),
    osm: origin ? osmDirectionsUrl(lat, lon, origin) : osmMarkerUrl(lat, lon),
    amap: origin
      ? amapNavigationUrl(lat, lon, label, origin)
      : amapMarkerUrl(lat, lon, label),
    geo: geoUrl(lat, lon, label),
  }
  openUrl(urls[provider])
}
