import { QINGLU } from '../../data/qingluAssets'
import { useI18n } from '../../hooks/useI18n'
import { QingluImage } from './QingluImage'

export function SplashAboutSection() {
  const { t } = useI18n()

  return (
    <section id="about" className="splash-about-section relative border-t border-white/60 bg-white/75 px-5 py-16 backdrop-blur-sm sm:px-8 sm:py-20 lg:px-[clamp(2.5rem,10vw,8rem)]">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          {t('about.title')}
        </p>
        <div className="mt-6 h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 shadow-glass">
          <QingluImage
            src={QINGLU.avatar}
            alt="QingLu"
            className="brand-logo-img h-full w-full"
            placeholderClassName="h-24 w-24 rounded-full"
          />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
          {t('about.version')}
        </h2>
        <p className="mt-2 text-sm font-medium text-emerald-700">{t('about.hackathon')}</p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {t('about.description')}
        </p>
      </div>
    </section>
  )
}
