import type { ToastItem } from '../context/ToastContext'

interface ToastViewportProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((item) => (
        <div key={item.id} className={`toast toast--${item.tone}`} role="status">
          <span>{item.message}</span>
          <button
            type="button"
            className="toast__close pressable"
            aria-label="关闭通知"
            onClick={() => onDismiss(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
