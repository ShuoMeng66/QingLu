import type { AppLocale } from './i18n/localeIds'
import { getGoalOptions } from './i18n/chatCopy'
import { getTodayConsumedKcal } from './mealLog'
import { replaceTodaySnapshot } from './todaySnapshot'
import {
  finalizeUserProfile,
  getRemainingKcal,
  isProfileComplete,
  loadUserProfile,
  type UserProfile,
} from './userProfile'

const GOAL_LABEL_ZH: Record<string, string> = {
  fat_loss: '减脂',
  muscle_gain: '增肌',
  maintain: '维持',
}

export function syncTodayFromProfile(profile: UserProfile): void {
  const consumed = getTodayConsumedKcal()
  const remaining = getRemainingKcal(profile, consumed)
  replaceTodaySnapshot({
    remaining_kcal: remaining,
    training_plan:
      profile.training?.typical_session ??
      profile.training?.next_session ??
      '今日训练',
    location_label: profile.location_city?.trim() || '—',
    body_status: '正常',
    special_note: '',
  })
}

export function getProfileReadySummary(profile: UserProfile, locale: AppLocale = 'zh') {
  const goalLabel =
    GOAL_LABEL_ZH[profile.goal ?? ''] ??
    getGoalOptions(locale).find((o) => o.id === profile.goal)?.label ??
    '—'
  const avoid = profile.preferences?.avoid?.filter(Boolean).join('、') || '无特殊忌口'
  const cuisines = profile.preferences?.favorite_cuisines?.filter(Boolean).join('、')
  const dietStrategy = cuisines ? `偏好 ${cuisines}，少油控糖` : '均衡饮食、少油控糖'
  const region = profile.location_city?.trim() || '未填写'
  return { goalLabel, dietStrategy, avoid, region }
}

export function getReadyPrioritiesFromProfile(profile: UserProfile): string[] {
  const remaining = getRemainingKcal(profile, getTodayConsumedKcal())
  const train =
    profile.training?.typical_session ?? profile.training?.next_session ?? '今日训练'
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
