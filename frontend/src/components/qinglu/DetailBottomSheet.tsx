import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { ExternalLink, X } from 'lucide-react'

import type { NearbyPlaceKind } from '../../lib/nearbyRecommendations'

import { openSmartNavigation } from '../../lib/openMaps'
import { openPlatformListing } from '../../lib/platformLinks'

import { useI18n } from '../../hooks/useI18n'

import { useUserLocation } from '../../hooks/useUserLocation'

import type { RichCardProps } from './RichCard'

import { EmbeddedRouteMap } from './EmbeddedRouteMap'



export interface DetailSheetData extends Pick<

  RichCardProps,

  | 'title'

  | 'subtitle'

  | 'imageSrc'

  | 'placeholderImageSrc'

  | 'realFacade'

  | 'facadeSummary'

  | 'iconType'

  | 'tags'

  | 'stats'

  | 'location'

  | 'imageGradient'

  | 'tag'

  | 'rating'
  | 'listingUrl'
  | 'city'

> {

  lat?: number

  lon?: number

  kind?: NearbyPlaceKind

  sourceUrls?: string[]

}



interface DetailBottomSheetProps {

  open: boolean

  data: DetailSheetData | null

  onClose: () => void

}



function DetailFacadeImage({
  imageSrc,
  placeholderImageSrc,
  imageGradient,
  iconType,
}: {
  imageSrc?: string
  placeholderImageSrc?: string
  imageGradient?: string
  iconType?: 'food' | 'gym'
}) {
  const [failed, setFailed] = useState(false)
  const displaySrc =
    failed && placeholderImageSrc ? placeholderImageSrc : imageSrc

  if (!displaySrc) {
    return (
      <div
        className="flex h-48 w-full items-center justify-center text-5xl opacity-50"
        style={{ background: imageGradient }}
      >
        {iconType === 'gym' ? '🏋️' : iconType === 'food' ? '🥗' : '📍'}
      </div>
    )
  }

  return (
    <img
      src={displaySrc}
      alt=""
      className="h-48 w-full object-cover"
      onError={() => {
        if (placeholderImageSrc && displaySrc !== placeholderImageSrc) {
          setFailed(true)
        }
      }}
    />
  )
}

export function DetailBottomSheet({ open, data, onClose }: DetailBottomSheetProps) {

  const { t } = useI18n()

  const { location } = useUserLocation()

  const canNavigate = Boolean(data?.lat != null && data?.lon != null)

  const showFoodMacros = data?.kind === 'food'



  const foodMacroBars = [

    { label: t('detail.protein'), value: 42, color: '#34d399' },

    { label: t('detail.carbs'), value: 38, color: '#2dd4bf' },

    { label: t('detail.fat'), value: 18, color: '#fcd34d' },

    { label: t('detail.fiber'), value: 12, color: '#94a3b8' },

  ]



  const handlePlatformView = () => {
    if (!data) return
    openPlatformListing({
      title: data.title,
      listingUrl: data.listingUrl,
      city: data.city,
    })
  }

  const handleNavigate = () => {
    if (!data || data.lat == null || data.lon == null) return
    const origin =
      location != null ? { lat: location.lat, lon: location.lon } : undefined
    openSmartNavigation(data.lat, data.lon, data.title, origin, {
      country: location?.country,
      region: location?.region,
    })
  }



  return (

    <AnimatePresence>

      {open && data && (

        <>

          <motion.button

            type="button"

            className="fixed inset-0 z-50 bg-emerald-950/5 backdrop-blur-sm"

            aria-label={t('detail.closeSheet')}

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            onClick={onClose}

          />

          <motion.div

            role="dialog"

            aria-modal="true"

            aria-labelledby="detail-sheet-title"

            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] w-full flex-col rounded-t-[32px] glass-panel shadow-glass backdrop-blur-2xl"

            initial={{ y: '100%' }}

            animate={{ y: 0 }}

            exit={{ y: '100%' }}

            transition={{ type: 'spring', damping: 28, stiffness: 320 }}

          >

            <div className="relative flex shrink-0 flex-col items-center pt-3 pb-2">

              <div className="h-1 w-10 rounded-full bg-slate-300/80" aria-hidden="true" />

              <button

                type="button"

                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-slate-500 backdrop-blur-md"

                aria-label={t('detail.close')}

                onClick={onClose}

              >

                <X className="h-4 w-4" />

              </button>

            </div>



            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28">

              {canNavigate && data.lat != null && data.lon != null ? (

                <EmbeddedRouteMap

                  destination={{ lat: data.lat, lon: data.lon, label: data.title }}

                  origin={location ? { lat: location.lat, lon: location.lon } : null}

                />

              ) : (

                <div className="overflow-hidden rounded-[24px]">

                  <DetailFacadeImage

                    imageSrc={data.imageSrc}

                    placeholderImageSrc={data.placeholderImageSrc}

                    imageGradient={data.imageGradient}

                    iconType={data.iconType}

                  />

                </div>

              )}



              <h2 id="detail-sheet-title" className="mt-4 text-xl font-semibold text-slate-800">

                {data.title}

              </h2>

              {data.realFacade && (

                <p className="mt-2 text-xs font-medium text-emerald-500">{t('richCard.realFacade')}</p>

              )}

              {data.facadeSummary && (

                <p className="mt-2 text-sm leading-relaxed text-slate-600">{data.facadeSummary}</p>

              )}

              {data.subtitle && (

                <p className="mt-1 text-sm leading-relaxed text-slate-500">{data.subtitle}</p>

              )}

              {data.sourceUrls && data.sourceUrls.length > 0 && (

                <div className="mt-3">

                  <p className="text-xs font-medium text-slate-500">{t('detail.facadeSources')}</p>

                  <ul className="mt-1 space-y-1">

                    {data.sourceUrls.slice(0, 3).map((url) => (

                      <li key={url}>

                        <a

                          href={url}

                          target="_blank"

                          rel="noopener noreferrer"

                          className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:underline"

                        >

                          <ExternalLink className="h-3 w-3" aria-hidden="true" />

                          {new URL(url).hostname}

                        </a>

                      </li>

                    ))}

                  </ul>

                </div>

              )}

              {data.location && <p className="mt-2 text-xs text-slate-500">{data.location}</p>}



              {showFoodMacros && (

                <section className="mt-6" aria-label={t('detail.nutrition')}>

                  <div className="mb-2 flex items-center justify-between gap-2">

                    <h3 className="text-sm font-semibold text-slate-800">{t('detail.nutrition')}</h3>

                    <span className="text-[10px] text-slate-400">{t('detail.nutritionHint')}</span>

                  </div>

                  <div className="mt-3 space-y-3">

                    {foodMacroBars.map((bar) => (

                      <div key={bar.label}>

                        <div className="mb-1 flex justify-between text-xs text-slate-500">

                          <span>{bar.label}</span>

                          <span>{bar.value}g</span>

                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/50">

                          <motion.div

                            className="h-full rounded-full"

                            style={{ backgroundColor: bar.color }}

                            initial={{ width: 0 }}

                            animate={{ width: `${bar.value}%` }}

                            transition={{ duration: 0.6, delay: 0.1 }}

                          />

                        </div>

                      </div>

                    ))}

                  </div>

                </section>

              )}



              {data.kind === 'gym' && (

                <p className="mt-6 rounded-2xl bg-white/50 px-3 py-2 text-xs leading-relaxed text-slate-500">

                  {t('detail.gymHint')}

                </p>

              )}



              {data.kind === 'recovery' && (

                <p className="mt-6 rounded-2xl bg-white/50 px-3 py-2 text-xs leading-relaxed text-slate-500">

                  {t('detail.recoveryHint')}

                </p>

              )}



              {data.stats && data.stats.length > 0 && (

                <dl className="mt-6 grid grid-cols-2 gap-3">

                  {data.stats.map((stat) => (

                    <div

                      key={stat.label}

                      className="glass-panel rounded-[16px] px-3 py-2 shadow-glass"

                    >

                      <dt className="text-xs text-slate-500">{stat.label}</dt>

                      <dd className="text-sm font-semibold text-slate-800">{stat.value}</dd>

                    </div>

                  ))}

                </dl>

              )}

            </div>



            <div className="absolute inset-x-0 bottom-0 border-t border-white/80 bg-white/60 px-5 pb-6 pt-4 backdrop-blur-2xl">

              <motion.button

                type="button"

                className="btn-vitality flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold"

                whileTap={{ scale: 0.97 }}

                onClick={handlePlatformView}

              >

                <ExternalLink className="h-4 w-4" aria-hidden="true" />

                {t('platform.view')}

              </motion.button>

              {canNavigate && (

                <button

                  type="button"

                  className="mt-2 w-full text-center text-sm font-medium text-lime-700 underline"

                  onClick={handleNavigate}

                >

                  {t('detail.navigate')}

                </button>

              )}

            </div>

          </motion.div>

        </>

      )}

    </AnimatePresence>

  )

}


