import { QUICK_ACTIONS } from '../../copy/ui'
import './QuickActionChips.css'

interface QuickActionChipsProps {
  disabled?: boolean
  onSelect: (prompt: string) => void
}

export function QuickActionChips({ disabled = false, onSelect }: QuickActionChipsProps) {
  return (
    <div className="quick-actions" role="group" aria-label="快捷操作">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="quick-action-chip pressable"
          disabled={disabled}
          onClick={() => onSelect(action.prompt)}
        >
          <span className="quick-action-chip__icon" aria-hidden="true">
            {action.icon}
          </span>
          <span className="quick-action-chip__label">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
