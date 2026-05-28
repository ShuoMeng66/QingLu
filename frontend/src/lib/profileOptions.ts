import type { AppLocale } from './appPreferences'
import type { MessageKey } from './i18n/messages'
import { translate } from './i18n/messages'
import type {
  BlockPhase,
  BeginnerEatingOut,
  BeginnerWeeklySessions,
  BeginnerWorkoutStyle,
  CarbStrategy,
  CardioStyle,
  EquipmentAccess,
  MealTiming,
  ProfileTier,
  RpePreference,
  TrainingExperience,
  TrainingFocus,
  TrainingSplit,
} from './userProfile'

export function getProfileTierOptions(locale: AppLocale): { id: ProfileTier; label: string }[] {
  return [
    { id: 'beginner', label: translate(locale, 'profile.tierBeginner') },
    { id: 'advanced', label: translate(locale, 'profile.tierAdvanced') },
  ]
}

export function getBeginnerSessionOptions(
  locale: AppLocale,
): { id: BeginnerWeeklySessions; label: string }[] {
  return [
    { id: '2_3', label: translate(locale, 'profile.beginnerSessions23') },
    { id: '4_5', label: translate(locale, 'profile.beginnerSessions45') },
    { id: '6_plus', label: translate(locale, 'profile.beginnerSessions6') },
  ]
}

export function getBeginnerStyleOptions(
  locale: AppLocale,
): { id: BeginnerWorkoutStyle; label: string }[] {
  return [
    { id: 'light_movement', label: translate(locale, 'profile.beginnerStyleLight') },
    { id: 'gym_basics', label: translate(locale, 'profile.beginnerStyleGym') },
    { id: 'already_training', label: translate(locale, 'profile.beginnerStyleActive') },
  ]
}

export function getBeginnerEatingOutOptions(
  locale: AppLocale,
): { id: BeginnerEatingOut; label: string }[] {
  return [
    { id: 'rare', label: translate(locale, 'profile.beginnerEatRare') },
    { id: 'weekly', label: translate(locale, 'profile.beginnerEatWeekly') },
    { id: 'often', label: translate(locale, 'profile.beginnerEatOften') },
  ]
}

export function getBlockPhaseOptions(locale: AppLocale): { id: BlockPhase; label: string }[] {
  return [
    { id: 'cut', label: translate(locale, 'profile.blockCut') },
    { id: 'bulk', label: translate(locale, 'profile.blockBulk') },
    { id: 'maintain', label: translate(locale, 'profile.blockMaintain') },
    { id: 'recomp', label: translate(locale, 'profile.blockRecomp') },
  ]
}

export function getCardioStyleOptions(locale: AppLocale): { id: CardioStyle; label: string }[] {
  return [
    { id: 'none', label: translate(locale, 'profile.cardioNone') },
    { id: 'liss', label: translate(locale, 'profile.cardioLiss') },
    { id: 'hiit', label: translate(locale, 'profile.cardioHiit') },
    { id: 'mixed', label: translate(locale, 'profile.cardioMixed') },
  ]
}

export function getRpeOptions(locale: AppLocale): { id: RpePreference; label: string }[] {
  return [
    { id: 'conservative', label: translate(locale, 'profile.rpeConservative') },
    { id: 'moderate', label: translate(locale, 'profile.rpeModerate') },
    { id: 'aggressive', label: translate(locale, 'profile.rpeAggressive') },
  ]
}

export function getMealTimingOptions(locale: AppLocale): { id: MealTiming; label: string }[] {
  return [
    { id: 'standard', label: translate(locale, 'profile.timingStandard') },
    { id: 'intermittent', label: translate(locale, 'profile.timingIntermittent') },
    { id: 'pre_workout_focus', label: translate(locale, 'profile.timingPreWorkout') },
  ]
}

export const REFEED_DAY_OPTIONS = [0, 1, 2] as const

export function getTrainingExperienceOptions(
  locale: AppLocale,
): { id: TrainingExperience; label: string }[] {
  return [
    { id: 'beginner', label: translate(locale, 'profile.expBeginner') },
    { id: 'intermediate', label: translate(locale, 'profile.expIntermediate') },
    { id: 'advanced', label: translate(locale, 'profile.expAdvanced') },
  ]
}

export function getTrainingSplitOptions(locale: AppLocale): { id: TrainingSplit; label: string }[] {
  return [
    { id: 'full_body', label: translate(locale, 'profile.splitFullBody') },
    { id: 'upper_lower', label: translate(locale, 'profile.splitUpperLower') },
    { id: 'ppl', label: translate(locale, 'profile.splitPpl') },
    { id: 'bro', label: translate(locale, 'profile.splitBro') },
    { id: 'custom', label: translate(locale, 'profile.splitCustom') },
  ]
}

export function getTrainingFocusOptions(locale: AppLocale): { id: TrainingFocus; label: string }[] {
  return [
    { id: 'strength', label: translate(locale, 'profile.focusStrength') },
    { id: 'hypertrophy', label: translate(locale, 'profile.focusHypertrophy') },
    { id: 'fat_loss_perf', label: translate(locale, 'profile.focusFatLoss') },
    { id: 'endurance', label: translate(locale, 'profile.focusEndurance') },
    { id: 'athletic', label: translate(locale, 'profile.focusAthletic') },
  ]
}

export function getEquipmentOptions(locale: AppLocale): { id: EquipmentAccess; label: string }[] {
  return [
    { id: 'commercial_gym', label: translate(locale, 'profile.equipCommercial') },
    { id: 'home', label: translate(locale, 'profile.equipHome') },
    { id: 'minimal', label: translate(locale, 'profile.equipMinimal') },
  ]
}

export function getCarbStrategyOptions(locale: AppLocale): { id: CarbStrategy; label: string }[] {
  return [
    { id: 'balanced', label: translate(locale, 'profile.carbBalanced') },
    { id: 'low_carb', label: translate(locale, 'profile.carbLow') },
    { id: 'high_carb_training', label: translate(locale, 'profile.carbHighTraining') },
  ]
}

export const MUSCLE_GROUP_IDS = [
  'chest',
  'back',
  'legs',
  'glutes',
  'shoulders',
  'arms',
  'core',
] as const

export const LIMITATION_IDS = ['knee', 'shoulder', 'lower_back', 'wrist', 'neck'] as const

export function getMuscleGroupOptions(locale: AppLocale): { value: string; label: string }[] {
  return MUSCLE_GROUP_IDS.map((id) => ({
    value: id,
    label: translate(locale, `profile.muscle.${id}` as MessageKey),
  }))
}

export function getLimitationOptions(locale: AppLocale): { value: string; label: string }[] {
  return LIMITATION_IDS.map((id) => ({
    value: id,
    label: translate(locale, `profile.limit.${id}` as MessageKey),
  }))
}

export const PROTEIN_G_PER_KG_OPTIONS = [1.6, 1.8, 2.0, 2.2, 2.4] as const
