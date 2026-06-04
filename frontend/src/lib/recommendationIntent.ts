import type { NearbyPlace } from './nearbyRecommendations'
import { placeToRichCardData } from './nearbyRecommendations'
import type { UserLocation } from './userLocation'
import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import { routeDietScene } from './evalAgent'
import { resolveSkillVenueCards } from './skillVenueMatch'

const FOOD_PATTERN =
  /吃什么|去哪吃|饮食|餐厅|轻食|外卖|聚餐|附近.*吃|推荐.*吃|午餐|晚餐|早餐|夜宵|卡路里.*吃|吃啥|觅食|点餐|店铺|店家|导航|地址|晚饭|午饭|下班.*吃|饿了|餐/i
const GYM_PATTERN =
  /健身房|去哪练|力量训练|附近.*练|推荐.*健身房|团课|器械|运动场所|去练|撸铁/i
const RECOVERY_PATTERN =
  /恢复一下|恢复|拉伸|放松|公园|散步|练完|酸痛|泡沫轴/i

const FOOD_SCENES = new Set([
  'A1_gathering_poi',
  'A2_in_store_order',
  'B_takeout',
  'C_travel_explore',
])

const VENUE_HINT_PATTERN =
  /推荐|附近|步行|距离|公里|导航|地图|餐厅|轻食|健身|沙拉|外卖|店名|人均|地址|去哪/i

export function isFoodIntent(text: string): boolean {
  return shouldShowNearbyFood(text)
}

export function isGymIntent(text: string): boolean {
  return shouldShowNearbyGym(text)
}

export function isRecoveryIntent(text: string): boolean {
  return RECOVERY_PATTERN.test(text.trim())
}

export function shouldShowNearbyFood(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (FOOD_PATTERN.test(trimmed)) return true
  const route = routeDietScene(trimmed)
  if (FOOD_SCENES.has(route.sceneId) && route.confidence >= 0.5) return true
  return false
}

export function shouldShowNearbyGym(text: string): boolean {
  return GYM_PATTERN.test(text.trim())
}

function mentionsNearbyVenue(text: string): boolean {
  return VENUE_HINT_PATTERN.test(text.trim())
}

/** Prefer Skill/mock venues mentioned in the assistant reply; avoid unrelated OSM POIs. */
export function getConversationRecommendationCards(
  userText: string,
  location: UserLocation | null,
  foodPlaces: NearbyPlace[],
  gym: NearbyPlace | null,
  recovery: NearbyPlace | null,
  options?: { citeNearby?: boolean; assistantText?: string },
): DetailSheetData[] {
  if (options?.citeNearby === false) return []

  const assistantText = options?.assistantText ?? ''
  const skillCards = resolveSkillVenueCards(userText, assistantText, true, location)
  if (skillCards.length > 0) return skillCards

  if (!location) return []

  const combined = `${userText}\n${assistantText}`.trim()
  const venueHint = mentionsNearbyVenue(combined)
  const showFood = (shouldShowNearbyFood(combined) || venueHint) && foodPlaces.length > 0
  const showGym =
    (shouldShowNearbyGym(combined) || (venueHint && /健身|力量|器械|团课/i.test(combined))) &&
    Boolean(gym)

  const cards: DetailSheetData[] = []

  if (showFood) {
    for (const place of foodPlaces.slice(0, 3)) {
      cards.push(placeToRichCardData(place, location))
    }
  }
  if (showGym && gym) {
    cards.push(placeToRichCardData(gym, location))
  }
  if (isRecoveryIntent(combined) && recovery) {
    cards.push(placeToRichCardData(recovery, location))
  }

  return cards
}
