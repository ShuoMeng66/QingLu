import { CheckCircle2, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { HealthProfileForm } from '../components/qinglu/HealthProfileForm'
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
        className={`mx-auto flex min-h-dvh flex-col px-5 py-6 ${
          phase === 'success' ? 'max-w-5xl' : 'max-w-lg qinglu-chat-column'
        }`}
      >
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
          tagGroups &&
          savedProfile && (
            <div className="flex flex-1 flex-col py-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden="true" />
                <h1 className="mt-4 font-display-serif text-2xl font-semibold text-body-primary sm:text-3xl">
                  {t('profile.saveSuccessTitle')}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-body-secondary">
                  {t('profile.saveSuccessHint')}
                </p>
              </div>

              <div className="profile-ready-grid mt-8">
                <ProfileSummaryCard tags={tagGroups} />
                <ProfileHelpCard />
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
