import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../hooks/useI18n'
import { useAuth } from '../context/AuthContext'
import { AccountAuthPanel } from '../components/auth/AccountAuthPanel'
import { UserAccountAvatar } from '../components/auth/UserAccountAvatar'
import { AppShell } from '../components/qinglu/AppShell'
import { QingluLogo } from '../components/qinglu/QingluLogo'
import { PageTransition } from '../components/layout/PageTransition'
import { SplashHeadline } from '../components/qinglu/SplashHeadline'
import { SplashHeroVisual } from '../components/qinglu/SplashHeroVisual'
import { SplashAboutSection } from '../components/qinglu/SplashAboutSection'
import { pingAuthHealth } from '../lib/api/client'
import { SPLASH_BACKGROUND_SRC } from '../data/splashAssets'
import { resolvePostAuthPath } from '../lib/profileRouting'

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
      const stayOnSplash = new URLSearchParams(window.location.search).get('stay') === '1'
      // #region agent log
      fetch('http://127.0.0.1:7530/ingest/077fc56f-9998-421e-953f-c0c89307702f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9a6481'},body:JSON.stringify({sessionId:'9a6481',hypothesisId:'H3',location:'SplashPage.tsx:redirect',message:'post-auth redirect check',data:{stayOnSplash,path:resolvePostAuthPath()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (stayOnSplash) return
      navigate(resolvePostAuthPath(), { replace: true })
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
      <PageTransition className="relative flex w-full flex-col overflow-x-hidden">
        <section className="splash-hero-section relative min-h-dvh">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <img
              src={SPLASH_BACKGROUND_SRC}
              alt=""
              className="h-full w-full object-cover object-[center_42%]"
              decoding="async"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/94 via-white/78 to-white/42" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/12 to-white/28" />
            <div className="absolute inset-0 bg-lime-50/15 mix-blend-soft-light" />
          </div>

          <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
            <QingluLogo compact enlargeText />
            <UserAccountAvatar />
          </header>

          <div className="relative z-10 grid min-h-dvh w-full lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <div className="flex min-h-dvh items-center justify-center px-[clamp(1.25rem,6vw,4rem)] pb-24 pt-28 lg:justify-start lg:pb-20 lg:pl-[clamp(2.5rem,10vw,8rem)] lg:pr-10 lg:pt-24">
              <div className="splash-hero-copy w-full max-w-xl text-center lg:text-left">
                <SplashHeadline />

                <div className="splash-hero-body">
                  <p className="splash-hero-subhead">{t('splash.subtitle')}</p>
                  <p className="splash-hero-desc mx-auto max-w-md lg:mx-0">{t('splash.tagline')}</p>

                  <motion.button
                    type="button"
                    className="btn-vitality mx-auto mt-9 w-full max-w-sm rounded-full px-14 py-5 text-xl font-semibold lg:mx-0 sm:mt-10 sm:w-auto"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/onboard')}
                  >
                    {t('splash.wakeBtn')}
                  </motion.button>

                  <div className="splash-login-slot mx-auto lg:mx-0">
                    <AccountAuthPanel
                      variant="landing"
                      defaultMode="login"
                      onSuccess={() => navigate(resolvePostAuthPath(), { replace: true })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden min-h-dvh lg:flex lg:items-center lg:pr-[clamp(1.5rem,4vw,3rem)]">
              <SplashHeroVisual />
            </div>
          </div>

          <div className="relative z-10 lg:hidden">
            <SplashHeroVisual />
          </div>

          <a
            href="#about"
            className="splash-scroll-hint absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-emerald-600 lg:flex"
          >
            <span>{t('splash.scrollHint')}</span>
            <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
          </a>
        </section>

        <SplashAboutSection />
      </PageTransition>
    </AppShell>
  )
}
