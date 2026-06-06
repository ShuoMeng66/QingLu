import { useEffect, useRef, useState, type ReactNode } from 'react'
import { TagCloud } from './TagCloud'
import { useOptionalAppContext } from '../../context/AppContext'
import { useOptionalProfileContext } from '../../context/ProfileProvider'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../hooks/useI18n'
import {
  getCuisineOptions,
  getGoalOptions,
} from '../../lib/i18n/chatCopy'
import {
  getCommonAreaOptions,
  getCommonSportOptions,
  getDietaryCustomOptions,
  getDietStrategyOptions,
  getDiningBudgetOptions,
  getFoodRestrictionOptions,
  getGoalIntensityOptions,
  getHealthBoundaryOptions,
  getPreferredVenueOptions,
  getTakeoutBudgetOptions,
  getTastePreferenceOptions,
  getTrainingLevelOptions,
  type GoalIntensity,
} from '../../lib/healthProfileOptions'
import {
  getBeginnerSessionOptions,
  getBlockPhaseOptions,
  getCardioStyleOptions,
  getCarbStrategyOptions,
  getEquipmentOptions,
  getLimitationOptions,
  getMealTimingOptions,
  getMuscleGroupOptions,
  getProfileTierOptions,
  getRpeOptions,
  getTrainingExperienceOptions,
  getTrainingFocusOptions,
  getTrainingSplitOptions,
  PROTEIN_G_PER_KG_OPTIONS,
  REFEED_DAY_OPTIONS,
} from '../../lib/profileOptions'
import {
  finalizeUserProfile,
  getProfileTier,
  loadUserProfile,
  saveUserProfile,
  type FitnessGoal,
  type PreferredTrainingTime,
  type ProfileTier,
  type UserProfile,
} from '../../lib/userProfile'

export interface HealthProfileFormProps {
  onSaveSuccess: (profile: UserProfile) => void
  showDailyTargetPreview?: boolean
  /** When truthy, reload profile from storage (sheet passes `open`) */
  reloadWhen?: boolean
}

export function HealthProfileForm({
  onSaveSuccess,
  showDailyTargetPreview = true,
  reloadWhen,
}: HealthProfileFormProps) {
  const { toast } = useToast()
  const { t, locale } = useI18n()
  const profileCtx = useOptionalProfileContext()
  const appCtx = useOptionalAppContext()
  const refreshUserProfile = () => {
    profileCtx?.refreshUserProfile()
    appCtx?.refreshUserProfile()
    window.dispatchEvent(new Event('qinglu:user-data-applied'))
  }
  const [profile, setProfile] = useState(loadUserProfile)
  const [saveHint, setSaveHint] = useState<string | null>(null)
  const [highlightGoal, setHighlightGoal] = useState(false)
  const [highlightBody, setHighlightBody] = useState(false)
  const goalSectionRef = useRef<HTMLElement>(null)
  const bodySectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reloadWhen) {
      setProfile(loadUserProfile())
      setSaveHint(null)
      setHighlightGoal(false)
      setHighlightBody(false)
    }
  }, [reloadWhen])

  useEffect(() => {
    if (profile.goal) setHighlightGoal(false)
    if (profile.height_cm && profile.weight_kg) setHighlightBody(false)
    if (profile.goal && profile.height_cm && profile.weight_kg) setSaveHint(null)
  }, [profile.goal, profile.height_cm, profile.weight_kg])

  const updateProfile = (patch: Parameters<typeof saveUserProfile>[0]) => {
    const next = saveUserProfile(patch)
    setProfile(next)
  }

  const updateTraining = (patch: NonNullable<UserProfile['training_profile']>) => {
    updateProfile({
      training_profile: { ...profile.training_profile, ...patch },
    })
  }

  const updateNutrition = (patch: NonNullable<UserProfile['nutrition_advanced']>) => {
    updateProfile({
      nutrition_advanced: { ...profile.nutrition_advanced, ...patch },
    })
  }

  const updateRecovery = (patch: NonNullable<UserProfile['recovery']>) => {
    updateProfile({
      recovery: { ...profile.recovery, ...patch },
    })
  }

  const updateBeginner = (patch: NonNullable<UserProfile['beginner_summary']>) => {
    updateProfile({
      beginner_summary: { ...profile.beginner_summary, ...patch },
    })
  }

  const updatePreferences = (patch: NonNullable<UserProfile['preferences']>) => {
    updateProfile({
      preferences: { ...profile.preferences, ...patch },
    })
  }

  const prefs = profile.preferences

  const missingRequiredLabels = (): string[] => {
    const missing: string[] = []
    if (!profile.goal) missing.push(t('profile.missingGoal'))
    if (!profile.height_cm) missing.push(t('profile.missingHeight'))
    if (!profile.weight_kg) missing.push(t('profile.missingWeight'))
    return missing
  }

  const scrollToFirstMissing = () => {
    const target = !profile.goal
      ? goalSectionRef.current
      : !profile.height_cm || !profile.weight_kg
        ? bodySectionRef.current
        : null
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSave = () => {
    if (!profile.height_cm || !profile.weight_kg || !profile.goal) {
      const missing = missingRequiredLabels()
      setSaveHint(t('profile.validationBanner', { items: missing.join('、') }))
      setHighlightGoal(!profile.goal)
      setHighlightBody(!profile.height_cm || !profile.weight_kg)
      scrollToFirstMissing()
      toast(t('profile.validationMissing'), 'error')
      return
    }
    const next = finalizeUserProfile(profile)
    setProfile(next)
    refreshUserProfile()
    toast(t('profile.savedToast'), 'success')
    onSaveSuccess(next)
  }

  const goalOptions = getGoalOptions(locale)
  const cuisineOptions = getCuisineOptions(locale)
  const goalIntensityOptions = getGoalIntensityOptions(locale)
  const dietStrategyOptions = getDietStrategyOptions(locale)
  const tasteOptions = getTastePreferenceOptions(locale)
  const foodRestrictionOptions = getFoodRestrictionOptions(locale)
  const dietaryCustomOptions = getDietaryCustomOptions(locale)
  const takeoutBudgetOptions = getTakeoutBudgetOptions(locale)
  const diningBudgetOptions = getDiningBudgetOptions(locale)
  const sportOptions = getCommonSportOptions(locale)
  const venueOptions = getPreferredVenueOptions(locale)
  const areaOptions = getCommonAreaOptions(locale)
  const healthBoundaryOptions = getHealthBoundaryOptions(locale)
  const trainingLevelOptions = getTrainingLevelOptions(locale)
  const tp = profile.training_profile
  const tier = getProfileTier(profile)
  const isAdvanced = tier === 'advanced'
  const bs = profile.beginner_summary

  return (
    <>
      <ProfileSection title={t('profile.sectionTier')}>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getProfileTierOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tier === option.id}
                      label={option.label}
                      onClick={() =>
                        updateProfile({ profile_tier: option.id as ProfileTier })
                      }
                    />
                  ))}
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {t(isAdvanced ? 'profile.tierHintAdvanced' : 'profile.tierHintBeginner')}
                </p>
              </ProfileSection>

              <ProfileSection
                title={t('health.sectionGoal')}
                sectionRef={goalSectionRef}
                highlight={highlightGoal}
              >
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.currentGoal')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {goalOptions.map((option) => (
                    <ChipButton
                      key={option.id}
                      active={profile.goal === option.id}
                      label={option.label}
                      onClick={() => updateProfile({ goal: option.id as FitnessGoal })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.goalIntensity')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {goalIntensityOptions.map((option) => (
                    <ChipButton
                      key={option.id}
                      active={prefs?.goal_intensity === option.id}
                      label={option.label}
                      onClick={() =>
                        updatePreferences({
                          goal_intensity: option.id as GoalIntensity,
                        })
                      }
                    />
                  ))}
                </div>
              </ProfileSection>

              <ProfileSection
                title={t('profile.sectionBody')}
                sectionRef={bodySectionRef}
                highlight={highlightBody}
              >
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label={t('profile.nickname')}>
                    <input
                      value={profile.nickname ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) => updateProfile({ nickname: e.target.value })}
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.sex')}>
                    <select
                      value={profile.sex ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateProfile({ sex: e.target.value as 'male' | 'female' })
                      }
                    >
                      <option value="">{t('profile.sexSelect')}</option>
                      <option value="male">{t('profile.sexMale')}</option>
                      <option value="female">{t('profile.sexFemale')}</option>
                    </select>
                  </ProfileField>
                  <ProfileField label={t('profile.age')}>
                    <input
                      type="number"
                      value={profile.age ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateProfile({ age: Number(e.target.value) || undefined })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.activity')}>
                    <select
                      value={profile.activity_level ?? 'moderate'}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateProfile({
                          activity_level: e.target.value as UserProfile['activity_level'],
                        })
                      }
                    >
                      <option value="sedentary">{t('profile.activitySedentary')}</option>
                      <option value="light">{t('profile.activityLight')}</option>
                      <option value="moderate">{t('profile.activityModerate')}</option>
                      <option value="active">{t('profile.activityActive')}</option>
                    </select>
                  </ProfileField>
                  <ProfileField label={t('profile.height')}>
                    <input
                      type="number"
                      value={profile.height_cm ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateProfile({ height_cm: Number(e.target.value) || undefined })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.weight')}>
                    <input
                      type="number"
                      value={profile.weight_kg ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateProfile({ weight_kg: Number(e.target.value) || undefined })
                      }
                    />
                  </ProfileField>
                  {isAdvanced && (
                    <>
                      <ProfileField label={t('profile.bodyFat')}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={profile.body_fat_pct ?? ''}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                          onChange={(e) =>
                            updateProfile({ body_fat_pct: Number(e.target.value) || undefined })
                          }
                        />
                      </ProfileField>
                      <ProfileField label={t('profile.targetWeight')}>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="—"
                          value={profile.target_weight_kg ?? ''}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                          onChange={(e) =>
                            updateProfile({
                              target_weight_kg: Number(e.target.value) || undefined,
                            })
                          }
                        />
                      </ProfileField>
                    </>
                  )}
                </div>
              </ProfileSection>

              <ProfileSection title={t('health.sectionDiet')}>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.dietStrategy')}
                </p>
                <TagCloud
                  options={dietStrategyOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.diet_strategies ?? []}
                  onChange={(next) => updatePreferences({ diet_strategies: next })}
                />
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                  {t('health.tastePreference')}
                </p>
                <TagCloud
                  options={tasteOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.taste_preferences ?? []}
                  onChange={(next) => updatePreferences({ taste_preferences: next })}
                />
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                  {t('profile.cuisines')}
                </p>
                <TagCloud
                  options={cuisineOptions}
                  selected={prefs?.favorite_cuisines ?? []}
                  onChange={(next) => updatePreferences({ favorite_cuisines: next })}
                />
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                  {t('health.foodRestrictions')}
                </p>
                <TagCloud
                  options={foodRestrictionOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.food_restrictions ?? prefs?.avoid ?? []}
                  onChange={(next) => updatePreferences({ food_restrictions: next })}
                />
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                  {t('health.dietaryCustoms')}
                </p>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-400">
                  {t('health.dietaryCustomsHint')}
                </p>
                <TagCloud
                  options={dietaryCustomOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.dietary_customs ?? []}
                  onChange={(next) => updatePreferences({ dietary_customs: next })}
                />
              </ProfileSection>

              <ProfileSection title={t('health.sectionBudget')}>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.takeoutBudget')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {takeoutBudgetOptions.map((option) => (
                    <ChipButton
                      key={option.id}
                      active={prefs?.takeout_budget === option.value}
                      label={option.label}
                      onClick={() => updatePreferences({ takeout_budget: option.value })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.diningBudget')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {diningBudgetOptions.map((option) => (
                    <ChipButton
                      key={option.id}
                      active={prefs?.dining_budget === option.value}
                      label={option.label}
                      onClick={() => updatePreferences({ dining_budget: option.value })}
                    />
                  ))}
                </div>
              </ProfileSection>

              <ProfileSection title={t('health.sectionSport')}>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.commonSports')}
                </p>
                <TagCloud
                  options={sportOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.common_sports ?? []}
                  onChange={(next) => updatePreferences({ common_sports: next })}
                />
                <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                  {t('health.trainingLevel')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {trainingLevelOptions.map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.experience === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ experience: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('health.preferredVenue')}
                </p>
                <TagCloud
                  options={venueOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.preferred_venues ?? []}
                  onChange={(next) => updatePreferences({ preferred_venues: next })}
                />
                {!isAdvanced && (
                  <>
                    <p className="mb-1.5 mt-4 text-[11px] font-medium text-slate-500">
                      {t('profile.beginnerSessions')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getBeginnerSessionOptions(locale).map((option) => (
                        <ChipButton
                          key={option.id}
                          active={bs?.weekly_sessions === option.id}
                          label={option.label}
                          onClick={() => updateBeginner({ weekly_sessions: option.id })}
                        />
                      ))}
                    </div>
                  </>
                )}
              </ProfileSection>

              <ProfileSection title={t('health.sectionArea')}>
                <TagCloud
                  options={areaOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.common_areas ?? []}
                  onChange={(next) => updatePreferences({ common_areas: next })}
                />
              </ProfileSection>

              <ProfileSection title={t('health.sectionBoundary')}>
                <TagCloud
                  options={healthBoundaryOptions.map((o) => ({ value: o.value, label: o.label }))}
                  selected={prefs?.health_boundaries ?? []}
                  onChange={(next) => {
                    updatePreferences({ health_boundaries: next })
                    const limits = next.filter((v) => v !== '无')
                    updateTraining({ limitations: limits })
                  }}
                />
              </ProfileSection>

              {isAdvanced && (
              <ProfileSection title={t('profile.sectionTraining')}>
                <p className="mb-2 text-[11px] text-slate-400">{t('profile.sectionTrainingHint')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getTrainingExperienceOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.experience === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ experience: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('profile.split')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getTrainingSplitOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.split === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ split: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('profile.focus')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getTrainingFocusOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.focus === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ focus: option.id })}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label={t('profile.frequency')}>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      placeholder="4"
                      value={tp?.frequency_per_week ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateTraining({
                          frequency_per_week: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.sessionMinutes')}>
                    <input
                      type="number"
                      min={20}
                      max={120}
                      placeholder="50"
                      value={tp?.session_minutes ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateTraining({
                          session_minutes: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.preferredTime')}>
                    <select
                      value={tp?.preferred_time ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) => {
                        const v = e.target.value
                        updateTraining({
                          preferred_time: v
                            ? (v as PreferredTrainingTime)
                            : undefined,
                        })
                      }}
                    >
                      <option value="">{t('profile.timeAuto')}</option>
                      <option value="morning">{t('profile.timeMorning')}</option>
                      <option value="afternoon">{t('profile.timeAfternoon')}</option>
                      <option value="evening">{t('profile.timeEvening')}</option>
                    </select>
                  </ProfileField>
                  <ProfileField label={t('profile.equipment')}>
                    <select
                      value={tp?.equipment ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateTraining({
                          equipment: (e.target.value || undefined) as
                            | NonNullable<UserProfile['training_profile']>['equipment']
                            | undefined,
                        })
                      }
                    >
                      <option value="">{t('profile.equipSelect')}</option>
                      {getEquipmentOptions(locale).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </ProfileField>
                </div>
                <p className="mb-2 mt-3 text-xs font-medium text-slate-500">{t('profile.muscleFocus')}</p>
                <TagCloud
                  options={getMuscleGroupOptions(locale)}
                  selected={tp?.focus_muscle_groups ?? []}
                  onChange={(next) => updateTraining({ focus_muscle_groups: next })}
                />
                <p className="mb-2 mt-3 text-xs font-medium text-slate-500">{t('profile.limitations')}</p>
                <TagCloud
                  options={getLimitationOptions(locale)}
                  selected={tp?.limitations ?? []}
                  onChange={(next) => updateTraining({ limitations: next })}
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ProfileField label={t('profile.trainingYears')}>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      placeholder="3"
                      value={tp?.training_years ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateTraining({
                          training_years: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.weeklySteps')}>
                    <input
                      type="number"
                      step={500}
                      min={3000}
                      max={25000}
                      placeholder="8000"
                      value={tp?.weekly_steps_target ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateTraining({
                          weekly_steps_target: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </ProfileField>
                </div>
                <p className="mb-1.5 mt-3 text-[11px] font-medium text-slate-500">
                  {t('profile.blockPhase')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getBlockPhaseOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.block_phase === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ block_phase: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('profile.cardioStyle')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getCardioStyleOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.cardio_style === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ cardio_style: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('profile.rpePreference')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getRpeOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={tp?.rpe_preference === option.id}
                      label={option.label}
                      onClick={() => updateTraining({ rpe_preference: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('profile.refeedDays')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {REFEED_DAY_OPTIONS.map((days) => (
                    <ChipButton
                      key={days}
                      active={tp?.refeed_days_per_week === days}
                      label={String(days)}
                      onClick={() => updateTraining({ refeed_days_per_week: days })}
                    />
                  ))}
                </div>
                <ProfileField label={t('profile.periodizationNotes')}>
                  <textarea
                    rows={2}
                    placeholder="—"
                    value={tp?.periodization_notes ?? ''}
                    className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(e) =>
                      updateTraining({
                        periodization_notes: e.target.value || undefined,
                      })
                    }
                  />
                </ProfileField>
              </ProfileSection>
              )}

              {isAdvanced && (
              <ProfileSection title={t('profile.sectionNutrition')}>
                <p className="mb-2 text-[11px] text-slate-400">{t('profile.sectionNutritionHint')}</p>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('profile.proteinPerKg')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {PROTEIN_G_PER_KG_OPTIONS.map((g) => (
                    <ChipButton
                      key={g}
                      active={profile.nutrition_advanced?.protein_g_per_kg === g}
                      label={`${g} g/kg`}
                      onClick={() => updateNutrition({ protein_g_per_kg: g })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">{t('profile.carbStrategy')}</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getCarbStrategyOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={profile.nutrition_advanced?.carb_strategy === option.id}
                      label={option.label}
                      onClick={() => updateNutrition({ carb_strategy: option.id })}
                    />
                  ))}
                </div>
                <p className="mb-1.5 text-[11px] font-medium text-slate-500">
                  {t('profile.mealTiming')}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {getMealTimingOptions(locale).map((option) => (
                    <ChipButton
                      key={option.id}
                      active={profile.nutrition_advanced?.meal_timing === option.id}
                      label={option.label}
                      onClick={() => updateNutrition({ meal_timing: option.id })}
                    />
                  ))}
                </div>
                <ProfileField label={t('profile.kcalOverride')}>
                  <input
                    type="number"
                    placeholder={t('profile.kcalOverridePlaceholder')}
                    value={profile.nutrition_advanced?.kcal_override ?? ''}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(e) =>
                      updateNutrition({
                        kcal_override: Number(e.target.value) || undefined,
                      })
                    }
                  />
                </ProfileField>
              </ProfileSection>
              )}

              {isAdvanced && (
              <ProfileSection title={t('profile.sectionRecovery')}>
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label={t('profile.sleepHours')}>
                    <input
                      type="number"
                      step="0.5"
                      min={4}
                      max={12}
                      placeholder="7"
                      value={profile.recovery?.sleep_hours ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateRecovery({
                          sleep_hours: Number(e.target.value) || undefined,
                        })
                      }
                    />
                  </ProfileField>
                  <ProfileField label={t('profile.stress')}>
                    <select
                      value={profile.recovery?.stress_level ?? ''}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                      onChange={(e) =>
                        updateRecovery({
                          stress_level: (e.target.value || undefined) as
                            | 'low'
                            | 'medium'
                            | 'high'
                            | undefined,
                        })
                      }
                    >
                      <option value="">{t('profile.stressSelect')}</option>
                      <option value="low">{t('profile.stressLow')}</option>
                      <option value="medium">{t('profile.stressMedium')}</option>
                      <option value="high">{t('profile.stressHigh')}</option>
                    </select>
                  </ProfileField>
                </div>
              </ProfileSection>
              )}

      {showDailyTargetPreview && profile.profile_complete && profile.daily_targets?.kcal && (
                <p className="mt-4 rounded-xl bg-emerald-50/80 px-3 py-2 text-xs leading-relaxed text-emerald-700">
                  {t('profile.dailyTargetFull', {
                    kcal: profile.daily_targets.kcal,
                    protein: profile.daily_targets.protein_g ?? 0,
                    carb: profile.daily_targets.carb_g ?? 0,
                    fat: profile.daily_targets.fat_g ?? 0,
                    session: profile.training?.typical_session ?? '—',
                    freq: profile.training?.frequency_per_week ?? '—',
                  })}
                </p>
              )}

      {saveHint && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 px-3 py-2.5 text-xs leading-relaxed text-rose-800"
        >
          {saveHint}
        </p>
      )}

      <button
        type="button"
        className="btn-vitality mt-5 w-full rounded-full py-3 text-sm font-semibold"
        onClick={handleSave}
      >
        {t('profile.save')}
      </button>
    </>
  )
}

function ProfileSection({
  title,
  children,
  sectionRef,
  highlight,
}: {
  title: string
  children: ReactNode
  sectionRef?: React.RefObject<HTMLElement | null>
  highlight?: boolean
}) {
  return (
    <section
      ref={sectionRef}
      className={`mb-5 rounded-[20px] border bg-white/45 p-4 shadow-glass ${
        highlight
          ? 'border-rose-300 ring-2 ring-rose-200/80'
          : 'border-white/70'
      }`}
    >
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  )
}

function ProfileField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500">
      {label}
      {children}
    </label>
  )
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'btn-vitality' : 'bg-white/60 text-slate-500'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
