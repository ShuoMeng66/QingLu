import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { SPLASH_CAROUSEL, SPLASH_CAROUSEL_INTERVAL_MS } from '../../data/splashAssets'
import { useI18n } from '../../hooks/useI18n'

const FLOAT = {
  animate: { y: [0, -12, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
}

const BADGE_POSITIONS = [
  'left-0 top-[12%] -translate-x-2 sm:-translate-x-6',
  'right-0 top-[42%] translate-x-2 sm:translate-x-4',
  'bottom-[8%] left-[10%]',
] as const

export function SplashHeroVisual() {
  const { t } = useI18n()
  const [index, setIndex] = useState(0)
  const slideCount = SPLASH_CAROUSEL.length
  const slide = SPLASH_CAROUSEL[index]!

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount)
    },
    [slideCount],
  )

  const goNext = useCallback(() => goTo(index + 1), [goTo, index])

  useEffect(() => {
    const timer = window.setInterval(goNext, SPLASH_CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [goNext])

  useEffect(() => {
    SPLASH_CAROUSEL.forEach((item) => {
      const img = new Image()
      img.src = item.src
    })
  }, [])

  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center px-4 py-8 lg:min-h-0 lg:px-8 lg:py-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-8 top-[8%] h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute right-[15%] bottom-[12%] h-64 w-64 rounded-full bg-emerald-200/38 blur-3xl" />
        <div className="absolute right-[35%] top-[35%] h-44 w-44 rounded-full bg-yellow-100/28 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-full w-1/2 bg-gradient-to-l from-lime-100/30 via-emerald-50/15 to-transparent" />
      </div>

      <motion.div className="relative w-full max-w-[520px]" {...FLOAT}>
        <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-emerald-200/50 via-lime-200/40 to-yellow-100/25 blur-xl" />

        <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/40 p-2 shadow-glass backdrop-blur-sm">
          <div className="relative aspect-[4/5] w-full sm:aspect-[5/6]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.img
                key={slide.id}
                src={slide.src}
                alt={t(slide.altKey)}
                className="absolute inset-0 h-full w-full rounded-[24px] object-cover object-center"
                draggable={false}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-gradient-to-t from-emerald-900/15 via-transparent to-lime-50/20" />
          </div>

          <div
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
            role="tablist"
            aria-label={t('splash.carouselLabel')}
          >
            {SPLASH_CAROUSEL.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={t(item.altKey)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-7 bg-emerald-500' : 'w-2 bg-white/70 hover:bg-white'
                }`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {slide.badges.map((badge, badgeIndex) => {
              const Icon = badge.icon
              return (
                <motion.div
                  key={`${slide.id}-${badge.labelKey}`}
                  className={`glass-panel absolute ${BADGE_POSITIONS[badgeIndex]} flex items-center gap-2 rounded-full px-3 py-2 shadow-glass`}
                  animate={{ y: [0, badgeIndex % 2 === 0 ? -6 : 6, 0] }}
                  transition={{ duration: 4 + badgeIndex, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${badge.tone} text-emerald-600`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold text-slate-700 sm:text-sm">
                    {t(badge.labelKey)}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
