import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { OnboardStepper } from '../components/qinglu/OnboardStepper'
import { QingluLogo } from '../components/qinglu/QingluLogo'
import {
  ProfilePrioritiesCard,
  ProfileReadyActions,
  ProfileSummaryCard,
  ProfileTodayCard,
} from '../components/qinglu/ProfileReadyPanels'
import { PageTransition } from '../components/layout/PageTransition'
import {
  getProfileReadySummary,
  getProfileReadyTagGroups,
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
  const tagGroups = useMemo(
    () => (profile ? getProfileReadyTagGroups(profile, locale) : null),
    [profile, locale],
  )
  const priorities = useMemo(
    () => (profile ? getReadyPrioritiesFromProfile(profile) : []),
    [profile],
  )

  const needsOnboard = !profile || !summary || !tagGroups

  useEffect(() => {
    if (needsOnboard) navigate('/onboard', { replace: true })
  }, [needsOnboard, navigate])

  if (needsOnboard) return null

  const nickname = profile.nickname?.trim() || t('today.defaultName')

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="onboard-ready-shell mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8">
        <QingluLogo compact />

        <div className="mt-6">
          <OnboardStepper currentStep={3} />
        </div>

        <header className="mt-8">
          <h1 className="font-display-serif text-2xl font-semibold text-body-primary sm:text-3xl">
            {t('ready.title', { name: nickname })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body-secondary">
            {t('ready.subtitle')}
          </p>
        </header>

        <div className="profile-ready-grid mt-6">
          <div className="onboard-card">
            <ProfileSummaryCard tags={tagGroups} />
          </div>
          <div className="onboard-card">
            <ProfileTodayCard
              profile={profile}
              today={today}
              regionFallback={summary.region}
            />
          </div>
        </div>

        <div className="onboard-card mt-4">
          <ProfilePrioritiesCard priorities={priorities} />
        </div>

        <ProfileReadyActions
          primaryLabel={t('ready.startBtn')}
          onPrimary={() => navigate('/chat', { replace: true })}
          secondaryLabel={t('ready.editLink')}
          onSecondary={() => navigate('/onboard/profile', { replace: true })}
        />
      </PageTransition>
    </AppShell>
  )
}
