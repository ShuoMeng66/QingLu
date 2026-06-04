import type { DetailSheetData } from '../components/qinglu/DetailBottomSheet'
import type { TakeoutBullet } from '../components/qinglu/TakeoutVenueCard'
import { QINGLU_VENUES, type QingluVenueRecord } from '../data/qingluVenues.generated'
import { QINGLU_TAKEOUT, type QingluTakeoutRecord } from '../data/qingluTakeout.generated'

const TAKEOUT_GALLERY = [
  '/images/splash/hero-healthy-meal.png',
  '/images/splash/hero-gym-training.png',
  '/images/splash/hero-recovery-stretch.png',
] as const

function normalizeName(value: string): string {
  return value
    .replace(/[（(].*?[）)]/g, '')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()
}

export function findTakeoutById(id: string): QingluTakeoutRecord | undefined {
  const key = id.trim().toLowerCase()
  return QINGLU_TAKEOUT.find((row) => row.id.toLowerCase() === key)
}

export function findTakeoutByName(name: string): QingluTakeoutRecord | undefined {
  const core = normalizeName(name)
  if (!core) return undefined
  return QINGLU_TAKEOUT.find((row) => {
    const rowCore = normalizeName(row.name)
    return rowCore === core || rowCore.includes(core) || core.includes(rowCore)
  })
}

export function findVenueForTakeout(takeout: QingluTakeoutRecord): QingluVenueRecord | undefined {
  return QINGLU_VENUES.find((v) => v.id === takeout.id && v.type === 'takeout')
}

function pickCombo(
  takeout: QingluTakeoutRecord,
  comboName?: string,
): QingluTakeoutRecord['combos'][number] | undefined {
  if (!comboName?.trim()) return takeout.combos[0]
  const key = comboName.trim()
  return (
    takeout.combos.find((c) => c.name === key || c.name.includes(key) || key.includes(c.name)) ??
    takeout.combos[0]
  )
}

function venueImageSrc(venue: QingluVenueRecord | undefined): string {
  if (!venue) return TAKEOUT_GALLERY[0]
  const key = `${venue.cuisine} ${venue.name} ${venue.type}`
  if (/火锅|烧烤/.test(key)) return TAKEOUT_GALLERY[2]
  if (/轻食|沙拉|FOODBOWL|牛油果/i.test(key)) return TAKEOUT_GALLERY[0]
  return TAKEOUT_GALLERY[1]
}

export function buildTakeoutDetailCard(
  rec: Record<string, unknown>,
  venue?: QingluVenueRecord | null,
): DetailSheetData | null {
  const itemId =
    typeof rec.item_id === 'string'
      ? rec.item_id
      : typeof rec.store_id === 'string'
        ? rec.store_id
        : undefined
  const storeName =
    typeof rec.store_name === 'string'
      ? rec.store_name
      : typeof rec.restaurant_name === 'string'
        ? rec.restaurant_name
        : typeof rec.name === 'string'
          ? rec.name
          : ''

  const takeout =
    (itemId ? findTakeoutById(itemId) : undefined) ??
    (storeName ? findTakeoutByName(storeName) : undefined)

  if (!takeout && !storeName.trim()) return null

  const matchedVenue = takeout ? findVenueForTakeout(takeout) : venue ?? undefined
  const title = takeout?.name ?? storeName.trim()
  const combo = takeout ? pickCombo(takeout, typeof rec.combo_name === 'string' ? rec.combo_name : undefined) : undefined

  const intro =
    typeof rec.intro === 'string' && rec.intro.trim()
      ? rec.intro.trim()
      : typeof rec.highlight === 'string' && rec.highlight.trim()
        ? rec.highlight.trim()
        : undefined

  const reason =
    typeof rec.reason === 'string' && rec.reason.trim()
      ? rec.reason.trim()
      : typeof rec.recommendation_reason === 'string'
        ? rec.recommendation_reason.trim()
        : ''

  const signature =
    typeof rec.signature_dishes === 'string'
      ? rec.signature_dishes
      : typeof rec.combo_name === 'string' && rec.combo_name.trim()
        ? rec.combo_name
        : combo?.name ?? ''

  const avgPrice =
    rec.avg_price ?? rec.avg_price_yuan ?? takeout?.avg_price_yuan ?? matchedVenue?.avgPrice
  const kcal =
    rec.kcal_range ??
    rec.estimated_kcal ??
    combo?.kcal_range ??
    (typeof rec.kcal === 'number' ? String(rec.kcal) : undefined)
  const protein = rec.protein_g ?? combo?.protein_g
  const warningsRaw = rec.warnings ?? combo?.warnings
  const warnings = Array.isArray(warningsRaw)
    ? warningsRaw.filter((w) => typeof w === 'string').join('；')
    : typeof warningsRaw === 'string'
      ? warningsRaw
      : ''

  const address =
    typeof rec.address === 'string' && rec.address.trim()
      ? rec.address.trim()
      : typeof rec.delivery_note === 'string' && rec.delivery_note.trim()
        ? rec.delivery_note.trim()
        : matchedVenue?.address || takeout?.area || matchedVenue?.area || ''

  const bullets: TakeoutBullet[] = []
  if (reason) bullets.push({ label: '推荐理由', value: reason })
  if (signature) bullets.push({ label: '招牌菜/套餐', value: String(signature) })
  if (avgPrice != null && String(avgPrice).trim()) {
    bullets.push({ label: '人均', value: `约 ¥${avgPrice}` })
  }
  if (kcal != null && String(kcal).trim()) {
    const kcalText = String(kcal).includes('kcal') ? String(kcal) : `约 ${kcal} kcal`
    bullets.push({ label: '热量', value: kcalText })
  }
  if (protein != null && String(protein).trim()) {
    bullets.push({ label: '蛋白质', value: `约 ${protein} g` })
  }
  if (warnings) bullets.push({ label: '避雷', value: warnings })
  if (address) bullets.push({ label: '地址/配送', value: address })

  const platform = rec.platform_card as Record<string, unknown> | undefined
  const listingUrl =
    typeof platform?.url === 'string' && platform.url ? platform.url : matchedVenue?.listingUrl
  const searchKeyword =
    typeof platform?.search_keyword === 'string' ? platform.search_keyword : undefined

  const hero = venueImageSrc(matchedVenue)
  const galleryImages = TAKEOUT_GALLERY.map((src, i) => (i === 0 ? hero : src))

  return {
    cardLayout: 'takeout',
    kind: 'food',
    tag: '外卖推荐',
    title,
    titleLink: true,
    intro,
    bullets,
    galleryImages,
    subtitle: reason || intro,
    tags: combo?.tags?.slice(0, 3) ?? [],
    stats: [],
    location: address,
    imageSrc: hero,
    placeholderImageSrc: TAKEOUT_GALLERY[0],
    iconType: 'food',
    listingUrl: listingUrl ?? undefined,
    city: takeout?.area?.split('·')[0] ?? matchedVenue?.area?.split('·')[0],
    rating: takeout?.rating != null ? String(takeout.rating) : matchedVenue?.rating != null ? String(matchedVenue.rating) : undefined,
    imageGradient: 'linear-gradient(135deg, #dbeafe 0%, #99f6e4 100%)',
    _geocodeQuery: searchKeyword ?? `${title} ${takeout?.area ?? ''}`.trim(),
    _venueId: takeout?.id ?? matchedVenue?.id,
  } as DetailSheetData & { _geocodeQuery?: string; _venueId?: string }
}
