import { formatLocationLabel } from './citySkyline'
import { formatPreferencesForPrompt } from './healthProfileOptions'
import { getTodayConsumedKcal } from './mealLog'
import { getCachedUserLocation } from './userLocation'
import { getProfileTier, getRemainingKcal, loadUserProfile } from './userProfile'
import { isUserInSkillDemoCities } from './venueRegion'

/** App 已知的用户位置与热量实况，注入 system prompt，避免 AI 重复索要 */
export function buildUserContextPrompt(): string {
  const location = getCachedUserLocation()
  const profile = loadUserProfile()
  const consumed = getTodayConsumedKcal()
  const budget = profile.daily_targets?.kcal
  const remaining =
    budget != null && budget > 0 ? getRemainingKcal(profile, consumed) : null
  const mealCount = consumed > 0 ? '已有记录' : '暂无记录（可能未填写）'

  const nickname = profile.nickname?.trim() || '用户'
  const lines: string[] = [
    '【用户实况 · App 已采集，界面顶部已展示】',
    `当前登录用户昵称：${nickname}（回复中称呼此人，勿使用 Skill 演示档案 user-profiles.json 中的小明/小红/王总）`,
  ]

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

  const tier = getProfileTier(profile)
  lines.push(`档案模式：${tier === 'advanced' ? '老手（专业项）' : '新手（精简项）'}`)

  if (profile.goal) {
    const goalLabel =
      profile.goal === 'fat_loss'
        ? '减脂'
        : profile.goal === 'muscle_gain'
          ? '增肌'
          : '维持'
    lines.push(`健身目标：${goalLabel}`)
  }

  if (tier === 'beginner') {
    const bs = profile.beginner_summary
    const parts: string[] = []
    if (bs?.weekly_sessions) {
      const freq =
        bs.weekly_sessions === '2_3'
          ? '每周约 2–3 次'
          : bs.weekly_sessions === '4_5'
            ? '每周约 4–5 次'
            : '每周 6 次以上'
      parts.push(freq)
    }
    if (bs?.workout_style) parts.push(`运动方式 ${bs.workout_style}`)
    if (bs?.eating_out) parts.push(`外食 ${bs.eating_out}`)
    if (parts.length) lines.push(`新手习惯：${parts.join('；')}`)
  }

  if (profile.body_fat_pct != null) {
    lines.push(`体脂约 ${profile.body_fat_pct}%`)
  }
  if (profile.target_weight_kg != null) {
    lines.push(`目标体重 ${profile.target_weight_kg} kg`)
  }

  const tp = profile.training_profile
  if (tier === 'advanced' && (tp?.experience || tp?.split || tp?.focus)) {
    const parts: string[] = []
    if (tp.experience) parts.push(`训练经验 ${tp.experience}`)
    if (tp.split) parts.push(`分化 ${tp.split}`)
    if (tp.focus) parts.push(`侧重 ${tp.focus}`)
    if (tp.frequency_per_week) parts.push(`每周 ${tp.frequency_per_week} 次`)
    if (tp.session_minutes) parts.push(`单次约 ${tp.session_minutes} 分钟`)
    if (tp.equipment) parts.push(`场地 ${tp.equipment}`)
    if (tp.training_years != null) parts.push(`系统训练 ${tp.training_years} 年`)
    if (tp.block_phase) parts.push(`周期 ${tp.block_phase}`)
    if (tp.cardio_style && tp.cardio_style !== 'none') parts.push(`有氧 ${tp.cardio_style}`)
    if (tp.rpe_preference) parts.push(`RPE ${tp.rpe_preference}`)
    if (tp.refeed_days_per_week != null && tp.refeed_days_per_week > 0) {
      parts.push(`每周补给日 ${tp.refeed_days_per_week}`)
    }
    if (tp.weekly_steps_target) parts.push(`步数目标 ${tp.weekly_steps_target}`)
    if (tp.periodization_notes?.trim()) parts.push(`周期备注 ${tp.periodization_notes.trim()}`)
    if (tp.focus_muscle_groups?.length) parts.push(`重点肌群 ${tp.focus_muscle_groups.join('、')}`)
    if (tp.limitations?.length) parts.push(`限制部位 ${tp.limitations.join('、')}`)
    lines.push(`训练配置：${parts.join('；')}`)
  }

  const na = profile.nutrition_advanced
  if (
    tier === 'advanced' &&
    (na?.protein_g_per_kg || na?.carb_strategy || na?.kcal_override || na?.meal_timing)
  ) {
    const parts: string[] = []
    if (na.protein_g_per_kg) parts.push(`蛋白 ${na.protein_g_per_kg} g/kg`)
    if (na.carb_strategy) parts.push(`碳水策略 ${na.carb_strategy}`)
    if (na.meal_timing) parts.push(`进食节奏 ${na.meal_timing}`)
    if (na.kcal_override) parts.push(`自定义热量 ${na.kcal_override} kcal`)
    lines.push(`营养策略：${parts.join('；')}`)
  }

  const rec = profile.recovery
  if (tier === 'advanced' && (rec?.sleep_hours || rec?.stress_level)) {
    const parts: string[] = []
    if (rec.sleep_hours) parts.push(`睡眠约 ${rec.sleep_hours} h`)
    if (rec.stress_level) parts.push(`压力 ${rec.stress_level}`)
    lines.push(`恢复：${parts.join('；')}`)
  }

  const hp = formatPreferencesForPrompt(profile)
  const avoidParts = [
    hp.food_restrictions !== '无' ? hp.food_restrictions : '',
    hp.dietary_customs !== '无' ? hp.dietary_customs : '',
    ...(profile.preferences?.avoid?.filter(Boolean) ?? []),
  ].filter(Boolean)
  if (avoidParts.length) lines.push(`饮食忌口：${avoidParts.join('、')}`)
  if (hp.takeout_budget !== '—') lines.push(`外卖预算：${hp.takeout_budget}`)
  if (hp.dining_budget !== '—') lines.push(`聚餐预算：${hp.dining_budget}`)
  if (hp.common_areas !== '—') lines.push(`常用区域：${hp.common_areas}`)

  const hasLocation = Boolean(location || profile.location_city?.trim())
  const rules: string[] = []
  if (hasLocation) {
    rules.push(
      '禁止再次询问用户住在哪个区/城市或配送地址；推荐到店选项时写出店名，并提示用户点对话下方卡片的「一键导航」（Google 地图步行）',
    )
    if (location && !isUserInSkillDemoCities(location)) {
      rules.push(
        '内置演示店铺 JSON 仅含北京/上海示例门店，不包含用户当前城市：禁止推荐北京/上海具体分店（如陆家嘴、中关村某店）当作「附近」；可给连锁品牌点单原则或菜系建议，并说明附近具体门店以地图/外卖为准',
      )
    } else if (location) {
      rules.push(
        '推荐到店时只能引用与用户同城（北京或上海，且与用户区划一致）的 Skill JSON 店名；勿跨城推荐另一座城市的分店',
      )
    }
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
