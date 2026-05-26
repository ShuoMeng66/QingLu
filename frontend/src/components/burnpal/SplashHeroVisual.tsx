import { motion } from 'framer-motion'
import { Dumbbell, MapPin, Sparkles } from 'lucide-react'
import { SPLASH } from '../../data/splashAssets'
import { useI18n } from '../../hooks/useI18n'

const FLOAT = {
  animate: { y: [0, -12, 0] },
  transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
}

export function SplashHeroVisual() {
  const { t } = useI18n()

  const badges = [
    { icon: Dumbbell, label: t('splash.badge1'), tone: 'from-emerald-300/35 to-green-200/40' },
    { icon: MapPin, label: t('splash.badge2'), tone: 'from-lime-200/40 to-emerald-200/35' },
    { icon: Sparkles, label: t('splash.badge3'), tone: 'from-lime-200/45 to-yellow-100/35' },
  ] as const

  return (
    <div className="relative flex h-full min-h-[320px] w-full items-center justify-center px-4 py-8 lg:min-h-0 lg:px-8 lg:py-0">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -right-8 top-[8%] h-56 w-56 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="absolute right-[15%] bottom-[12%] h-64 w-64 rounded-full bg-emerald-200/38 blur-3xl" />
        <div className="absolute right-[35%] top-[35%] h-44 w-44 rounded-full bg-yellow-100/28 blur-2xl" />
        <div className="absolute right-0 top-1/2 h-full w-1/2 bg-gradient-to-l from-lime-100/30 via-emerald-50/15 to-transparent" />
      </div>

      <motion.div
        className="relative w-full max-w-[520px]"
        {...FLOAT}
      >
        <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-emerald-200/50 via-lime-200/40 to-yellow-100/25 blur-xl" />

        <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white/40 p-2 shadow-glass backdrop-blur-sm">
          <img
            src={SPLASH.volleyballHero}
            alt={t('splash.heroAlt')}
            className="aspect-[4/5] w-full rounded-[24px] object-cover object-[center_20%] sm:aspect-[5/6]"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-2 rounded-[24px] bg-gradient-to-t from-emerald-900/10 via-transparent to-lime-50/20" />
        </div>

        {badges.map((badge, index) => {
          const Icon = badge.icon
          const positions = [
            'left-0 top-[12%] -translate-x-2 sm:-translate-x-6',
            'right-0 top-[42%] translate-x-2 sm:translate-x-4',
            'bottom-[8%] left-[10%]',
          ] as const
          return (
            <motion.div
              key={badge.label}
              className={`glass-panel absolute ${positions[index]} flex items-center gap-2 rounded-full px-3 py-2 shadow-glass`}
              animate={{ y: [0, index % 2 === 0 ? -6 : 6, 0] }}
              transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${badge.tone} text-emerald-600`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-slate-700 sm:text-sm">
                {badge.label}
              </span>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
