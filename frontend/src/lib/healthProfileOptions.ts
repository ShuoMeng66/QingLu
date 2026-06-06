import type { AppLocale } from './appPreferences'
import type { MessageKey } from './i18n/messages'
import { translate } from './i18n/messages'
import type { FitnessGoal, TrainingExperience } from './userProfile'

export type GoalIntensity = 'light' | 'moderate' | 'strict'
export type TakeoutBudget = 'under_30' | '30_50' | '50_plus'
export type DiningBudget = 'under_100' | '100_200' | '200_plus'

const GOAL_INTENSITY_STORAGE: Record<GoalIntensity, string> = {
  light: '轻度控制',
  moderate: '中度减脂',
  strict: '严格控卡',
}

const DIET_STRATEGY_STORAGE = {
  high_protein: '高蛋白',
  low_fat: '低脂',
  carb_control: '控碳',
  balanced: '均衡',
} as const

const TASTE_STORAGE = {
  light: '清淡',
  spicy: '辣',
  bold: '重口',
  japanese: '日料',
  chinese: '中餐',
  western: '西餐',
} as const

const FOOD_RESTRICTION_STORAGE = {
  no_spicy: '不吃辣',
  no_beef: '不吃牛肉',
  no_seafood: '不吃海鲜',
  vegetarian: '素食',
  no_restriction: '无忌口',
} as const

const DIETARY_CUSTOM_STORAGE = {
  low_sugar: '低糖',
  low_fat: '低脂',
  low_organ: '少动物器官',
  halal: '清真',
  religious: '宗教习俗忌口',
  organ: '内脏',
  fried: '油炸',
  sugar: '高糖',
  alcohol: '酒精',
} as const

const TAKEOUT_BUDGET_STORAGE: Record<TakeoutBudget, string> = {
  under_30: '30以内',
  '30_50': '30-50',
  '50_plus': '50+',
}

const DINING_BUDGET_STORAGE: Record<DiningBudget, string> = {
  under_100: '人均100以内',
  '100_200': '100-200',
  '200_plus': '200+',
}

const SPORT_STORAGE = {
  strength: '力量训练',
  running: '跑步',
  swimming: '游泳',
  yoga: '瑜伽',
  ball: '球类',
} as const

const VENUE_STORAGE = {
  commercial_gym: '商业健身房',
  park: '公园',
  group_class: '团课',
  home: '居家',
} as const

const AREA_STORAGE = {
  near_work: '公司附近',
  near_home: '家附近',
  frequent_district: '常活动商圈',
} as const

const HEALTH_BOUNDARY_STORAGE = {
  knee: '膝盖不适',
  lower_back: '腰背不适',
  neck_shoulder: '肩颈不适',
  none: '无',
} as const

function optionList<const T extends string>(
  locale: AppLocale,
  ids: readonly T[],
  keyPrefix: string,
  storage: Record<T, string>,
): { id: T; value: string; label: string }[] {
  return ids.map((id) => ({
    id,
    value: storage[id],
    label: translate(locale, `${keyPrefix}.${id}` as MessageKey),
  }))
}

export const GOAL_INTENSITY_IDS = ['light', 'moderate', 'strict'] as const
export const DIET_STRATEGY_IDS = ['high_protein', 'low_fat', 'carb_control', 'balanced'] as const
export const TASTE_IDS = ['light', 'spicy', 'bold', 'japanese', 'chinese', 'western'] as const
export const FOOD_RESTRICTION_IDS = [
  'no_spicy',
  'no_beef',
  'no_seafood',
  'vegetarian',
  'no_restriction',
] as const
export const DIETARY_CUSTOM_IDS = [
  'low_sugar',
  'low_fat',
  'low_organ',
  'halal',
  'religious',
  'organ',
  'fried',
  'sugar',
  'alcohol',
] as const
export const TAKEOUT_BUDGET_IDS = ['under_30', '30_50', '50_plus'] as const
export const DINING_BUDGET_IDS = ['under_100', '100_200', '200_plus'] as const
export const SPORT_IDS = ['strength', 'running', 'swimming', 'yoga', 'ball'] as const
export const VENUE_IDS = ['commercial_gym', 'park', 'group_class', 'home'] as const
export const AREA_IDS = ['near_work', 'near_home', 'frequent_district'] as const
export const HEALTH_BOUNDARY_IDS = ['knee', 'lower_back', 'neck_shoulder', 'none'] as const

export function getGoalIntensityOptions(locale: AppLocale) {
  return optionList(locale, GOAL_INTENSITY_IDS, 'health.intensity', GOAL_INTENSITY_STORAGE)
}

export function getDietStrategyOptions(locale: AppLocale) {
  return optionList(locale, DIET_STRATEGY_IDS, 'health.diet', DIET_STRATEGY_STORAGE)
}

export function getTastePreferenceOptions(locale: AppLocale) {
  return optionList(locale, TASTE_IDS, 'health.taste', TASTE_STORAGE)
}

export function getFoodRestrictionOptions(locale: AppLocale) {
  return optionList(locale, FOOD_RESTRICTION_IDS, 'health.restriction', FOOD_RESTRICTION_STORAGE)
}

export function getDietaryCustomOptions(locale: AppLocale) {
  return optionList(locale, DIETARY_CUSTOM_IDS, 'health.custom', DIETARY_CUSTOM_STORAGE)
}

export function getTakeoutBudgetOptions(locale: AppLocale) {
  return TAKEOUT_BUDGET_IDS.map((id) => ({
    id,
    value: TAKEOUT_BUDGET_STORAGE[id],
    label: translate(locale, `health.takeoutBudget.${id}` as MessageKey),
  }))
}

export function getDiningBudgetOptions(locale: AppLocale) {
  return DINING_BUDGET_IDS.map((id) => ({
    id,
    value: DINING_BUDGET_STORAGE[id],
    label: translate(locale, `health.diningBudget.${id}` as MessageKey),
  }))
}

export function getCommonSportOptions(locale: AppLocale) {
  return optionList(locale, SPORT_IDS, 'health.sport', SPORT_STORAGE)
}

export function getPreferredVenueOptions(locale: AppLocale) {
  return optionList(locale, VENUE_IDS, 'health.venue', VENUE_STORAGE)
}

export function getCommonAreaOptions(locale: AppLocale) {
  return optionList(locale, AREA_IDS, 'health.area', AREA_STORAGE)
}

export function getHealthBoundaryOptions(locale: AppLocale) {
  return optionList(locale, HEALTH_BOUNDARY_IDS, 'health.boundary', HEALTH_BOUNDARY_STORAGE)
}

export function getTrainingLevelOptions(
  locale: AppLocale,
): { id: TrainingExperience; value: string; label: string }[] {
  return [
    {
      id: 'beginner',
      value: '新手',
      label: translate(locale, 'health.level.beginner'),
    },
    {
      id: 'intermediate',
      value: '有基础',
      label: translate(locale, 'health.level.intermediate'),
    },
    {
      id: 'advanced',
      value: '高阶',
      label: translate(locale, 'health.level.advanced'),
    },
  ]
}

export function goalIntensityLabel(
  id: GoalIntensity | undefined,
  locale: AppLocale = 'zh',
): string | undefined {
  if (!id) return undefined
  return translate(locale, `health.intensity.${id}` as MessageKey)
}

export function formatPreferencesForPrompt(profile: {
  preferences?: UserProfilePreferencesLike
  goal?: FitnessGoal
  training_profile?: { experience?: TrainingExperience }
}): {
  goal_intensity: string
  diet_strategy: string
  taste_preference: string
  food_restrictions: string
  dietary_customs: string
  takeout_budget: string
  dining_budget: string
  common_sports: string
  fitness_level: string
  preferred_venues: string
  common_areas: string
  health_boundaries: string
} {
  const p = profile.preferences
  return {
    goal_intensity: p?.goal_intensity
      ? goalIntensityLabel(p.goal_intensity) ?? '—'
      : profile.goal === 'fat_loss'
        ? '中度减脂'
        : '—',
    diet_strategy: p?.diet_strategies?.join('、') || '均衡',
    taste_preference: p?.taste_preferences?.join('、') || '—',
    food_restrictions: p?.food_restrictions?.join('、') || '无',
    dietary_customs: p?.dietary_customs?.join('、') || '无',
    takeout_budget: p?.takeout_budget || '30-50',
    dining_budget: p?.dining_budget || '100-200',
    common_sports: p?.common_sports?.join('、') || '—',
    fitness_level:
      profile.training_profile?.experience === 'advanced'
        ? '高阶'
        : profile.training_profile?.experience === 'intermediate'
          ? '有基础'
          : profile.training_profile?.experience === 'beginner'
            ? '新手'
            : '—',
    preferred_venues: p?.preferred_venues?.join('、') || '—',
    common_areas: p?.common_areas?.join('、') || '—',
    health_boundaries: p?.health_boundaries?.join('、') || '无',
  }
}

export interface UserProfilePreferencesLike {
  favorite_cuisines?: string[]
  avoid?: string[]
  goal_intensity?: GoalIntensity
  diet_strategies?: string[]
  taste_preferences?: string[]
  food_restrictions?: string[]
  dietary_customs?: string[]
  takeout_budget?: string
  dining_budget?: string
  common_sports?: string[]
  preferred_venues?: string[]
  common_areas?: string[]
  health_boundaries?: string[]
}
