import { useI18n } from '../../hooks/useI18n'
import { BrandMark } from './BrandMark'

interface BurnPalLogoProps {
  compact?: boolean
  iconOnly?: boolean
  enlargeText?: boolean
}

export function BurnPalLogo({
  compact = false,
  iconOnly = false,
  enlargeText = false,
}: BurnPalLogoProps) {
  const { t } = useI18n()

  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 p-1 shadow-glass backdrop-blur-md"
        aria-hidden={iconOnly ? undefined : true}
      >
        <BrandMark size={32} className="h-full w-full" />
      </span>
      {!iconOnly && (
        <div className="min-w-0">
          <p
            className={`font-semibold leading-tight text-body-primary ${
              enlargeText ? 'text-base' : 'text-sm'
            }`}
          >
            BurnPal 轻鹭
          </p>
          {!compact && (
            <p
              className={`truncate text-body-secondary ${enlargeText ? 'text-sm' : 'text-xs'}`}
            >
              {t('brand.tagline')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
