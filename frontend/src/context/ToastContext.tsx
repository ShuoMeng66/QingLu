import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastViewport } from '../components/ToastViewport'
import { DEMO_RECORDING_BOOTSTRAP } from '../demoPresentation/recording'

export type ToastTone = 'default' | 'success' | 'error'

export interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 3200
const TOAST_DEDUPE_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())
  const recentRef = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id))
    const timer = timersRef.current.get(id)
    if (timer != null) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      if (DEMO_RECORDING_BOOTSTRAP) return
      const key = `${tone}:${message}`
      const now = Date.now()
      const lastShown = recentRef.current.get(key)
      if (lastShown != null && now - lastShown < TOAST_DEDUPE_MS) {
        return
      }
      recentRef.current.set(key, now)

      const id = crypto.randomUUID()
      setToasts((current) => {
        const withoutDuplicate = current.filter(
          (item) => !(item.message === message && item.tone === tone),
        )
        return [...withoutDuplicate, { id, message, tone }]
      })

      const timer = window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
      timersRef.current.set(id, timer)
    },
    [dismissToast],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
