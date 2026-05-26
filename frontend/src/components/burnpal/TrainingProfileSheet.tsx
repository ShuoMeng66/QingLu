import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { TagCloud } from './TagCloud'
import { useAppContext } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../hooks/useI18n'
import {
  getAvoidOptions,
  getCuisineOptions,
  getGoalOptions,
} from '../../lib/i18n/chatCopy'
import {
  finalizeUserProfile,
  loadUserProfile,
  saveUserProfile,
  type FitnessGoal,
  type UserProfile,
} from '../../lib/userProfile'

interface TrainingProfileSheetProps {
  open: boolean
  onClose: () => void
}

export function TrainingProfileSheet({ open, onClose }: TrainingProfileSheetProps) {
  const { toast } = useToast()
  const { t, locale } = useI18n()
  const { refreshUserProfile } = useAppContext()
  const [profile, setProfile] = useState(loadUserProfile)

  useEffect(() => {
    if (open) setProfile(loadUserProfile())
  }, [open])

  const updateProfile = (patch: Parameters<typeof saveUserProfile>[0]) => {
    const next = saveUserProfile(patch)
    setProfile(next)
  }

  const handleSave = () => {
    if (!profile.height_cm || !profile.weight_kg || !profile.goal) {
      toast(t('profile.validationMissing'), 'error')
      return
    }
    const next = finalizeUserProfile(profile)
    setProfile(next)
    refreshUserProfile()
    toast(t('profile.savedToast'), 'success')
    onClose()
  }

  const goalOptions = getGoalOptions(locale)
  const cuisineOptions = getCuisineOptions(locale)
  const avoidOptions = getAvoidOptions(locale)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-emerald-950/10 backdrop-blur-sm dark:bg-black/40"
            aria-label={t('action.close')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-sheet-title"
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] w-full flex-col rounded-t-[32px] glass-panel shadow-glass backdrop-blur-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="relative flex shrink-0 flex-col items-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-slate-300/80" aria-hidden="true" />
              <button
                type="button"
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-slate-500 backdrop-blur-md dark:bg-slate-800/80"
                aria-label={t('action.close')}
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              <h2 id="profile-sheet-title" className="mb-1 text-lg font-semibold text-slate-800">
                {t('profile.title')}
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-slate-500">{t('profile.hint')}</p>

              <div className="mb-4 flex flex-wrap gap-2">
                {goalOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      profile.goal === option.id ? 'btn-vitality' : 'bg-white/60 text-slate-500'
                    }`}
                    onClick={() => updateProfile({ goal: option.id as FitnessGoal })}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ProfileField label={t('profile.nickname')}>
                  <input
                    value={profile.nickname ?? ''}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(event) => updateProfile({ nickname: event.target.value })}
                  />
                </ProfileField>
                <ProfileField label={t('profile.sex')}>
                  <select
                    value={profile.sex ?? ''}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(event) =>
                      updateProfile({ sex: event.target.value as 'male' | 'female' })
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
                    onChange={(event) =>
                      updateProfile({ age: Number(event.target.value) || undefined })
                    }
                  />
                </ProfileField>
                <ProfileField label={t('profile.activity')}>
                  <select
                    value={profile.activity_level ?? 'moderate'}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(event) =>
                      updateProfile({
                        activity_level: event.target.value as UserProfile['activity_level'],
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
                    onChange={(event) =>
                      updateProfile({ height_cm: Number(event.target.value) || undefined })
                    }
                  />
                </ProfileField>
                <ProfileField label={t('profile.weight')}>
                  <input
                    type="number"
                    value={profile.weight_kg ?? ''}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                    onChange={(event) =>
                      updateProfile({ weight_kg: Number(event.target.value) || undefined })
                    }
                  />
                </ProfileField>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-slate-500">{t('profile.cuisines')}</p>
                <TagCloud
                  options={cuisineOptions}
                  selected={profile.preferences?.favorite_cuisines ?? []}
                  onChange={(next) =>
                    updateProfile({
                      preferences: { ...profile.preferences, favorite_cuisines: next },
                    })
                  }
                />
                <p className="mb-2 mt-4 text-xs font-medium text-slate-500">{t('profile.avoid')}</p>
                <TagCloud
                  options={avoidOptions}
                  selected={profile.preferences?.avoid ?? []}
                  onChange={(next) =>
                    updateProfile({
                      preferences: { ...profile.preferences, avoid: next },
                    })
                  }
                />
              </div>

              {profile.profile_complete && profile.daily_targets?.kcal && (
                <p className="mt-4 text-xs text-emerald-400">
                  {t('profile.dailyTarget', {
                    kcal: profile.daily_targets.kcal,
                    protein: profile.daily_targets.protein_g ?? 0,
                    session: profile.training?.typical_session ?? '—',
                  })}
                </p>
              )}

              <button
                type="button"
                className="btn-vitality mt-5 w-full rounded-full py-3 text-sm font-semibold"
                onClick={handleSave}
              >
                {t('profile.save')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
