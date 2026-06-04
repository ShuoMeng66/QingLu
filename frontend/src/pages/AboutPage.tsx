import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppShell } from '../components/qinglu/AppShell'
import { PageTransition } from '../components/layout/PageTransition'
import { QINGLU } from '../data/qingluAssets'
import { QingluImage } from '../components/qinglu/QingluImage'
import { useI18n } from '../hooks/useI18n'

export function AboutPage() {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <AppShell scrollable>
      <PageTransition className="w-full px-5 py-8">
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-full shadow-glass"
            aria-label={t('action.back')}
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{t('about.title')}</h1>
        </header>
        <div className="flex flex-1 flex-col items-center text-center">
          <div className="mb-6 h-28 w-28 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-glass">
            <QingluImage
              src={QINGLU.avatar}
              alt="QingLu 轻鹭"
              className="brand-logo-img h-full w-full"
              placeholderClassName="h-28 w-28 rounded-full"
            />
          </div>

          <h1 className="text-xl font-semibold text-slate-800">{t('about.version')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('about.hackathon')}</p>

          <p className="mt-8 max-w-xs text-sm leading-relaxed text-slate-500">
            {t('about.description')}
          </p>
        </div>
      </PageTransition>
    </AppShell>
  )
}
