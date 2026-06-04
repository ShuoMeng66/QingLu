import { motion } from 'framer-motion'
import { ChevronRight, Navigation } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { openPlatformListing } from '../../lib/platformLinks'

export interface PlatformListingCardProps {
  title: string
  subtitle?: string
  rating?: string
  tags?: string[]
  qingluTags?: string[]
  listingUrl?: string
  city?: string
  onNavigate?: () => void
}

export function PlatformListingCard({
  title,
  subtitle,
  rating,
  tags = [],
  qingluTags = [],
  listingUrl,
  city,
  onNavigate,
}: PlatformListingCardProps) {
  const { t } = useI18n()
  const displayTags = qingluTags.length > 0 ? qingluTags : tags

  return (
    <motion.div
      className="rounded-[20px] border border-emerald-200/50 bg-white/90 p-3.5 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          {rating && <p className="mt-1 text-[11px] text-slate-500">⭐ {rating}</p>}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-3 py-1.5 text-xs font-semibold text-white"
          onClick={() => openPlatformListing({ title, listingUrl, city })}
        >
          {t('platform.view')}
          <ChevronRight className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
        </button>
      </div>
      {displayTags.length > 0 && (
        <p className="mt-2 text-[10px] text-emerald-700">
          {t('platform.qingluTags')}：{displayTags.join('｜')}
        </p>
      )}
      {onNavigate && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-lime-700"
          onClick={onNavigate}
        >
          <Navigation className="h-3 w-3" aria-hidden="true" />
          {t('richCard.navigate')}
        </button>
      )}
    </motion.div>
  )
}
