import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

/** Lightweight page wrapper — no exit fade (avoids black screen on back navigation) */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`flex min-h-dvh flex-1 flex-col ${className}`}>
      {children}
    </div>
  )
}
