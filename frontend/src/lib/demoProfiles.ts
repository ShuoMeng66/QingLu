import {
  DEMO_PROFILES,
  type DemoProfileRecord,
} from '../data/demoProfiles.generated'
import { importAllMealLogs, type MealSlot } from './mealLog'
import { replaceTodaySnapshot } from './todaySnapshot'
import { replaceUserProfile, type UserProfile } from './userProfile'
import { seedCachedUserLocation } from './userLocation'

export const DEMO_PROFILE_SESSION_KEY = 'qinglu.demoProfileId'

const SLOT_BY_MEAL: Record<string, MealSlot> = {
  早餐: 'breakfast',
  午餐: 'lunch',
  晚餐: 'dinner',
}

function areaFromLocation(current: string): string {
  const parts = current.split('·')
  return parts.length > 1 ? parts[parts.length - 1]! : current
}

function mapDemoToProfile(demo: DemoProfileRecord): UserProfile {
  const restrictions = demo.dietary_restrictions.filter(Boolean)
  const tastes = demo.taste_preferences.filter(Boolean)
  const cuisines = tastes.filter((t) => /中餐|粤菜|日料|西餐|轻食/.test(t))
  const tastePrefs = tastes.filter((t) => !cuisines.includes(t))
  const area = areaFromLocation(demo.location.current)
  const dietStrategies =
    demo.training_type === 'strength'
      ? ['高蛋白', '低脂', '控碳']
      : ['高蛋白', '控碳', '均衡']
  return {
    user_id: demo.id,
    nickname: demo.name,
    profile_tier: 'advanced',
    goal: 'fat_loss',
    sex: demo.gender === 'male' ? 'male' : 'female',
    age: demo.age,
    height_cm: demo.height_cm,
    weight_kg: demo.weight_kg,
    target_weight_kg: demo.target_weight_kg,
    activity_level:
      demo.activity_level === 'heavy'
        ? 'active'
        : demo.activity_level === 'light'
          ? 'light'
          : 'moderate',
    daily_targets: {
      kcal: demo.daily_target_kcal,
      protein_g: Math.round(demo.weight_kg * 1.6),
    },
    training: {
      frequency_per_week: parseInt(demo.training_frequency, 10) || 3,
      typical_session: demo.training_type,
      next_session: demo.today.training_plan,
    },
    preferences: {
      favorite_cuisines: cuisines.length > 0 ? cuisines : tastes,
      taste_preferences: tastePrefs.length > 0 ? tastePrefs : tastes,
      dietary_customs: restrictions,
      diet_strategies: dietStrategies,
      food_restrictions: [],
      common_areas: ['公司附近'],
      takeout_budget: demo.budget_per_meal_yuan >= 50 ? '50+' : '30-50',
      dining_budget: '100-200',
    },
    location_city: area || demo.location.city,
    profile_complete: true,
  }
}

export function getDemoProfileById(id: string): DemoProfileRecord | undefined {
  return DEMO_PROFILES.find((p) => p.id === id)
}

export function getActiveDemoProfileId(): string | null {
  try {
    return sessionStorage.getItem(DEMO_PROFILE_SESSION_KEY)
  } catch {
    return null
  }
}

export function applyDemoProfile(id: string): DemoProfileRecord | null {
  const demo = getDemoProfileById(id)
  if (!demo) return null

  sessionStorage.setItem(DEMO_PROFILE_SESSION_KEY, id)
  replaceUserProfile(mapDemoToProfile(demo))

  const area = areaFromLocation(demo.location.current)
  replaceTodaySnapshot({
    remaining_kcal: demo.today.remaining_kcal,
    training_plan: demo.today.training_plan,
    location_label: area,
    body_status: '正常',
    special_note: '',
  })

  const todayKey = new Date().toISOString().slice(0, 10)
  const entries = demo.today.meals_logged.map((meal, index) => ({
    id: `demo-${demo.id}-${index}`,
    slot: SLOT_BY_MEAL[meal.meal] ?? 'lunch',
    description: meal.items,
    kcal: meal.estimated_kcal,
    loggedAt: Date.now() - (demo.today.meals_logged.length - index) * 60_000,
  }))
  importAllMealLogs({ [todayKey]: entries })

  seedCachedUserLocation(demo.location.city, demo.location.current)

  window.dispatchEvent(new Event('qinglu:demo-profile-changed'))

  return demo
}

export function getDemoProfileSummary(demo: DemoProfileRecord) {
  const goalLabel = '中度减脂'
  const dietStrategy =
    demo.taste_preferences.includes('高蛋白') || demo.training_type === 'strength'
      ? '高蛋白、少油'
      : '均衡轻食、少油'
  const avoid = demo.dietary_restrictions.join('、') || '无特殊忌口'
  const region = areaFromLocation(demo.location.current)
  return { goalLabel, dietStrategy, avoid, region }
}

export function getReadyPagePriorities(demo: DemoProfileRecord): string[] {
  const remaining = demo.today.remaining_kcal
  const train = demo.today.training_plan
  return [
    `推荐不影响${train.includes('练') ? '晚训' : '今日训练'}的午餐外卖`,
    `找附近适合${train}的健身房`,
    '训练后安排下肢恢复',
    '周末发现轻量运动社交活动',
  ].map((line, i) => {
    if (i === 0) return `推荐不影响训练的午餐外卖（今日剩余约 ${remaining} kcal）`
    return line
  })
}
