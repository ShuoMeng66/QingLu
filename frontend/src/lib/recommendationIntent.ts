import type { NearbyPlace } from './nearbyRecommendations'
import { placeToRichCardData } from './nearbyRecommendations'
import type { UserLocation } from './userLocation'
import type { DetailSheetData } from '../components/burnpal/DetailBottomSheet'

const FOOD_PATTERN =
  /吃什么|去哪吃|饮食|餐厅|轻食|外卖|聚餐|附近.*吃|推荐.*吃|午餐|晚餐|早餐|卡路里.*吃/i
const GYM_PATTERN =
  /健身房|去哪练|力量训练|附近.*练|推荐.*健身房|团课|器械|运动场所/i
const RECOVERY_PATTERN =
  /恢复一下|恢复|拉伸|放松|公园|散步|练完|酸痛|泡沫轴/i

export function isFoodIntent(text: string): boolean {
  return FOOD_PATTERN.test(text.trim())
}

export function isGymIntent(text: string): boolean {
  return GYM_PATTERN.test(text.trim())
}

export function isRecoveryIntent(text: string): boolean {
  return RECOVERY_PATTERN.test(text.trim())
}

export function getConversationRecommendationCards(
  userText: string,
  location: UserLocation | null,
  food: NearbyPlace | null,
  gym: NearbyPlace | null,
  recovery: NearbyPlace | null,
  options?: { citeNearby?: boolean },
): DetailSheetData[] {
  if (!location || options?.citeNearby === false) return []

  const cards: DetailSheetData[] = []
  if (isFoodIntent(userText) && food) {
    cards.push(placeToRichCardData(food))
  }
  if (isGymIntent(userText) && gym) {
    cards.push(placeToRichCardData(gym))
  }
  if (isRecoveryIntent(userText) && recovery) {
    cards.push(placeToRichCardData(recovery))
  }
  return cards
}
