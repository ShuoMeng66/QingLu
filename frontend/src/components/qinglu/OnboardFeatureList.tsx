import { ChevronRight, Dumbbell, Leaf, UserRound } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'

const FEATURES = [
  { key: 'onboard.bullet1' as const, Icon: UserRound },
  { key: 'onboard.bullet2' as const, Icon: Leaf },
  { key: 'onboard.bullet3' as const, Icon: Dumbbell },
] as const

export function OnboardFeatureList() {
  const { t } = useI18n()

  return (
    <ul className="onboard-feature-list">
      {FEATURES.map(({ key, Icon }) => (
        <li key={key}>
          <div className="onboard-feature-row" role="presentation">
            <span className="onboard-feature-row__icon" aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="onboard-feature-row__text">{t(key)}</span>
            <ChevronRight className="onboard-feature-row__chevron h-4 w-4 shrink-0" aria-hidden="true" />
          </div>
        </li>
      ))}
    </ul>
  )
}
