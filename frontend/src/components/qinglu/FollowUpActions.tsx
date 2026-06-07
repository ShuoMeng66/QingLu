import { motion } from 'framer-motion'
import { pickFollowUpIcon } from '../../lib/followUpIcon'
import type { FollowUpActionMeta } from '../../types/openclaw'

interface FollowUpActionsProps {
  actions: FollowUpActionMeta[]
  disabled?: boolean
  onAction: (action: FollowUpActionMeta) => void
}

export function FollowUpActions({ actions, disabled, onAction }: FollowUpActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="follow-up-actions">
      {actions.map((action) => {
        const Icon = pickFollowUpIcon(action)
        return (
          <motion.button
            key={`${action.label}-${action.message ?? ''}`}
            type="button"
            disabled={disabled}
            className="follow-up-chip"
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction(action)}
          >
            <span className="follow-up-chip__icon" aria-hidden="true">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="follow-up-chip__label">{action.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
