import type { LucideIcon } from 'lucide-react'
import { Dumbbell, MapPin, Sparkles, Utensils, UtensilsCrossed, Waves } from 'lucide-react'
import type { MessageKey } from '../lib/i18n/messages'

/** Splash / landing page carousel */
export type SplashSlideId = 'volleyball' | 'food' | 'dining' | 'swim'

export interface SplashCarouselSlide {
  id: SplashSlideId
  src: string
  altKey: MessageKey
  /** Tailwind object-position utility suffix, e.g. `center 20%` */
  objectPosition?: string
  badges: Array<{
    icon: LucideIcon
    labelKey: MessageKey
    tone: string
  }>
}

export const SPLASH_CAROUSEL: SplashCarouselSlide[] = [
  {
    id: 'volleyball',
    src: '/images/splash/volleyball-hero.png',
    altKey: 'splash.heroAlt',
    objectPosition: 'center 20%',
    badges: [
      {
        icon: Dumbbell,
        labelKey: 'splash.badge1',
        tone: 'from-emerald-300/35 to-green-200/40',
      },
      {
        icon: MapPin,
        labelKey: 'splash.badge2',
        tone: 'from-lime-200/40 to-emerald-200/35',
      },
      {
        icon: Sparkles,
        labelKey: 'splash.badge3',
        tone: 'from-lime-200/45 to-yellow-100/35',
      },
    ],
  },
  {
    id: 'food',
    src: '/images/splash/hero-night-market.png',
    altKey: 'splash.heroAltFood',
    badges: [
      {
        icon: Utensils,
        labelKey: 'splash.slideFood.badge1',
        tone: 'from-amber-200/45 to-orange-200/40',
      },
      {
        icon: MapPin,
        labelKey: 'splash.slideFood.badge2',
        tone: 'from-lime-200/40 to-emerald-200/35',
      },
      {
        icon: Sparkles,
        labelKey: 'splash.slideFood.badge3',
        tone: 'from-lime-200/45 to-yellow-100/35',
      },
    ],
  },
  {
    id: 'dining',
    src: '/images/splash/hero-fine-dining.png',
    altKey: 'splash.heroAltDining',
    badges: [
      {
        icon: UtensilsCrossed,
        labelKey: 'splash.slideDining.badge1',
        tone: 'from-rose-100/45 to-amber-100/40',
      },
      {
        icon: Sparkles,
        labelKey: 'splash.slideDining.badge2',
        tone: 'from-emerald-200/40 to-lime-200/35',
      },
      {
        icon: MapPin,
        labelKey: 'splash.slideDining.badge3',
        tone: 'from-lime-200/45 to-emerald-100/35',
      },
    ],
  },
  {
    id: 'swim',
    src: '/images/splash/hero-swimming.png',
    altKey: 'splash.heroAltSwim',
    badges: [
      {
        icon: Waves,
        labelKey: 'splash.slideSwim.badge1',
        tone: 'from-sky-200/45 to-cyan-200/40',
      },
      {
        icon: Dumbbell,
        labelKey: 'splash.slideSwim.badge2',
        tone: 'from-emerald-300/35 to-green-200/40',
      },
      {
        icon: MapPin,
        labelKey: 'splash.slideSwim.badge3',
        tone: 'from-lime-200/40 to-emerald-200/35',
      },
    ],
  },
]

/** 单张停留时长（含叠化过渡） */
export const SPLASH_CAROUSEL_INTERVAL_MS = 6_800

/** 图片/徽章叠化时长（秒） */
export const SPLASH_CROSSFADE_SEC = 1.35
