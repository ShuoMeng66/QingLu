import type { AppLocale } from './i18n/localeIds'
import { getGoalOptions } from './i18n/chatCopy'
import { getTodayConsumedKcal } from './mealLog'
import { replaceTodaySnapshot } from './todaySnapshot'
import { getActiveDemoProfileId, getDemoProfileById } from './demoProfiles'
import {
  finalizeUserProfile,
  getRemainingKcal,
  isProfileComplete,
  loadUserProfile,
  type UserProfile,
} from './userProfile'

import {
  formatPreferencesForPrompt,
  getCommonAreaOptions,
  getDietaryCustomOptions,
  getDietStrategyOptions,
  getFoodRestrictionOptions,
  getTastePreferenceOptions,
} from './healthProfileOptions'
import { labelsFromStored, resolveTrainingSessionLabel } from './preferenceLabels'

const GOAL_LABEL_ZH: Record<string, string> = {
  fat_loss: '减脂',
  muscle_gain: '增肌',
  maintain: '维持',
  healthy_living: '健康生活',
}

function resolveLocationLabel(profile: UserProfile): string {
  const commonArea = profile.preferences?.common_areas?.[0]?.trim()
  if (commonArea === 'near_company') return '国贸'
  if (commonArea) return commonArea
  return profile.location_city?.trim() || '—'
}

export function syncTodayFromProfile(profile: UserProfile): void {
  const demoId = getActiveDemoProfileId()
  const demo = demoId ? getDemoProfileById(demoId) : undefined
  const consumed = getTodayConsumedKcal()
  const remaining =
    demo?.today.remaining_kcal ?? getRemainingKcal(profile, consumed)
  const trainingPlan =
    demo?.today.training_plan ??
    profile.training?.next_session ??
    profile.training?.typical_session ??
    '今日训练'
  const locationLabel = demo
    ? areaFromLocation(demo.location.current)
    : resolveLocationLabel(profile)

  replaceTodaySnapshot({
    remaining_kcal: remaining,
    training_plan: trainingPlan,
    location_label: locationLabel,
    body_status: '正常',
    special_note: '',
  })
}

function areaFromLocation(current: string): string {
  const parts = current.split('·')
  return parts.length > 1 ? parts[parts.length - 1]!.trim() : current.trim()
}

export interface ProfileReadyTagGroups {
  goalLabel: string
  dietTags: string[]
  avoidTags: string[]
  regionTags: string[]
}

export function getProfileReadyTagGroups(
  profile: UserProfile,
  locale: AppLocale = 'zh',
): ProfileReadyTagGroups {
  const summary = getProfileReadySummary(profile, locale)
  const prefs = profile.preferences

  const dietTags = [
    ...new Set([
      ...labelsFromStored(prefs?.diet_strategies, getDietStrategyOptions(locale), locale),
      ...labelsFromStored(prefs?.taste_preferences, getTastePreferenceOptions(locale), locale),
      ...(prefs?.favorite_cuisines ?? []),
    ]),
  ].filter(Boolean)

  const avoidTags = [
    ...labelsFromStored(prefs?.food_restrictions, getFoodRestrictionOptions(locale), locale),
    ...labelsFromStored(prefs?.dietary_customs, getDietaryCustomOptions(locale), locale),
  ].filter((tag) => tag && tag !== '无' && tag !== '无忌口' && tag !== '无特殊忌口')

  const regionTags = labelsFromStored(prefs?.common_areas, getCommonAreaOptions(locale), locale)
  if (!regionTags.length && profile.location_city?.trim()) {
    regionTags.push(profile.location_city.trim())
  }

  // #region agent log
  fetch('http://127.0.0.1:7530/ingest/077fc56f-9998-421e-953f-c0c89307702f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9a6481'},body:JSON.stringify({sessionId:'9a6481',hypothesisId:'H2',location:'profileReady.ts:getProfileReadyTagGroups',message:'resolved tags',data:{nickname:profile.nickname,dietStrategiesRaw:prefs?.diet_strategies,dietTags,avoidTags,regionTags},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return {
    goalLabel: summary.goalLabel,
    dietTags: dietTags.length ? dietTags : summary.dietStrategy.split(/[；;]/).filter(Boolean),
    avoidTags: avoidTags.length ? avoidTags : [summary.avoid],
    regionTags: regionTags.length ? regionTags : [summary.region],
  }
}

export function getProfileReadySummary(profile: UserProfile, locale: AppLocale = 'zh') {
  const goalLabel =
    GOAL_LABEL_ZH[profile.goal ?? ''] ??
    getGoalOptions(locale).find((o) => o.id === profile.goal)?.label ??
    '—'
  const hp = formatPreferencesForPrompt(profile)
  const avoid = [hp.food_restrictions, hp.dietary_customs]
    .filter((p) => p && p !== '无')
    .join('、') || '无特殊忌口'
  const cuisines = profile.preferences?.favorite_cuisines?.filter(Boolean).join('、')
  const dietStrategy = [hp.diet_strategy, cuisines ? `菜系 ${cuisines}` : '']
    .filter(Boolean)
    .join('；') || '均衡饮食、少油控糖'
  const region =
    hp.common_areas !== '—' ? hp.common_areas : profile.location_city?.trim() || '未填写'
  return { goalLabel, dietStrategy, avoid, region }
}

export function getReadyPrioritiesFromProfile(profile: UserProfile): string[] {
  const remaining = getRemainingKcal(profile, getTodayConsumedKcal())
  const train = resolveTrainingSessionLabel(
    profile.training?.next_session && profile.training.next_session !== '—'
      ? profile.training.next_session
      : profile.training?.typical_session,
  )
  return [
    `按今日剩余约 ${remaining} kcal 推荐午餐/外卖`,
    `结合「${train}」推荐附近场地或课程`,
    '训练后安排拉伸或恢复服务',
    '周末看看轻量运动社交活动',
  ]
}

export function completeOnboardingProfile(draft: UserProfile): UserProfile | null {
  if (!draft.height_cm || !draft.weight_kg || !draft.goal) return null
  const next = finalizeUserProfile(draft)
  if (!isProfileComplete(next)) return null
  syncTodayFromProfile(next)
  try {
    sessionStorage.removeItem('qinglu.demoProfileId')
  } catch {
    /* ignore */
  }
  return next
}

export function loadReadyProfile(): UserProfile | null {
  const profile = loadUserProfile()
  return isProfileComplete(profile) ? profile : null
}
