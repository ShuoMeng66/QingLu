import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import { buildIndoorActivityPrompt } from '../../lib/taskPrompts'
import { openPlatformListing } from '../../lib/platformLinks'
import { loadUserProfile } from '../../lib/userProfile'

const DISMISS_KEY = 'qinglu.discovery-dismissed'

interface QingluDiscoveryCardProps {
  onSendPrompt: (text: string) => void
  onDismiss?: () => void
}

export function isDiscoveryDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const { date } = JSON.parse(raw) as { date: string }
    return date === new Date().toISOString().slice(0, 10)
  } catch {
    return false
  }
}

export function dismissDiscoveryForToday() {
  localStorage.setItem(
    DISMISS_KEY,
    JSON.stringify({ date: new Date().toISOString().slice(0, 10) }),
  )
}

export function QingluDiscoveryCard({ onSendPrompt, onDismiss }: QingluDiscoveryCardProps) {
  const { t } = usePreferences()
  const profile = loadUserProfile()
  const region = useMemo(() => profile.location_city || '本地', [profile.location_city])

  if (isDiscoveryDismissed()) return null

  return (
    <motion.div
      className="qinglu-chat-column px-4 pb-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <article className="rounded-[22px] border border-sky-200/60 bg-gradient-to-br from-sky-50/95 to-lime-50/80 p-4 shadow-sm">
        <p className="text-xs font-semibold text-sky-800">{t('discovery.eyebrow')}</p>
        <p className="mt-2 text-sm leading-relaxed text-body-primary">{t('discovery.body')}</p>
        <p className="mt-2 text-xs text-body-secondary">
          {t('discovery.meta', { region })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() =>
              openPlatformListing({
                title: t('discovery.activityTitle'),
                city: region,
              })
            }
          >
            {t('discovery.view')}
          </button>
          <button
            type="button"
            className="rounded-full border border-lime-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-lime-800"
            onClick={() => onSendPrompt(buildIndoorActivityPrompt())}
          >
            {t('discovery.indoor')}
          </button>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs text-body-secondary hover:bg-black/5"
            onClick={() => {
              dismissDiscoveryForToday()
              onDismiss?.()
            }}
          >
            {t('discovery.dismiss')}
          </button>
        </div>
      </article>
    </motion.div>
  )
}
