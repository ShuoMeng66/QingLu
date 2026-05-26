import { formatLocationLabel } from './citySkyline'
import { getTodayConsumedKcal } from './mealLog'
import { getCachedUserLocation } from './userLocation'
import { getRemainingKcal, loadUserProfile } from './userProfile'

/** App 已知的用户位置与热量实况，注入 system prompt，避免 AI 重复索要 */
export function buildUserContextPrompt(): string {
  const location = getCachedUserLocation()
  const profile = loadUserProfile()
  const consumed = getTodayConsumedKcal()
  const budget = profile.daily_targets?.kcal
  const remaining =
    budget != null && budget > 0 ? getRemainingKcal(profile, consumed) : null
  const mealCount = consumed > 0 ? '已有记录' : '暂无记录（可能未填写）'

  const lines: string[] = ['【用户实况 · App 已采集，界面顶部已展示】']

  if (location) {
    const label = formatLocationLabel(location.city, location.region)
    lines.push(
      `配送/生活圈：${label}（${location.country}，约 ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}，来源 ${location.source === 'gps' ? 'GPS' : 'IP'}）`,
    )
  } else if (profile.location_city?.trim()) {
    lines.push(`常用城市（资料）：${profile.location_city.trim()}`)
  }

  if (budget != null && budget > 0) {
    lines.push(
      `今日热量：已摄入约 ${consumed} kcal（${mealCount}）；每日目标 ${budget} kcal；剩余额度约 ${remaining} kcal`,
    )
  } else {
    lines.push(`今日已记录摄入约 ${consumed} kcal（${mealCount}）；每日目标未设置`)
  }

  if (profile.goal) {
    const goalLabel =
      profile.goal === 'fat_loss'
        ? '减脂'
        : profile.goal === 'muscle_gain'
          ? '增肌'
          : '维持'
    lines.push(`健身目标：${goalLabel}`)
  }

  const avoid = profile.preferences?.avoid?.filter(Boolean) ?? []
  if (avoid.length) lines.push(`饮食忌口：${avoid.join('、')}`)

  const hasLocation = Boolean(location || profile.location_city?.trim())
  const rules: string[] = []
  if (hasLocation) {
    rules.push(
      '禁止再次询问用户住在哪个区/城市或配送地址；推荐到店选项时写出店名，并提示用户点对话下方卡片的「一键导航」（Google 地图步行）',
    )
  }
  if (budget != null && budget > 0) {
    rules.push('禁止让用户重复报「今天吃了多少」；按剩余额度给套餐，若记录为空可注明「按剩余额度估算」并给 2–3 套具体组合')
  } else if (consumed === 0) {
    rules.push('若需热量区间，可一句带过请用户补充今日已吃或完善资料，不要长篇追问')
  }

  if (rules.length) {
    lines.push('行为约束：' + rules.join('；'))
  }

  return lines.join('\n')
}
