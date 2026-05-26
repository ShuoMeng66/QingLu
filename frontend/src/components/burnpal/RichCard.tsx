import { motion } from 'framer-motion'
import { ChevronRight, Star } from 'lucide-react'
import { ActionTags } from './ActionTags'

import { useI18n } from '../../hooks/useI18n'

export interface RichCardProps {
  imageSrc?: string
  imageGradient?: string
  iconType?: 'food' | 'gym'
  tag?: string
  title: string
  subtitle?: string
  rating?: string
  tags?: string[]
  stats?: Array<{ label: string; value: string }>
  location?: string
  onDetail?: () => void
}

const ICON_BY_TYPE = {
  food: '🥗',
  gym: '🏋️',
} as const

const BUBBLE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

export function RichCard({
  imageSrc,
  imageGradient = 'linear-gradient(155deg, #ecfdf5 0%, #ccfbf1 100%)',
  iconType,
  tag,
  title,
  subtitle,
  rating,
  tags = [],
  stats = [],
  location,
  onDetail,
}: RichCardProps) {
  const { t } = useI18n()

  return (
    <motion.article
      className="w-full overflow-hidden rounded-[24px] glass-panel transition-transform duration-300 hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={BUBBLE_SPRING}
    >
      <div className="flex gap-0">
        <div
          className="relative flex min-h-[120px] w-[38%] shrink-0 items-center justify-center overflow-hidden"
          style={{ background: imageSrc ? undefined : imageGradient }}
        >
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl opacity-50" aria-hidden="true">
              {iconType ? ICON_BY_TYPE[iconType] : '📍'}
            </span>
          )}
          {tag && (
            <span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shadow-glass">
              {tag}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3.5">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              {rating && (
                <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-slate-500">
                  <Star className="h-3 w-3 fill-[#E6A893] text-[#E6A893]" aria-hidden="true" />
                  {rating}
                </span>
              )}
            </div>
            <ActionTags tags={tags} className="mt-2" />
          </div>
          {subtitle && <p className="text-xs leading-relaxed text-slate-500">{subtitle}</p>}
          {stats.length > 0 && (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-slate-500">{stat.label}</dt>
                  <dd className="font-semibold text-slate-800">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {location && <p className="truncate text-[10px] text-slate-500">{location}</p>}
          <div className="mt-auto border-t border-white/60 pt-2">
            <motion.button
              type="button"
              className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400"
              whileTap={{ scale: 0.97 }}
              onClick={onDetail}
            >
              {t('richCard.viewDetail')}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
