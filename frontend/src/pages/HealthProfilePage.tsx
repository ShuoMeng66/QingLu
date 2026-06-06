import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { HealthProfileForm } from '../components/qinglu/HealthProfileForm'
import { PageTransition } from '../components/layout/PageTransition'
import { useI18n } from '../hooks/useI18n'
import { getProfileReadySummary, syncTodayFromProfile } from '../lib/profileReady'
import type { UserProfile } from '../lib/userProfile'

type Phase = 'form' | 'success'

export function HealthProfilePage() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [phase, setPhase] = useState<Phase>('form')
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null)

  const summary = useMemo(
    () => (savedProfile ? getProfileReadySummary(savedProfile, locale) : null),
    [savedProfile, locale],
  )

  const handleSaveSuccess = (profile: UserProfile) => {
    syncTodayFromProfile(profile)
    setSavedProfile(profile)
    setPhase('success')
  }

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="qinglu-chat-column mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-6">
        {phase === 'form' ? (
          <>
            <header className="mb-4 flex items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-slate-600 backdrop-blur-md"
                aria-label={t('action.back')}
                onClick={() => navigate('/onboard')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="font-display-serif text-xl font-semibold text-body-primary">
                  {t('profile.pageTitle')}
                </h1>
                <p className="mt-0.5 text-xs leading-relaxed text-body-secondary">
                  {t('profile.hint')}
                </p>
              </div>
            </header>
            <HealthProfileForm onSaveSuccess={handleSaveSuccess} />
          </>
        ) : (
          summary && savedProfile && (
            <div className="flex flex-1 flex-col py-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden="true" />
                <h1 className="mt-4 font-display-serif text-2xl font-semibold text-body-primary">
                  {t('profile.saveSuccessTitle')}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-body-secondary">
                  {t('profile.saveSuccessHint')}
                </p>
              </div>
              <section className="mt-8 rounded-[22px] border border-lime-200/60 bg-white/80 p-4">
                <h2 className="text-sm font-semibold text-body-primary">{t('ready.summaryTitle')}</h2>
                <ul className="mt-3 space-y-1 text-sm text-body-secondary">
                  <li>{t('ready.goal', { value: summary.goalLabel })}</li>
                  <li>{t('ready.diet', { value: summary.dietStrategy })}</li>
                  <li>{t('ready.avoid', { value: summary.avoid })}</li>
                  <li>{t('ready.region', { value: summary.region })}</li>
                </ul>
              </section>
              <button
                type="button"
                className="btn-vitality mt-8 w-full rounded-full py-4 text-base font-semibold"
                onClick={() => navigate('/ready', { replace: true })}
              >
                {t('profile.continueToReady')}
              </button>
              <button
                type="button"
                className="mt-4 text-center text-sm text-body-secondary underline"
                onClick={() => setPhase('form')}
              >
                {t('profile.editAgain')}
              </button>
            </div>
          )
        )}
      </PageTransition>
    </AppShell>
  )
}
