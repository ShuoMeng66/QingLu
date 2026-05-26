import { motion } from 'framer-motion'
import { ChevronRight, Dumbbell, Flame, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { usePreferences } from '../../context/PreferencesContext'
import { getTodayConsumedKcal } from '../../lib/mealLog'
import { getRemainingKcal, isProfileComplete } from '../../lib/userProfile'

interface ChatDashboardBarProps {
  onOpenProfile: () => void
}

export function ChatDashboardBar({ onOpenProfile }: ChatDashboardBarProps) {
  const { userProfile } = useAppContext()
  const { t } = usePreferences()
  const [consumed, setConsumed] = useState(() => getTodayConsumedKcal())

  const refreshConsumed = useCallback(() => {
    setConsumed(getTodayConsumedKcal())
  }, [])

  useEffect(() => {
    refreshConsumed()
    const onFocus = () => refreshConsumed()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshConsumed, userProfile])

  const complete = isProfileComplete(userProfile)
  const budget = userProfile.daily_targets?.kcal ?? 0
  const remaining = getRemainingKcal(userProfile, consumed)
  const progress = budget > 0 ? Math.min(100, Math.round((consumed / budget) * 100)) : 0

  if (!complete) {
    return (
      <div className="burnpal-chat-column px-5 pb-3 pt-1">
        <button
          type="button"
          className="group relative w-full overflow-hidden rounded-[22px] p-[1px] text-left shadow-glow-emerald transition-transform active:scale-[0.99]"
          onClick={onOpenProfile}
        >
          <div className="absolute inset-0 gradient-vitality opacity-90" />
          <div className="profile-setup-banner__inner relative flex items-center gap-4 rounded-[21px] bg-gradient-to-br from-lime-50 via-green-50/90 to-yellow-50/40 px-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-vitality-br text-lime-950 shadow-glow-emerald">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-body-primary">{t('dashboard.setupTitle')}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-body-secondary">{t('dashboard.setupHint')}</p>
            </div>
            <span className="btn-vitality shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold">
              {t('dashboard.setupBtn')}
            </span>
          </div>
        </button>
      </div>
    )
  }

  const dashCard =
    'rounded-2xl border border-lime-400/35 bg-[#b8e0b0] p-3 text-left text-slate-900 shadow-sm transition hover:bg-[#a8d6a0] active:scale-[0.99]'

  return (
    <div className="burnpal-chat-column px-5 pb-3 pt-1">
      <div className="burnpal-dashboard-strip relative overflow-hidden rounded-[22px] border border-lime-400/40 bg-[#d0ebd0] p-4 shadow-sm">
        <div className="relative grid grid-cols-3 gap-3">
          <button type="button" className={dashCard} onClick={onOpenProfile}>
            <div className="mb-2 flex items-center gap-1.5 text-lime-800">
              <Flame className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('dashboard.calories')}
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums text-slate-900">{remaining}</p>
            <p className="text-[11px] text-slate-800">
              {t('dashboard.remaining')} · {consumed} {t('dashboard.consumed')}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lime-300/70">
              <motion.div
                className="h-full rounded-full gradient-vitality"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </button>

          <button type="button" className={dashCard} onClick={onOpenProfile}>
            <div className="mb-2 flex items-center gap-1.5 text-amber-800">
              <Dumbbell className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('dashboard.training')}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
              {userProfile.training?.typical_session ?? '—'}
            </p>
            <p className="mt-1 text-[11px] font-medium text-lime-900">
              {userProfile.training?.next_session ?? ''}
            </p>
          </button>

          <button type="button" className={dashCard} onClick={onOpenProfile}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-lime-800">
                {t('dashboard.weekly')}
              </span>
              <ChevronRight className="h-4 w-4 text-lime-800" />
            </div>
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {userProfile.training?.frequency_per_week ?? '—'}
              <span className="ml-0.5 text-base font-medium text-slate-700">×</span>
            </p>
            <p className="text-[11px] text-slate-800">{budget} kcal / day</p>
          </button>
        </div>
      </div>
    </div>
  )
}