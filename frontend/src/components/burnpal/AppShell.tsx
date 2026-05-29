import type { ReactNode } from 'react'
import { VitalityMeshBackground } from './VitalityMeshBackground'

interface AppShellProps {
  children: ReactNode
  className?: string
  /** Allow page-level vertical scroll (landing, auth, settings). Chat keeps fixed viewport. */
  scrollable?: boolean
  /** Show animated mint mesh behind content (off on splash when using a photo background). */
  showMesh?: boolean
}

/** Full-viewport shell · fluid mesh background + glass UI */
export function AppShell({
  children,
  className = '',
  scrollable = false,
  showMesh = true,
}: AppShellProps) {
  return (
    <>
      {showMesh && <VitalityMeshBackground />}
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
