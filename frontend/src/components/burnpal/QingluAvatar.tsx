import { QINGLU } from '../../data/qingluAssets'

interface QingluAvatarProps {
  size?: number
  className?: string
}

/** 轻鹭 · 二次元头像（仅用于对话气泡等 UI 锚点） */
export function QingluAvatar({ size = 36, className = '' }: QingluAvatarProps) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full ring-2 ring-white/90 shadow-glass ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={QINGLU.avatar}
        alt="轻鹭"
        className="h-full w-full object-cover object-[center_28%] scale-[1.15]"
        draggable={false}
      />
    </div>
  )
}
