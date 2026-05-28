import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Dumbbell,
  HeartPulse,
  MapPin,
  Sparkles,
  Utensils,
  Users,
} from 'lucide-react'
import type { MessageKey } from '../lib/i18n/messages'

/** Splash / landing page carousel */
export type SplashSlideId = 'outdoor' | 'meal' | 'gym' | 'recovery'

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
    id: 'outdoor',
    src: '/images/splash/hero-outdoor-play.png',
    altKey: 'splash.heroAlt',
    objectPosition: 'center 22%',
    badges: [
      {
        icon: Activity,
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
    id: 'meal',
    src: '/images/splash/hero-healthy-meal.png',
    altKey: 'splash.heroAltFood',
    objectPosition: 'center 18%',
    badges: [
      {
        icon: Utensils,
        labelKey: 'splash.slideFood.badge1',
        tone: 'from-amber-200/45 to-orange-200/40',
      },
      {
        icon: Users,
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
    id: 'gym',
    src: '/images/splash/hero-gym-training.png',
    altKey: 'splash.heroAltDining',
    objectPosition: 'center 15%',
    badges: [
      {
        icon: Dumbbell,
        labelKey: 'splash.slideDining.badge1',
        tone: 'from-sky-200/45 to-cyan-200/40',
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
    id: 'recovery',
    src: '/images/splash/hero-recovery-stretch.png',
    altKey: 'splash.heroAltSwim',
    objectPosition: 'center 20%',
    badges: [
      {
        icon: HeartPulse,
        labelKey: 'splash.slideSwim.badge1',
        tone: 'from-rose-100/45 to-pink-100/40',
      },
      {
        icon: Activity,
        labelKey: 'splash.slideSwim.badge2',
        tone: 'from-emerald-300/35 to-green-200/40',
      },
      {
        icon: Sparkles,
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
