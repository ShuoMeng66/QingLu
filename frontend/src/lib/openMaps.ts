/** 打开外部地图导航（优先开源 OSM 路线，移动端用 geo: 唤起系统地图） */

export interface NavigationOrigin {
  lat: number
  lon: number
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
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

/** 高德 Web URI（国内常用，非开源） */
function amapUrl(lat: number, lon: number, label?: string): string {
  const name = encodeURIComponent(label?.trim() || '目的地')
  return `https://uri.amap.com/marker?position=${lon},${lat}&name=${name}&coordinate=gaode&callnative=1`
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

/** 国内优先高德唤起原生地图，海外沿用 geo / OSM */
export function openSmartNavigation(
  lat: number,
  lon: number,
  label?: string,
  origin?: NavigationOrigin,
  regionMeta?: { country?: string; region?: string },
) {
  if (isChinaRegion(regionMeta)) {
    openNavigationWithProvider(lat, lon, label, 'amap', origin)
    return
  }
  openExternalNavigation(lat, lon, label, origin)
}

export function openExternalNavigation(
  lat: number,
  lon: number,
  label?: string,
  origin?: NavigationOrigin,
) {
  const mobile = isMobileDevice()

  // 移动端优先 geo:，会弹出系统地图选择器并支持真导航
  if (mobile) {
    openUrl(geoUrl(lat, lon, label))
    return
  }

  // 桌面端：OSM 开源路线（有起点则规划步行路线，否则仅标记）
  if (origin) {
    openUrl(osmDirectionsUrl(lat, lon, origin))
    return
  }

  openUrl(osmMarkerUrl(lat, lon))
}

/** 备用入口：显式选择地图（设置页或长按可用） */
export function openNavigationWithProvider(
  lat: number,
  lon: number,
  label?: string,
  provider: 'osm' | 'amap' | 'geo' = 'osm',
  origin?: NavigationOrigin,
) {
  const urls: Record<typeof provider, string> = {
    osm: origin ? osmDirectionsUrl(lat, lon, origin) : osmMarkerUrl(lat, lon),
    amap: amapUrl(lat, lon, label),
    geo: geoUrl(lat, lon, label),
  }
  openUrl(urls[provider])
}
