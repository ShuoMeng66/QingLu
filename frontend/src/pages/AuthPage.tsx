import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AccountAuthPanel } from '../components/auth/AccountAuthPanel'
import { UserAccountAvatar } from '../components/auth/UserAccountAvatar'
import { AppShell } from '../components/qinglu/AppShell'
import { PageTransition } from '../components/layout/PageTransition'
import { useI18n } from '../hooks/useI18n'

export function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const defaultMode = searchParams.get('mode') === 'register' ? 'register' : 'login'

  return (
    <AppShell scrollable>
      <PageTransition className="mx-auto w-full max-w-md px-5 py-6 pb-12">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="glass-panel flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-glass"
              aria-label={t('action.back')}
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5 text-slate-800" />
            </button>
            <h1 className="truncate text-lg font-semibold text-slate-800">{t('auth.title')}</h1>
          </div>
          <UserAccountAvatar showLabel={false} />
        </header>

        <AccountAuthPanel
          defaultMode={defaultMode}
          variant="full"
          onSuccess={() => navigate('/chat', { replace: true })}
        />

        <p className="mt-4 text-center text-xs text-slate-500">
          <Link to="/" className="font-medium text-emerald-600 hover:underline">
            {t('splash.backToHome')}
          </Link>
        </p>
      </PageTransition>
    </AppShell>
  )
}
