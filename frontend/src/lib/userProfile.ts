import { notifyUserDataChanged } from './userDataSync'

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'maintain'
export type ProfileTier = 'beginner' | 'advanced'
export type TrainingExperience = 'beginner' | 'intermediate' | 'advanced'
export type TrainingSplit = 'full_body' | 'upper_lower' | 'ppl' | 'bro' | 'custom'
export type TrainingFocus = 'strength' | 'hypertrophy' | 'fat_loss_perf' | 'endurance' | 'athletic'
export type EquipmentAccess = 'commercial_gym' | 'home' | 'minimal'
export type CarbStrategy = 'balanced' | 'low_carb' | 'high_carb_training'
export type PreferredTrainingTime = 'morning' | 'afternoon' | 'evening'
export type BlockPhase = 'cut' | 'bulk' | 'maintain' | 'recomp'
export type CardioStyle = 'none' | 'liss' | 'hiit' | 'mixed'
export type RpePreference = 'conservative' | 'moderate' | 'aggressive'
export type MealTiming = 'standard' | 'intermittent' | 'pre_workout_focus'
export type BeginnerWeeklySessions = '2_3' | '4_5' | '6_plus'
export type BeginnerWorkoutStyle = 'light_movement' | 'gym_basics' | 'already_training'
export type BeginnerEatingOut = 'rare' | 'weekly' | 'often'

export interface UserProfile {
  user_id?: string
  avatar_url?: string
  nickname?: string
  /** 新手：少字段宽泛配置；老手：完整专业项 */
  profile_tier?: ProfileTier
  goal?: FitnessGoal
  sex?: 'male' | 'female'
  age?: number
  height_cm?: number
  weight_kg?: number
  body_fat_pct?: number
  target_weight_kg?: number
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active'
  daily_targets?: {
    kcal?: number
    protein_g?: number
    carb_g?: number
    fat_g?: number
  }
  training?: {
    frequency_per_week?: number
    typical_session?: string
    next_session?: string
  }
  beginner_summary?: {
    weekly_sessions?: BeginnerWeeklySessions
    workout_style?: BeginnerWorkoutStyle
    eating_out?: BeginnerEatingOut
  }
  training_profile?: {
    experience?: TrainingExperience
    split?: TrainingSplit
    focus?: TrainingFocus
    frequency_per_week?: number
    session_minutes?: number
    preferred_time?: PreferredTrainingTime
    equipment?: EquipmentAccess
    focus_muscle_groups?: string[]
    limitations?: string[]
    training_years?: number
    block_phase?: BlockPhase
    cardio_style?: CardioStyle
    rpe_preference?: RpePreference
    refeed_days_per_week?: number
    weekly_steps_target?: number
    periodization_notes?: string
  }
  nutrition_advanced?: {
    protein_g_per_kg?: number
    kcal_override?: number
    carb_strategy?: CarbStrategy
    meal_timing?: MealTiming
  }
  recovery?: {
    sleep_hours?: number
    stress_level?: 'low' | 'medium' | 'high'
  }
  preferences?: {
    favorite_cuisines?: string[]
    avoid?: string[]
  }
  location_city?: string
  profile_complete?: boolean
}

const STORAGE_KEY = 'qinglu.user-profile-v1'

export const GOAL_OPTIONS: { id: FitnessGoal; label: string }[] = [
  { id: 'fat_loss', label: '科学减脂' },
  { id: 'muscle_gain', label: '增肌塑形' },
  { id: 'maintain', label: '维持体态' },
]

export const EMPTY_PROFILE: UserProfile = {
  nickname: '',
  profile_tier: 'beginner',
  preferences: { favorite_cuisines: [], avoid: [] },
  training_profile: { focus_muscle_groups: [], limitations: [] },
  beginner_summary: {},
  profile_complete: false,
}

function mergeProfile(current: UserProfile, patch: Partial<UserProfile>): UserProfile {
  return {
    ...current,
    ...patch,
    preferences: patch.preferences
      ? { ...current.preferences, ...patch.preferences }
      : current.preferences,
    beginner_summary: patch.beginner_summary
      ? { ...current.beginner_summary, ...patch.beginner_summary }
      : current.beginner_summary,
    training_profile: patch.training_profile
      ? { ...current.training_profile, ...patch.training_profile }
      : current.training_profile,
    nutrition_advanced: patch.nutrition_advanced
      ? { ...current.nutrition_advanced, ...patch.nutrition_advanced }
      : current.nutrition_advanced,
    recovery: patch.recovery ? { ...current.recovery, ...patch.recovery } : current.recovery,
    daily_targets: patch.daily_targets
      ? { ...current.daily_targets, ...patch.daily_targets }
      : current.daily_targets,
    training: patch.training ? { ...current.training, ...patch.training } : current.training,
  }
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PROFILE }
    const parsed = JSON.parse(raw) as UserProfile
    return mergeProfile(EMPTY_PROFILE, parsed)
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export function saveUserProfile(patch: Partial<UserProfile>): UserProfile {
  const next = mergeProfile(loadUserProfile(), patch)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}

export function replaceUserProfile(profile: UserProfile): UserProfile {
  const next = mergeProfile(EMPTY_PROFILE, profile)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}

export function isProfileComplete(profile: UserProfile): boolean {
  return Boolean(
    profile.profile_complete &&
      profile.height_cm &&
      profile.weight_kg &&
      profile.goal &&
      profile.daily_targets?.kcal,
  )
}

export function getProfileTier(profile: UserProfile): ProfileTier {
  return profile.profile_tier ?? 'beginner'
}

function activityMultiplier(level: UserProfile['activity_level']): number {
  switch (level) {
    case 'sedentary':
      return 1.2
    case 'light':
      return 1.375
    case 'moderate':
      return 1.55
    case 'active':
      return 1.725
    default:
      return 1.45
  }
}

const SPLIT_LABEL: Record<TrainingSplit, string> = {
  full_body: '全身',
  upper_lower: '上下肢分化',
  ppl: '推拉腿 PPL',
  bro: '部位分化',
  custom: '自定义周期',
}

const FOCUS_LABEL: Record<TrainingFocus, string> = {
  strength: '力量表现',
  hypertrophy: '肌肥大',
  fat_loss_perf: '减脂表现',
  endurance: '有氧耐力',
  athletic: '综合体能',
}

const BEGINNER_STYLE_LABEL: Record<BeginnerWorkoutStyle, string> = {
  light_movement: '轻量活动',
  gym_basics: '健身房基础',
  already_training: '已有训练习惯',
}

function beginnerFrequency(bs?: UserProfile['beginner_summary']): number {
  switch (bs?.weekly_sessions) {
    case '2_3':
      return 3
    case '4_5':
      return 4
    case '6_plus':
      return 6
    default:
      return 3
  }
}

function defaultProteinPerKg(
  tier: ProfileTier,
  goal: FitnessGoal | undefined,
  focus: TrainingFocus | undefined,
): number {
  if (tier === 'beginner') {
    if (goal === 'muscle_gain') return 1.8
    if (goal === 'fat_loss') return 1.7
    return 1.6
  }
  if (focus === 'strength' || focus === 'hypertrophy') return goal === 'muscle_gain' ? 2.2 : 2.0
  if (goal === 'fat_loss') return 1.8
  return 1.6
}

/** Mifflin-St Jeor + 目标与训练风格调整 */
export function computeDailyTargets(profile: UserProfile): UserProfile['daily_targets'] {
  const tier = getProfileTier(profile)
  const override =
    tier === 'advanced' ? profile.nutrition_advanced?.kcal_override : undefined

  if (override != null && override > 800) {
    const weight = profile.weight_kg ?? 70
    const proteinPerKg =
      profile.nutrition_advanced?.protein_g_per_kg ??
      defaultProteinPerKg(tier, profile.goal, profile.training_profile?.focus)
    const protein_g = Math.round(weight * proteinPerKg)
    const carbStrategy = profile.nutrition_advanced?.carb_strategy ?? 'balanced'
    const fatPct = carbStrategy === 'low_carb' ? 0.3 : 0.25
    const fat_g = Math.round((override * fatPct) / 9)
    const carb_g = Math.max(0, Math.round((override - protein_g * 4 - fat_g * 9) / 4))
    return { kcal: Math.round(override), protein_g, carb_g, fat_g }
  }

  const weight = profile.weight_kg ?? 70
  const height = profile.height_cm ?? 170
  const age = profile.age ?? 28
  const sex = profile.sex ?? 'male'
  const bmr =
    sex === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
  let tdee = bmr * activityMultiplier(profile.activity_level)

  if (tier === 'advanced') {
    const exp = profile.training_profile?.experience
    if (exp === 'advanced') tdee *= 1.03
    else if (exp === 'beginner') tdee *= 0.97

    const freq = profile.training_profile?.frequency_per_week ?? 0
    if (freq >= 5) tdee *= 1.04
    else if (freq >= 4) tdee *= 1.02

    if (profile.training_profile?.block_phase === 'bulk') tdee *= 1.05
    if (profile.training_profile?.block_phase === 'cut') tdee *= 0.88

    const refeed = profile.training_profile?.refeed_days_per_week ?? 0
    if (refeed > 0 && profile.goal === 'fat_loss') tdee *= 1.01
  } else {
    const freq = beginnerFrequency(profile.beginner_summary)
    if (freq >= 5) tdee *= 1.03
    if (profile.beginner_summary?.eating_out === 'often') tdee *= 1.02
  }

  if (profile.goal === 'fat_loss') tdee *= 0.82
  else if (profile.goal === 'muscle_gain') tdee *= 1.08

  const kcal = Math.round(tdee)
  const proteinPerKg =
    tier === 'advanced' && profile.nutrition_advanced?.protein_g_per_kg
      ? profile.nutrition_advanced.protein_g_per_kg
      : defaultProteinPerKg(tier, profile.goal, profile.training_profile?.focus)
  const protein_g = Math.round(weight * proteinPerKg)

  let carbStrategy: CarbStrategy = 'balanced'
  if (tier === 'advanced') {
    carbStrategy = profile.nutrition_advanced?.carb_strategy ?? 'balanced'
  }

  const fatPct =
    carbStrategy === 'low_carb' ? 0.3 : carbStrategy === 'high_carb_training' ? 0.22 : 0.25
  const fat_g = Math.round((kcal * fatPct) / 9)
  let carb_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4)
  if (carbStrategy === 'high_carb_training') carb_g = Math.round(carb_g * 1.08)
  if (carbStrategy === 'low_carb') carb_g = Math.max(50, Math.round(carb_g * 0.75))

  return { kcal, protein_g, carb_g, fat_g }
}

export function computeTrainingPlan(profile: UserProfile): UserProfile['training'] {
  const tier = getProfileTier(profile)

  if (tier === 'beginner') {
    const freq = beginnerFrequency(profile.beginner_summary)
    const style = profile.beginner_summary?.workout_style
    const styleLabel = style ? BEGINNER_STYLE_LABEL[style] : '综合活动'
    const session = `${styleLabel} · 每周约 ${freq} 次`
    const hour = profile.goal === 'fat_loss' ? 19 : 18
    return {
      frequency_per_week: freq,
      typical_session: session,
      next_session: `${String(hour).padStart(2, '0')}:00 开始`,
    }
  }

  const tp = profile.training_profile
  const freq =
    tp?.frequency_per_week ??
    (profile.goal === 'muscle_gain' ? 5 : profile.goal === 'fat_loss' ? 4 : 3)
  const minutes = tp?.session_minutes ?? (tp?.focus === 'endurance' ? 45 : 50)
  const splitLabel = tp?.split ? SPLIT_LABEL[tp.split] : '全身'
  const focusLabel = tp?.focus ? FOCUS_LABEL[tp.focus] : '综合'
  const muscles = tp?.focus_muscle_groups?.filter(Boolean).slice(0, 2) ?? []
  const muscleSuffix = muscles.length ? ` · 重点 ${muscles.join('/')}` : ''
  const blockSuffix = tp?.block_phase ? ` · ${tp.block_phase} 周期` : ''
  const cardioSuffix =
    tp?.cardio_style && tp.cardio_style !== 'none' ? ` · ${tp.cardio_style} 有氧` : ''

  const session = `${splitLabel} · ${focusLabel} · ${minutes} 分钟${muscleSuffix}${blockSuffix}${cardioSuffix}`

  const hour =
    tp?.preferred_time === 'morning'
      ? 7
      : tp?.preferred_time === 'afternoon'
        ? 14
        : profile.goal === 'fat_loss'
          ? 19
          : 18
  return {
    frequency_per_week: freq,
    typical_session: session,
    next_session: `${String(hour).padStart(2, '0')}:00 开始`,
  }
}

export function finalizeUserProfile(profile: UserProfile): UserProfile {
  const daily_targets = computeDailyTargets(profile)
  const training = computeTrainingPlan(profile)
  return saveUserProfile({
    ...profile,
    daily_targets,
    training,
    profile_complete: true,
  })
}

export function getRemainingKcal(profile: UserProfile, consumed: number): number {
  const budget = profile.daily_targets?.kcal ?? 0
  return Math.max(0, budget - consumed)
}
