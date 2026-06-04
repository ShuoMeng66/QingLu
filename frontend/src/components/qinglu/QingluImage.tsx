import { useState } from 'react'

interface QingluImageProps {
  src: string
  alt: string
  className?: string
  placeholderClassName?: string
}

export function QingluImage({
  src,
  alt,
  className = '',
  placeholderClassName = '',
}: QingluImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-emerald-100/80 to-teal-100/60 ${placeholderClassName}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-5xl opacity-60" aria-hidden="true">
          🕊
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
