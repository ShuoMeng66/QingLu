import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { PageTransition } from '../components/layout/PageTransition'
import {
  getProfileReadySummary,
  getReadyPrioritiesFromProfile,
  loadReadyProfile,
} from '../lib/profileReady'
import { loadTodaySnapshot } from '../lib/todaySnapshot'
import { useI18n } from '../hooks/useI18n'

export function ProfileReadyPage() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const profile = loadReadyProfile()
  const today = loadTodaySnapshot()

  const summary = useMemo(
    () => (profile ? getProfileReadySummary(profile, locale) : null),
    [profile, locale],
  )
  const priorities = useMemo(
    () => (profile ? getReadyPrioritiesFromProfile(profile) : []),
    [profile],
  )

  const needsOnboard = !profile || !summary

  useEffect(() => {
    if (needsOnboard) navigate('/onboard', { replace: true })
  }, [needsOnboard, navigate])

  if (needsOnboard) return null

  const nickname = profile.nickname?.trim() || t('today.defaultName')

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="qinglu-chat-column mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
        <h1 className="font-display-serif text-2xl font-semibold text-body-primary">
          {t('ready.title', { name: nickname })}
        </h1>
        <section className="mt-6 rounded-[22px] border border-lime-200/60 bg-white/80 p-4">
          <h2 className="text-sm font-semibold text-body-primary">{t('ready.summaryTitle')}</h2>
          <ul className="mt-3 space-y-1 text-sm text-body-secondary">
            <li>{t('ready.goal', { value: summary.goalLabel })}</li>
            <li>{t('ready.diet', { value: summary.dietStrategy })}</li>
            <li>{t('ready.avoid', { value: summary.avoid })}</li>
            <li>{t('ready.region', { value: summary.region })}</li>
          </ul>
        </section>
        <section className="mt-4 rounded-[22px] border border-sky-200/50 bg-sky-50/50 p-4">
          <h2 className="text-sm font-semibold text-body-primary">{t('ready.todayTitle')}</h2>
          <ul className="mt-3 space-y-1 text-sm text-body-secondary">
            <li>
              {t('ready.remaining', {
                value: today.remaining_kcal ?? profile.daily_targets?.kcal ?? '—',
              })}
            </li>
            <li>
              {t('ready.training', {
                value: today.training_plan ?? profile.training?.typical_session ?? '—',
              })}
            </li>
            <li>{t('ready.location', { value: today.location_label ?? summary.region })}</li>
            <li>{t('ready.body', { value: today.body_status ?? t('today.bodyNormal') })}</li>
          </ul>
        </section>
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-body-primary">{t('ready.prioritiesTitle')}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-body-secondary">
            {priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <button
          type="button"
          className="btn-vitality mt-8 w-full rounded-full py-4 text-base font-semibold"
          onClick={() => navigate('/chat', { replace: true })}
        >
          {t('ready.startBtn')}
        </button>
      </PageTransition>
    </AppShell>
  )
}
