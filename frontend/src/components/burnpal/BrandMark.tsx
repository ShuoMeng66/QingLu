import { BRAND_MARK } from '../../data/brandAssets'

interface BrandMarkProps {
  size?: number
  className?: string
  alt?: string
  /** cover fills circular slots without square white corners showing */
  fit?: 'contain' | 'cover'
}

/** Official Qinglu bird mark (PNG) — favicon, headers, avatars */
export function BrandMark({
  size = 36,
  className = '',
  alt = BRAND_MARK.alt,
  fit = 'cover',
}: BrandMarkProps) {
  const fitClass =
    fit === 'cover' ? 'object-cover scale-[1.14]' : 'object-contain'

  return (
    <img
      src={BRAND_MARK.src}
      alt={alt}
      width={size}
      height={size}
      className={`${fitClass} ${className}`.trim()}
      draggable={false}
    />
  )
}
