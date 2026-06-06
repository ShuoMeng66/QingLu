import { useI18n } from '../../hooks/useI18n'

/** Landing hero headline with locale-aware emphasis on key phrases. */
export function SplashHeadline() {
  const { locale, t } = useI18n()

  if (locale === 'zh') {
    return (
      <h1 className="splash-hero-title font-display-serif font-bold text-slate-800">
        <span className="splash-hero-headline splash-hero-headline--line1 block">
          <span className="splash-hero-sparkle" aria-hidden="true" />
          让<span className="splash-hero-kw-primary">减脂</span>融入
        </span>
        <span className="splash-hero-headline splash-hero-headline--offset splash-hero-headline--line2 block">
          每一次<span className="splash-hero-kw-secondary">生活选择</span>
        </span>
      </h1>
    )
  }

  if (locale === 'zh-TW' || locale === 'zh-HK') {
    return (
      <h1 className="splash-hero-title font-display-serif font-bold text-slate-800">
        <span className="splash-hero-headline splash-hero-headline--line1 block">
          <span className="splash-hero-sparkle" aria-hidden="true" />
          {t('splash.headline1')}
        </span>
        <span className="splash-hero-headline splash-hero-headline--offset splash-hero-headline--line2 block">
          {t('splash.headline2')}
        </span>
      </h1>
    )
  }

  return (
    <h1 className="splash-hero-title font-display-serif font-bold text-slate-800">
      <span className="splash-hero-headline splash-hero-headline--line1 block">
        <span className="splash-hero-sparkle" aria-hidden="true" />
        {t('splash.headline1')}
      </span>
      <span className="splash-hero-headline splash-hero-headline--offset splash-hero-headline--line2 block">
        {t('splash.headline2')}
      </span>
    </h1>
  )
}
