import { useI18n } from '../../hooks/useI18n'
import { BrandMark } from './BrandMark'

interface QingluLogoProps {
  compact?: boolean
  iconOnly?: boolean
  enlargeText?: boolean
}

export function QingluLogo({
  compact = false,
  iconOnly = false,
  enlargeText = false,
}: QingluLogoProps) {
  const { t } = useI18n()

  const iconBox = enlargeText ? 'h-10 w-10 sm:h-11 sm:w-11' : 'h-9 w-9'
  const iconPx = enlargeText ? 44 : 36

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex ${iconBox} shrink-0 overflow-hidden rounded-full bg-white shadow-glass`}
        aria-hidden={iconOnly ? undefined : true}
      >
        <BrandMark size={iconPx} fit="cover" className="h-full w-full" />
      </span>
      {!iconOnly && (
        <div className="min-w-0">
          <p
            className={`font-semibold leading-tight text-body-primary ${
              enlargeText ? 'text-lg sm:text-xl' : 'text-sm'
            }`}
          >
            QingLu 轻鹭
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
