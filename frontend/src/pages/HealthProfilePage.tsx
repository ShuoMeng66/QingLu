import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { HealthProfileForm } from '../components/qinglu/HealthProfileForm'
import { OnboardStepper } from '../components/qinglu/OnboardStepper'
import {
  ProfileHelpCard,
  ProfileReadyActions,
  ProfileSummaryCard,
} from '../components/qinglu/ProfileReadyPanels'
import { PageTransition } from '../components/layout/PageTransition'
import { useI18n } from '../hooks/useI18n'
import {
  getProfileReadyTagGroups,
  syncTodayFromProfile,
} from '../lib/profileReady'
import type { UserProfile } from '../lib/userProfile'

type Phase = 'form' | 'success'

export function HealthProfilePage() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [phase, setPhase] = useState<Phase>('form')
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null)

  const tagGroups = useMemo(
    () => (savedProfile ? getProfileReadyTagGroups(savedProfile, locale) : null),
    [savedProfile, locale],
  )

  const handleSaveSuccess = (profile: UserProfile) => {
    syncTodayFromProfile(profile)
    setSavedProfile(profile)
    setPhase('success')
  }

  return (
    <AppShell scrollable showMesh>
      <PageTransition
        className={`onboard-ready-shell mx-auto flex min-h-dvh flex-col px-5 py-6 ${
          phase === 'success' ? 'max-w-5xl' : 'max-w-lg'
        }`}
      >
        {phase === 'form' ? (
          <>
            <header className="profile-page-header">
              <button
                type="button"
                className="profile-page-header__back"
                aria-label={t('action.back')}
                onClick={() => navigate('/onboard')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="profile-page-header__title">{t('profile.pageTitle')}</h1>
              <p className="profile-page-header__hint">{t('profile.hint')}</p>
            </header>
            <div className="profile-form-page">
              <HealthProfileForm onSaveSuccess={handleSaveSuccess} variant="page" />
            </div>
          </>
        ) : (
          tagGroups &&
          savedProfile && (
            <div className="flex flex-1 flex-col py-2">
              <OnboardStepper currentStep={2} />

              <div className="mt-8 flex flex-col items-center text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden="true" />
                <h1 className="mt-4 font-display-serif text-2xl font-semibold text-body-primary sm:text-3xl">
                  {t('profile.saveSuccessTitle')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body-secondary">
                  {t('profile.saveSuccessHint')}
                </p>
              </div>

              <div className="profile-ready-grid mt-8">
                <div className="onboard-card">
                  <ProfileSummaryCard tags={tagGroups} />
                </div>
                <div className="onboard-card">
                  <ProfileHelpCard />
                </div>
              </div>

              <ProfileReadyActions
                primaryLabel={t('profile.continueToReady')}
                onPrimary={() => navigate('/ready', { replace: true })}
                secondaryLabel={t('profile.editAgain')}
                onSecondary={() => setPhase('form')}
              />
            </div>
          )
        )}
      </PageTransition>
    </AppShell>
  )
}
