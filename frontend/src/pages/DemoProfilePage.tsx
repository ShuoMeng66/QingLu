import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/qinglu/AppShell'
import { QingluLogo } from '../components/qinglu/QingluLogo'
import { PageTransition } from '../components/layout/PageTransition'
import { DEMO_PROFILES } from '../data/demoProfiles.generated'
import { applyDemoProfile } from '../lib/demoProfiles'
import { useI18n } from '../hooks/useI18n'

export function DemoProfilePage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  const selectProfile = (id: string) => {
    if (!applyDemoProfile(id)) return
    navigate('/ready', { replace: true })
  }

  return (
    <AppShell scrollable showMesh>
      <PageTransition className="qinglu-chat-column mx-auto flex min-h-dvh max-w-lg flex-col px-5 py-8">
        <QingluLogo compact />
        <h1 className="mt-8 font-display-serif text-2xl font-semibold text-body-primary">{t('onboard.title')}</h1>
        <p className="mt-2 text-sm leading-relaxed text-body-secondary">{t('onboard.subtitle')}</p>
        <ul className="mt-8 flex flex-col gap-4">
          {DEMO_PROFILES.map((profile) => (
            <motion.li key={profile.id}>
              <motion.button
                type="button"
                className="glass-panel w-full rounded-[22px] p-4 text-left shadow-glass transition-transform hover:-translate-y-0.5"
                whileTap={{ scale: 0.98 }}
                onClick={() => selectProfile(profile.id)}
              >
                <p className="text-lg font-semibold text-body-primary">{profile.name}</p>
                <p className="mt-1 text-xs text-body-secondary">
                  {profile.location.city} · {profile.location.current}
                </p>
                <p className="mt-2 text-sm text-body-secondary">
                  今日剩余 {profile.today.remaining_kcal} kcal · {profile.today.training_plan}
                </p>
              </motion.button>
            </motion.li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-6 text-center text-sm font-medium text-lime-700 underline"
          onClick={() => navigate('/settings')}
        >
          {t('onboard.quickSetup')}
        </button>
      </PageTransition>
    </AppShell>
  )
}
