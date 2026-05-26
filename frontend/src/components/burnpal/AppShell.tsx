import type { ReactNode } from 'react'
import { VitalityMeshBackground } from './VitalityMeshBackground'

interface AppShellProps {
  children: ReactNode
  className?: string
  /** Allow page-level vertical scroll (landing, auth, settings). Chat keeps fixed viewport. */
  scrollable?: boolean
}

/** Full-viewport shell · fluid mesh background + glass UI */
export function AppShell({ children, className = '', scrollable = false }: AppShellProps) {
  return (
    <>
      <VitalityMeshBackground />
      <div
        className={`relative z-0 flex w-full flex-col ${
          scrollable
            ? 'min-h-dvh overflow-x-hidden overflow-y-auto'
            : 'h-dvh overflow-hidden'
        } ${className}`}
      >
        {children}
      </div>
    </>
  )
}

/** @deprecated 使用 AppShell */
export const MobileFrame = AppShell
