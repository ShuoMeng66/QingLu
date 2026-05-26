import { useI18n } from '../../hooks/useI18n'

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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 text-emerald-400 shadow-glass backdrop-blur-md"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 3c-1.2 2.2-3.4 3.8-3.4 6.8 0 2.2 1.4 3.9 3.4 4.7 2-.8 3.4-2.5 3.4-4.7C15.4 6.8 13.2 5.2 12 3zm-6.5 8.2c2.1.3 3.8 1.6 4.8 3.5-1.8 1.2-3 3.2-3.2 5.5-2.3-.5-4.1-2.2-4.8-4.5 1.5-1.2 2.6-2.9 3.2-4.5zm13 0c.6 1.6 1.7 3.3 3.2 4.5-.7 2.3-2.5 4-4.8 4.5-.2-2.3-1.4-4.3-3.2-5.5 1-1.9 2.7-3.2 4.8-3.5z" />
        </svg>
      </span>
      {!iconOnly && (
        <div className="min-w-0">
          <p
            className={`font-semibold leading-tight text-[#1F2937] ${
              enlargeText ? 'text-base' : 'text-sm'
            }`}
          >
            BurnPal 轻鹭
          </p>
          {!compact && (
            <p
              className={`truncate text-gray-600 ${enlargeText ? 'text-sm' : 'text-xs'}`}
            >
              {t('brand.tagline')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
