import type { NearbyPlace } from './nearbyRecommendations'
import { placeToRichCardData } from './nearbyRecommendations'
import { routeDietScene } from './evalAgent'
import type { UserLocation } from './userLocation'
import type { DetailSheetData } from '../components/burnpal/DetailBottomSheet'

const FOOD_PATTERN =
  /吃什么|去哪吃|饮食|餐厅|轻食|外卖|聚餐|附近.*吃|推荐.*吃|午餐|晚餐|早餐|夜宵|卡路里.*吃|吃啥|觅食|点餐|店铺|店家|导航过去|晚饭|午饭|下班.*吃/i
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
  /推荐|附近|步行|距离|公里|导航|地图|餐厅|轻食|健身|沙拉|外卖|店名|人均/i

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
  if (FOOD_SCENES.has(route.sceneId) && route.confidence >= 0.55) return true
  return false
}

export function shouldShowNearbyGym(text: string): boolean {
  return GYM_PATTERN.test(text.trim())
}

function mentionsNearbyVenue(text: string): boolean {
  return VENUE_HINT_PATTERN.test(text.trim())
}

export function getConversationRecommendationCards(
  userText: string,
  location: UserLocation | null,
  food: NearbyPlace | null,
  gym: NearbyPlace | null,
  recovery: NearbyPlace | null,
  options?: { citeNearby?: boolean; assistantText?: string },
): DetailSheetData[] {
  if (!location || options?.citeNearby === false) return []

  const combined = `${userText}\n${options?.assistantText ?? ''}`.trim()
  const venueHint = mentionsNearbyVenue(combined)

  const cards: DetailSheetData[] = []
  if ((shouldShowNearbyFood(combined) || venueHint) && food) {
    cards.push(placeToRichCardData(food))
  }
  if ((shouldShowNearbyGym(combined) || (venueHint && /健身|力量|器械|团课/i.test(combined))) && gym) {
    cards.push(placeToRichCardData(gym))
  }
  if (isRecoveryIntent(combined) && recovery) {
    cards.push(placeToRichCardData(recovery))
  }
  return cards
}
