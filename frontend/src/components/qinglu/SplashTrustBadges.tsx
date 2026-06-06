import { Cloud, Lock, Shield } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'

const TRUST_ITEMS = [
  { icon: Shield, titleKey: 'splash.trust1Title' as const, descKey: 'splash.trust1Desc' as const },
  { icon: Lock, titleKey: 'splash.trust2Title' as const, descKey: 'splash.trust2Desc' as const },
  { icon: Cloud, titleKey: 'splash.trust3Title' as const, descKey: 'splash.trust3Desc' as const },
]

export function SplashTrustBadges() {
  const { t } = useI18n()

  return (
    <ul className="splash-trust-badges mt-8 grid gap-4 sm:grid-cols-3">
      {TRUST_ITEMS.map(({ icon: Icon, titleKey, descKey }) => (
        <li key={titleKey} className="splash-trust-badge flex items-start gap-2.5">
          <span className="splash-trust-badge__icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-emerald-600 shadow-sm">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-slate-700">{t(titleKey)}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{t(descKey)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
