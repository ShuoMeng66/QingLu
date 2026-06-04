import { BRAND_MARK } from '../../data/brandAssets'
import { BrandMark } from './BrandMark'

interface QingluAvatarProps {
  size?: number
  className?: string
}

/** 轻鹭品牌标识（对话气泡、Agent 头像等） */
export function QingluAvatar({ size = 36, className = '' }: QingluAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white/90 shadow-glass ${className}`}
      style={{ width: size, height: size }}
      title={BRAND_MARK.alt}
    >
      <BrandMark size={Math.round(size * 0.72)} className="h-auto w-auto max-h-[85%] max-w-[85%]" />
    </div>
  )
}
