import type { QingluVenueRecord } from '../data/qingluVenues.generated'
import type { UserLocation } from './userLocation'

/** Skill 演示数据主要覆盖的城市（用于「仅城区名」的 area 字段） */
const BEIJING_DISTRICT_PATTERN =
  /^(朝阳|海淀|丰台|西城|东城|通州|昌平|顺义|大兴|房山|石景山)区?$/

const MUNICIPALITY_KEYS = ['北京', '上海', '天津', '重庆'] as const

/** 有坐标时，Skill 卡片与用户最大直线距离（km） */
export const SKILL_VENUE_MAX_DISTANCE_KM = 80

function normalizeGeoToken(value: string): string {
  return value
    .replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔|地区/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
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

/** 从门店 area / address 提取省级或直辖市关键词 */
export function extractVenueRegionKeys(venue: QingluVenueRecord): string[] {
  const keys = new Set<string>()
  const area = (venue.area ?? '').trim()
  const address = (venue.address ?? '').trim()

  if (area) {
    const head = area.split(/[·・]/)[0]?.trim()
    if (head) {
      const norm = normalizeGeoToken(head)
      if (norm) keys.add(norm)
    }
    if (BEIJING_DISTRICT_PATTERN.test(area)) {
      keys.add('北京')
    }
  }

  const provinceMatch = address.match(/^(.{2,6}?)(?:省|市|自治区)/)
  if (provinceMatch?.[1]) {
    const norm = normalizeGeoToken(provinceMatch[1])
    if (norm) keys.add(norm)
  }

  for (const m of MUNICIPALITY_KEYS) {
    if (address.includes(m) || area.includes(m)) keys.add(normalizeGeoToken(m))
  }

  return [...keys]
}

/** 从用户定位提取可比对的地域关键词 */
export function extractUserRegionKeys(location: UserLocation): string[] {
  const keys = new Set<string>()
  const city = normalizeGeoToken(location.city)
  const region = normalizeGeoToken(location.region)

  if (city) keys.add(city)
  if (region) keys.add(region)

  // ipapi 可能返回英文 Hunan / Changsha
  const hunanAliases: Record<string, string[]> = {
    hunan: ['湖南', 'hunan'],
    changsha: ['长沙', 'changsha'],
    yuelu: ['岳麓', '长沙', 'changsha'],
    guangdong: ['广东', 'guangdong'],
    guangzhou: ['广州', 'guangzhou'],
    beijing: ['北京', 'beijing'],
    shanghai: ['上海', 'shanghai'],
    haidian: ['海淀', '北京', 'beijing'],
  }

  for (const token of [...keys]) {
    const extra = hunanAliases[token]
    if (extra) extra.forEach((k) => keys.add(normalizeGeoToken(k)))
  }

  if (/岳麓/.test(location.city) || /岳麓/.test(location.region)) {
    keys.add('长沙')
    keys.add('湖南')
  }

  return [...keys]
}

function regionKeysOverlap(venueKeys: string[], userKeys: string[]): boolean {
  if (venueKeys.length === 0 || userKeys.length === 0) return false
  for (const vk of venueKeys) {
    for (const uk of userKeys) {
      if (vk === uk || vk.includes(uk) || uk.includes(vk)) return true
    }
  }
  return false
}

/** 演示 Skill 库是否覆盖用户所在城市（仅北京/上海有完整 POI） */
export function isUserInSkillDemoCities(location: UserLocation): boolean {
  const userKeys = extractUserRegionKeys(location)
  return userKeys.some((k) => k === '北京' || k === '上海' || k === 'beijing' || k === 'shanghai')
}

/**
 * 判断 Skill 库中的门店是否属于用户生活圈。
 * 无定位时不做过滤；有坐标时优先用距离；否则用省/市文本匹配。
 */
export function isVenueInUserArea(
  venue: QingluVenueRecord,
  location: UserLocation | null | undefined,
): boolean {
  if (!location) return true

  if (venue.lat != null && venue.lon != null) {
    const km = haversineKm(location.lat, location.lon, venue.lat, venue.lon)
    return km <= SKILL_VENUE_MAX_DISTANCE_KM
  }

  const venueKeys = extractVenueRegionKeys(venue)
  const userKeys = extractUserRegionKeys(location)
  return regionKeysOverlap(venueKeys, userKeys)
}

export function filterVenuesForUser(
  venues: QingluVenueRecord[],
  location: UserLocation | null | undefined,
): QingluVenueRecord[] {
  if (!location) return venues
  return venues.filter((v) => isVenueInUserArea(v, location))
}
