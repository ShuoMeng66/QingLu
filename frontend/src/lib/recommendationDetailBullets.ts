import type { TakeoutBullet } from '../components/qinglu/TakeoutVenueCard'

function asString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function joinWarnings(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((w) => typeof w === 'string' && w.trim()).join('；')
  }
  return asString(value)
}

function primaryItemLabel(sceneType: string): string {
  if (/takeout/i.test(sceneType)) return '推荐组合'
  if (/dining|restaurant|gathering/i.test(sceneType)) return '适合点'
  if (/venue|gym|class|pilates|yoga/i.test(sceneType)) return '适合目标'
  if (/recovery|service/i.test(sceneType)) return '适合选'
  if (/activity|move/i.test(sceneType)) return '适合人群'
  return '推荐'
}

function primaryItemValue(rec: Record<string, unknown>, sceneType: string): string {
  if (/takeout/i.test(sceneType)) {
    return (
      asString(rec.combo_name) ||
      asString(rec.signature_dishes) ||
      asString(rec.suitable_dishes)
    )
  }
  if (/dining|restaurant|gathering/i.test(sceneType)) {
    return asString(rec.suitable_dishes) || asString(rec.combo_name)
  }
  if (/venue|gym|class|pilates|yoga/i.test(sceneType)) {
    return asString(rec.goals) || asString(rec.suitable_classes)
  }
  if (/recovery|service/i.test(sceneType)) {
    return asString(rec.suitable_services) || asString(rec.suitable_scenarios)
  }
  if (/activity|move/i.test(sceneType)) {
    return asString(rec.suitable_audience)
  }
  return (
    asString(rec.combo_name) ||
    asString(rec.suitable_dishes) ||
    asString(rec.goals) ||
    asString(rec.suitable_services) ||
    asString(rec.suitable_audience)
  )
}

function formatKcal(rec: Record<string, unknown>): string {
  const kcalRange = asString(rec.kcal_range)
  if (kcalRange) {
    return kcalRange.includes('kcal') ? kcalRange : `约 ${kcalRange} kcal`
  }
  const estimated = rec.estimated_kcal
  if (typeof estimated === 'number' && Number.isFinite(estimated)) {
    return `约 ${estimated} kcal`
  }
  const kcal = rec.kcal
  if (typeof kcal === 'number' && Number.isFinite(kcal)) {
    return `约 ${kcal} kcal`
  }
  return ''
}

function kcalLabel(sceneType: string): string {
  return /activity|move/i.test(sceneType) ? '预估消耗' : '预估热量'
}

function formatPrice(rec: Record<string, unknown>): string {
  const price = asString(rec.price)
  if (price) {
    return price.includes('¥') ? price : price
  }
  const avgYuan = asString(rec.avg_price_yuan)
  if (avgYuan) {
    return avgYuan.includes('¥') ? avgYuan : `约 ¥${avgYuan}`
  }
  const avgPrice = rec.avg_price
  if (avgPrice != null && String(avgPrice).trim()) {
    const text = String(avgPrice).trim()
    return text.includes('¥') ? text : `约 ¥${text}`
  }
  return ''
}

function priceLabel(sceneType: string): string {
  if (/takeout/i.test(sceneType)) return '价格'
  if (/dining|restaurant|gathering/i.test(sceneType)) return '人均'
  return '价格'
}

export function hasRecommendationDetailFields(rec: Record<string, unknown>): boolean {
  const platform = rec.platform_card as Record<string, unknown> | undefined
  return Boolean(
    asString(rec.combo_name) ||
      asString(rec.signature_dishes) ||
      asString(rec.suitable_dishes) ||
      asString(rec.goals) ||
      asString(rec.suitable_classes) ||
      asString(rec.suitable_services) ||
      asString(rec.suitable_scenarios) ||
      asString(rec.suitable_audience) ||
      asString(rec.kcal_range) ||
      (typeof rec.estimated_kcal === 'number' && Number.isFinite(rec.estimated_kcal)) ||
      (typeof rec.kcal === 'number' && Number.isFinite(rec.kcal)) ||
      asString(rec.price) ||
      asString(rec.avg_price_yuan) ||
      (rec.avg_price != null && String(rec.avg_price).trim()) ||
      asString(rec.recommendation_reason) ||
      asString(rec.reason) ||
      joinWarnings(rec.warnings) ||
      asString(rec.intensity) ||
      asString(platform?.meta),
  )
}

export function buildRecommendationBullets(
  rec: Record<string, unknown>,
  sceneType: string,
  extras?: {
    comboName?: string
    proteinG?: unknown
    address?: string
  },
): TakeoutBullet[] {
  const platform = rec.platform_card as Record<string, unknown> | undefined
  const platformMeta = asString(platform?.meta)

  const primary =
    extras?.comboName?.trim() ||
    primaryItemValue(rec, sceneType)
  const kcal = formatKcal(rec)
  const price = formatPrice(rec)
  const reason =
    asString(rec.recommendation_reason) || asString(rec.reason)
  const warnings = joinWarnings(rec.warnings)
  const intensity = asString(rec.intensity)
  const protein = extras?.proteinG
  const address = extras?.address?.trim() ?? ''

  const bullets: TakeoutBullet[] = []

  if (primary) bullets.push({ label: primaryItemLabel(sceneType), value: primary })
  if (kcal) bullets.push({ label: kcalLabel(sceneType), value: kcal })
  if (price) bullets.push({ label: priceLabel(sceneType), value: price })
  if (intensity && !/takeout|dining|restaurant|gathering/i.test(sceneType)) {
    bullets.push({ label: '强度', value: intensity })
  }
  if (reason) bullets.push({ label: '推荐理由', value: reason })
  if (protein != null && String(protein).trim()) {
    bullets.push({ label: '蛋白质', value: `约 ${protein} g` })
  }
  if (warnings) bullets.push({ label: '避雷', value: warnings })
  if (platformMeta) bullets.push({ label: '参考', value: platformMeta })
  if (address) bullets.push({ label: '地址/配送', value: address })

  return bullets
}
