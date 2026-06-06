import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { QingluLogo } from '../components/qinglu/QingluLogo'
import { PageTransition } from '../components/layout/PageTransition'
import { useI18n } from '../hooks/useI18n'

export function OnboardProfilePage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="qinglu-chat-column mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
        <QingluLogo compact />
        <h1 className="mt-8 font-display-serif text-2xl font-semibold text-body-primary">
          {t('onboard.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-body-secondary">{t('onboard.subtitle')}</p>
        <ul className="mt-6 space-y-2 text-sm text-body-secondary">
          <li>· {t('onboard.bullet1')}</li>
          <li>· {t('onboard.bullet2')}</li>
          <li>· {t('onboard.bullet3')}</li>
        </ul>
        <button
          type="button"
          className="btn-vitality mt-8 w-full rounded-full py-4 text-base font-semibold"
          onClick={() => navigate('/onboard/profile')}
        >
          {t('onboard.cta')}
        </button>
        <button
          type="button"
          className="mt-4 text-center text-sm text-body-secondary underline"
          onClick={() => navigate('/chat')}
        >
          {t('onboard.skip')}
        </button>
      </PageTransition>
    </AppShell>
  )
}
