import { BRAND, EMPTY_STATE, FOCUS_PILLARS } from '../copy/ui'
import { QINGLU } from '../data/qingluAssets'
import type { ConversationStarter } from '../types/icebreaker'
const CARD_VISUAL: Record<string, { className: string; icon: string }> = {
  numeric: { className: 'starter-card__visual--orange', icon: '热' },
  meal: { className: 'starter-card__visual--lemon', icon: '食' },
  workout: { className: 'starter-card__visual--green', icon: '动' },
  habit: { className: 'starter-card__visual--sky', icon: '习' },
}

interface ChatEmptyStateProps {
  centered?: boolean
  connected: boolean
  loading: boolean
  starters: ConversationStarter[]
  onStarterSelect: (starter: ConversationStarter) => void
}

export function ChatEmptyState({
  centered = false,
  connected,
  loading,
  starters,
  onStarterSelect,
}: ChatEmptyStateProps) {
  const disabled = !connected || loading

  return (
    <div className={`chat-empty ${centered ? 'chat-empty--centered' : ''}`}>
      <header className="vitality-hero">
        <div className="vitality-hero__mark" aria-hidden="true">
          <img src={QINGLU.avatar} alt="" className="vitality-hero__avatar" />
        </div>
        <div className="vitality-hero__copy">
          <p className="vitality-hero__tagline">{BRAND.tagline}</p>
          <h2 className="vitality-hero__title">{EMPTY_STATE.title}</h2>
          <p className="vitality-hero__lead">{EMPTY_STATE.lead}</p>
        </div>
      </header>

      <section className="today-strip" aria-label={EMPTY_STATE.todayLabel}>
        <p className="today-strip__label text-label">{EMPTY_STATE.todayLabel}</p>
        <ul className="today-strip__chips">
          {FOCUS_PILLARS.map((pillar) => (
            <li key={pillar.id}>
              <div className={`today-chip today-chip--${pillar.id}`}>
                <span className="today-chip__icon" aria-hidden="true">
                  {pillar.icon}
                </span>
                <div className="today-chip__text">
                  <strong>{pillar.label}</strong>
                  <span>{pillar.hint}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="starter-rail" aria-label={EMPTY_STATE.startersLabel}>
        <p className="starter-rail__label text-label">{EMPTY_STATE.startersLabel}</p>
        <ul className="starter-rail__track">
          {starters.map((starter) => {
            const visual = CARD_VISUAL[starter.diversityAxis] ?? CARD_VISUAL.workout
            return (
              <li key={starter.id} className="starter-rail__item">
                <button
                  type="button"
                  className="starter-card pressable"
                  disabled={disabled}
                  onClick={() => onStarterSelect(starter)}
                >
                  <span
                    className={`starter-card__visual ${visual.className}`}
                    aria-hidden="true"
                  >
                    <span className="starter-card__icon">{visual.icon}</span>
                    <span className="starter-card__tag">{starter.tag}</span>
                  </span>
                  <span className="starter-card__body">
                    <strong>{starter.title}</strong>
                    <span>{starter.subtitle}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
