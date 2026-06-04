import { Pencil } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { usePreferences } from '../../context/PreferencesContext'
import { loadTodaySnapshot } from '../../lib/todaySnapshot'
import { isProfileComplete } from '../../lib/userProfile'

interface TodayStatusBarProps {
  onEdit: () => void
  onSetupProfile?: () => void
}

export function TodayStatusBar({ onEdit, onSetupProfile }: TodayStatusBarProps) {
  const { userProfile } = useAppContext()
  const { t } = usePreferences()
  const today = loadTodaySnapshot()
  const complete = isProfileComplete(userProfile)

  if (!complete) {
    return (
      <div className="qinglu-chat-column px-5 pb-2 pt-1">
        <button
          type="button"
          className="w-full rounded-[18px] border border-lime-400/40 bg-lime-50/90 px-4 py-3 text-left text-sm text-body-primary"
          onClick={onSetupProfile}
        >
          {t('dashboard.setupTitle')} — {t('dashboard.setupHint')}
        </button>
      </div>
    )
  }

  const name = userProfile.nickname || t('today.defaultName')
  const remaining = today.remaining_kcal ?? '—'
  const train = today.training_plan || '—'
  const loc = today.location_label || userProfile.location_city || '—'
  const status = today.body_status || t('today.bodyNormal')

  return (
    <div className="qinglu-chat-column px-5 pb-2 pt-1">
      <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-lime-400/30 bg-white/70 px-3 py-2.5 text-xs shadow-sm backdrop-blur-sm">
        <span className="font-semibold text-body-primary">
          {t('today.statusLabel', { name })}
        </span>
        <span className="text-body-secondary">
          {remaining} kcal {t('today.remaining')}｜{train}｜{loc}｜{status}
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold text-lime-700 hover:bg-lime-50"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          {t('today.edit')}
        </button>
      </div>
    </div>
  )
}
