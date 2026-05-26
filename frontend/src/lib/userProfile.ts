import { notifyUserDataChanged } from './userDataSync'

export type FitnessGoal = 'fat_loss' | 'muscle_gain' | 'maintain'

export interface UserProfile {
  user_id?: string
  nickname?: string
  goal?: FitnessGoal
  sex?: 'male' | 'female'
  age?: number
  height_cm?: number
  weight_kg?: number
  body_fat_pct?: number
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
  preferences?: {
    favorite_cuisines?: string[]
    avoid?: string[]
  }
  location_city?: string
  profile_complete?: boolean
}

const STORAGE_KEY = 'burnpal.user-profile-v1'

export const GOAL_OPTIONS: { id: FitnessGoal; label: string }[] = [
  { id: 'fat_loss', label: '科学减脂' },
  { id: 'muscle_gain', label: '增肌塑形' },
  { id: 'maintain', label: '维持体态' },
]

export const EMPTY_PROFILE: UserProfile = {
  nickname: '',
  preferences: { favorite_cuisines: [], avoid: [] },
  profile_complete: false,
}

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PROFILE }
    const parsed = JSON.parse(raw) as UserProfile
    return { ...EMPTY_PROFILE, ...parsed }
  } catch {
    return { ...EMPTY_PROFILE }
  }
}

export function saveUserProfile(patch: Partial<UserProfile>): UserProfile {
  const next = { ...loadUserProfile(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}

export function replaceUserProfile(profile: UserProfile): UserProfile {
  const next = { ...EMPTY_PROFILE, ...profile, preferences: profile.preferences ?? EMPTY_PROFILE.preferences }
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

/** Mifflin-St Jeor + 目标调整 */
export function computeDailyTargets(profile: UserProfile): UserProfile['daily_targets'] {
  const weight = profile.weight_kg ?? 70
  const height = profile.height_cm ?? 170
  const age = profile.age ?? 28
  const sex = profile.sex ?? 'male'
  const bmr =
    sex === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5
  let tdee = bmr * activityMultiplier(profile.activity_level)

  if (profile.goal === 'fat_loss') tdee *= 0.82
  else if (profile.goal === 'muscle_gain') tdee *= 1.08

  const kcal = Math.round(tdee)
  const protein_g = Math.round(weight * (profile.goal === 'muscle_gain' ? 2 : 1.6))
  const fat_g = Math.round((kcal * 0.25) / 9)
  const carb_g = Math.round((kcal - protein_g * 4 - fat_g * 9) / 4)

  return { kcal, protein_g, carb_g, fat_g }
}

export function computeTrainingPlan(profile: UserProfile): UserProfile['training'] {
  const freq =
    profile.goal === 'muscle_gain' ? 5 : profile.goal === 'fat_loss' ? 4 : 3
  const session =
    profile.goal === 'muscle_gain'
      ? '力量训练 50 分钟'
      : profile.goal === 'fat_loss'
        ? '晚间臀腿 / 有氧 40 分钟'
        : '全身激活 30 分钟'

  const hour = profile.goal === 'fat_loss' ? 19 : 18
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
