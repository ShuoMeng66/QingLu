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
          <div className="relative flex items-center gap-4 rounded-[21px] bg-gradient-to-br from-emerald-50/95 to-white/90 px-4 py-4 dark:from-emerald-950/90 dark:to-slate-900/90">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl gradient-vitality-br text-white shadow-glow-emerald">
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

  return (
    <div className="burnpal-chat-column px-5 pb-3 pt-1">
      <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-white/55 p-4 shadow-glass backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-300/25 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative grid grid-cols-3 gap-3">
          <button
            type="button"
            className="rounded-2xl bg-white/70 p-3 text-left transition hover:bg-white/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
            onClick={onOpenProfile}
          >
            <div className="mb-2 flex items-center gap-1.5 text-emerald-500">
              <Flame className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('dashboard.calories')}
              </span>
            </div>
            <p className="text-xl font-bold tabular-nums text-body-primary">{remaining}</p>
            <p className="text-[11px] text-body-secondary">
              {t('dashboard.remaining')} · {consumed} {t('dashboard.consumed')}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
              <motion.div
                className="h-full rounded-full gradient-vitality"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </button>

          <button
            type="button"
            className="rounded-2xl bg-white/70 p-3 text-left transition hover:bg-white/90 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
            onClick={onOpenProfile}
          >
            <div className="mb-2 flex items-center gap-1.5 text-teal-500">
              <Dumbbell className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                {t('dashboard.training')}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-body-primary">
              {userProfile.training?.typical_session ?? '—'}
            </p>
            <p className="mt-1 text-[11px] text-emerald-500">
              {userProfile.training?.next_session ?? ''}
            </p>
          </button>

          <button
            type="button"
            className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-400/15 to-teal-400/10 p-3 text-left transition hover:from-emerald-400/20 hover:to-teal-400/15"
            onClick={onOpenProfile}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                {t('dashboard.weekly')}
              </span>
              <ChevronRight className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold tabular-nums text-body-primary">
              {userProfile.training?.frequency_per_week ?? '—'}
              <span className="ml-0.5 text-base font-medium text-body-secondary">×</span>
            </p>
            <p className="text-[11px] text-body-secondary">{budget} kcal / day</p>
          </button>
        </div>
      </div>
    </div>
  )
}