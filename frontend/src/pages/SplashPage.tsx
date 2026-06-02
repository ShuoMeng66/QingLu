import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n'
import { useAuth } from '../context/AuthContext'
import { AccountAuthPanel } from '../components/auth/AccountAuthPanel'
import { UserAccountAvatar } from '../components/auth/UserAccountAvatar'
import { AppShell } from '../components/burnpal/AppShell'
import { BurnPalLogo } from '../components/burnpal/BurnPalLogo'
import { PageTransition } from '../components/layout/PageTransition'
import { SplashHeroVisual } from '../components/burnpal/SplashHeroVisual'
import { pingAuthHealth } from '../lib/api/client'
import { SPLASH_BACKGROUND_SRC } from '../data/splashAssets'

export function SplashPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { user, loading } = useAuth()

  useEffect(() => {
    void pingAuthHealth().catch(() => {
      /* warm backend / Render cold start; ignore failures */
    })
  }, [])

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat', { replace: true })
    }
  }, [loading, user, navigate])

  if (user && !loading) {
    return (
    <AppShell scrollable showMesh={false}>
      <PageTransition className="flex min-h-dvh flex-1 items-center justify-center">
          <p className="text-sm text-slate-500">{t('auth.restoringSession')}</p>
        </PageTransition>
      </AppShell>
    )
  }

  return (
    <AppShell scrollable showMesh={false}>
      <PageTransition className="relative flex min-h-dvh flex-1 flex-col overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <img
            src={SPLASH_BACKGROUND_SRC}
            alt=""
            className="h-full w-full object-cover object-[center_42%]"
            decoding="async"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/72 to-white/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/55 via-white/10 to-white/25" />
          <div className="absolute inset-0 bg-lime-50/15 mix-blend-soft-light" />
        </div>

        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
          <BurnPalLogo compact enlargeText />
          <UserAccountAvatar />
        </header>

        <div className="relative z-10 grid w-full flex-1 lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="flex items-start justify-start px-[clamp(1.75rem,8vw,7rem)] pb-16 pt-24 lg:pb-20 lg:pl-[clamp(2.5rem,10vw,8rem)]">
            <div className="splash-hero-copy max-w-xl">
              <h1 className="font-display-serif font-bold leading-[1.12] tracking-wide">
                <span className="splash-hero-headline block">{t('splash.headline1')}</span>
                <span className="splash-hero-headline block pl-[0.2em] sm:pl-14 md:pl-16">
                  {t('splash.headline2')}
                </span>
              </h1>
              <p className="splash-hero-tagline mt-6 max-w-lg font-medium">
                {t('splash.tagline')}
              </p>
              <motion.button
                type="button"
                className="btn-vitality mt-10 w-full max-w-sm rounded-full px-14 py-5 text-xl font-semibold sm:mt-12 sm:w-auto"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/chat')}
              >
                {t('splash.wakeBtn')}
              </motion.button>
              <p className="splash-hero-subtitle mt-5">{t('splash.subtitle')}</p>

              <div className="mt-8 max-w-md">
                <AccountAuthPanel
                  variant="compact"
                  defaultMode="login"
                  onSuccess={() => navigate('/chat', { replace: true })}
                />
              </div>
            </div>
          </div>

          <div className="relative hidden min-h-0 lg:flex lg:items-center">
            <SplashHeroVisual />
          </div>

          {/* Mobile / tablet: hero below copy */}
          <div className="relative lg:hidden">
            <SplashHeroVisual />
          </div>
        </div>
      </PageTransition>
    </AppShell>
  )
}
