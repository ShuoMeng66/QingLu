import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ExternalLink } from 'lucide-react'
import { openPlatformListing } from '../../lib/platformLinks'
import { useI18n } from '../../hooks/useI18n'
import { ActionTags } from './ActionTags'

export interface TakeoutBullet {
  label: string
  value: string
}

export interface TakeoutVenueCardProps {
  title: string
  titleLink?: boolean
  galleryImages?: string[]
  intro?: string
  bullets?: TakeoutBullet[]
  tags?: string[]
  listingUrl?: string
  city?: string
  onDetail?: () => void
}

const BUBBLE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }

export function TakeoutVenueCard({
  title,
  titleLink = true,
  galleryImages = [],
  intro,
  bullets = [],
  tags = [],
  listingUrl,
  city,
  onDetail,
}: TakeoutVenueCardProps) {
  const { t } = useI18n()
  const images = galleryImages.length > 0 ? galleryImages.slice(0, 3) : []
  const [failed, setFailed] = useState<Record<number, boolean>>({})

  return (
    <motion.article
      className="w-full overflow-hidden rounded-[24px] glass-panel transition-transform duration-300 hover:-translate-y-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={BUBBLE_SPRING}
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          {titleLink ? (
            <button
              type="button"
              className="text-left text-base font-semibold text-sky-600 underline-offset-2 hover:underline"
              onClick={() => openPlatformListing({ title, listingUrl, city })}
            >
              {title}
            </button>
          ) : (
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          )}
          <motion.button
            type="button"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-3 py-1.5 text-xs font-semibold text-white shadow-glow-emerald"
            whileTap={{ scale: 0.97 }}
            onClick={() => openPlatformListing({ title, listingUrl, city })}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {t('platform.view')}
          </motion.button>
        </div>

        {tags.length > 0 && <ActionTags tags={tags} className="mt-0" />}

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-emerald-50"
              >
                {!failed[index] ? (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setFailed((prev) => ({ ...prev, [index]: true }))}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl opacity-40">🥗</div>
                )}
              </div>
            ))}
          </div>
        )}

        {intro && (
          <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
        )}

        {bullets.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm text-slate-700">
            {bullets.map((item) => (
              <li key={item.label} className="leading-snug">
                <span className="font-semibold text-slate-800">{item.label}：</span>
                {item.value}
              </li>
            ))}
          </ul>
        )}

        {onDetail && (
          <motion.button
            type="button"
            className="inline-flex items-center gap-0.5 self-start text-xs font-semibold text-emerald-500"
            whileTap={{ scale: 0.97 }}
            onClick={onDetail}
          >
            {t('richCard.viewDetail')}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.button>
        )}
      </div>
    </motion.article>
  )
}
