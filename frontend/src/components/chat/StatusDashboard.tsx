import { BRAND, PLACEHOLDER_STATUS } from '../../copy/ui'
import { QINGLU } from '../../data/qingluAssets'
import './StatusDashboard.css'

export function StatusDashboard() {
  const cards = [
    PLACEHOLDER_STATUS.calories,
    PLACEHOLDER_STATUS.training,
    PLACEHOLDER_STATUS.location,
  ] as const

  return (
    <section className="status-dashboard" aria-label="今日状态">
      {cards.map((card) => (
        <article key={card.label} className="status-card">
          <div className="status-card__head">
            <span className="status-card__icon" aria-hidden="true">
              {card.icon}
            </span>
            <span className="status-card__label">{card.label}</span>
          </div>
          <p className="status-card__value">{card.value}</p>
          {'weather' in card && card.weather && (
            <p className="status-card__meta">{card.weather}</p>
          )}
        </article>
      ))}
    </section>
  )
}

export function ChatHeroHeader() {
  return (
    <header className="chat-hero">
      <div className="chat-hero__skyline" aria-hidden="true" />
      <div className="chat-hero__content">
        <div className="chat-hero__brand">
          <h1 className="chat-hero__title">{BRAND.name}</h1>
          <p className="chat-hero__tagline">{BRAND.tagline}</p>
        </div>
        <img
          src={QINGLU.hero}
          alt={QINGLU.name}
          className="chat-hero__character"
          width={120}
          height={160}
        />
      </div>
    </header>
  )
}
