import { ChevronRight, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { OnboardFeatureList } from '../components/qinglu/OnboardFeatureList'
import { OnboardHeroAside } from '../components/qinglu/OnboardHeroAside'
import { OnboardStepper } from '../components/qinglu/OnboardStepper'
import { QingluLogo } from '../components/qinglu/QingluLogo'
import { PageTransition } from '../components/layout/PageTransition'
import { useI18n } from '../hooks/useI18n'

export function OnboardProfilePage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="onboard-shell onboard-ready-shell">
        <div className="onboard-shell__logo">
          <QingluLogo compact />
        </div>

        <div className="onboard-shell__main">
          <div className="onboard-card">
            <OnboardStepper currentStep={1} />

            <h1 className="mt-6 font-display-serif text-2xl font-semibold text-body-primary sm:text-[1.75rem]">
              {t('onboard.title')}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-body-secondary">{t('onboard.subtitle')}</p>

            <div className="mt-6">
              <OnboardFeatureList />
            </div>

            <button
              type="button"
              className="btn-vitality mt-8 w-full rounded-full py-4 text-base font-semibold"
              onClick={() => navigate('/onboard/profile')}
            >
              {t('onboard.cta')}
            </button>

            <button
              type="button"
              className="onboard-skip-link"
              onClick={() => navigate('/chat')}
            >
              {t('onboard.skip')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <p className="onboard-trust">
              <Shield className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              {t('onboard.trustNote')}
            </p>
          </div>

          <OnboardHeroAside />
        </div>
      </PageTransition>
    </AppShell>
  )
}
