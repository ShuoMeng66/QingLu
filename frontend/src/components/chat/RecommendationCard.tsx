import './RecommendationCard.css'

export type RecommendationType = 'food' | 'gym'

interface RecommendationCardProps {
  type: RecommendationType
  compact?: boolean
}

const DEMO = {
  food: {
    tag: '轻食推荐',
    title: '轻食食堂',
    subtitle: '香煎鸡胸能量碗',
    tags: ['轻食', '低脂'],
    stats: [
      { label: '热量', value: '520 kcal' },
      { label: '蛋白质', value: '42g' },
    ],
    location: '天河区珠江新城花城大道 88 号',
    imageGradient: 'linear-gradient(135deg, #d4e8d0 0%, #a8c5a0 100%)',
  },
  gym: {
    tag: '推荐',
    title: 'SuperFit 健身房',
    subtitle: '器械齐全 · 24 小时营业',
    tags: ['力量训练', '近地铁'],
    stats: [
      { label: '距离', value: '650m' },
      { label: '步行', value: '约 8 分钟' },
    ],
    location: '猎德地铁站 B 出口 200m',
    imageGradient: 'linear-gradient(135deg, #c5d5dc 0%, #8ab4b1 100%)',
  },
} as const

export function RecommendationCard({ type, compact = false }: RecommendationCardProps) {
  const data = DEMO[type]

  return (
    <article className={`rec-card ${compact ? 'rec-card--compact' : ''}`}>
      <div
        className="rec-card__image"
        style={{ background: data.imageGradient }}
        aria-hidden="true"
      >
        <span className="rec-card__tag">{data.tag}</span>
      </div>
      <div className="rec-card__body">
        <div className="rec-card__head">
          <h3 className="rec-card__title">{data.title}</h3>
          <ul className="rec-card__tags">
            {data.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
        <p className="rec-card__subtitle">{data.subtitle}</p>
        <dl className="rec-card__stats">
          {data.stats.map((stat) => (
            <div key={stat.label} className="rec-card__stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="rec-card__location">{data.location}</p>
        <button type="button" className="rec-card__cta pressable">
          查看详情
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </article>
  )
}

export function RecommendationCardGrid() {
  return (
    <div className="rec-card-grid" aria-label="推荐示例">
      <RecommendationCard type="food" />
      <RecommendationCard type="gym" />
    </div>
  )
}
