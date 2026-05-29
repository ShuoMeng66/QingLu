import { BRAND_MARK } from '../../data/brandAssets'

interface BrandMarkProps {
  size?: number
  className?: string
  alt?: string
}

/** Official Qinglu bird mark (PNG) — favicon, headers, avatars */
export function BrandMark({ size = 36, className = '', alt = BRAND_MARK.alt }: BrandMarkProps) {
  return (
    <img
      src={BRAND_MARK.src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
    />
  )
}
