import { motion } from 'framer-motion'
import type { FollowUpActionMeta } from '../../types/openclaw'

interface FollowUpActionsProps {
  actions: FollowUpActionMeta[]
  disabled?: boolean
  onAction: (action: FollowUpActionMeta) => void
}

export function FollowUpActions({ actions, disabled, onAction }: FollowUpActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="mb-3 mt-2 flex flex-wrap gap-2 pl-14 pr-2">
      {actions.map((action) => (
        <motion.button
          key={`${action.label}-${action.message ?? ''}`}
          type="button"
          disabled={disabled}
          className="rounded-full border border-lime-200/90 bg-white/85 px-3 py-1.5 text-xs font-medium text-lime-900 shadow-sm transition-colors hover:border-lime-300 hover:bg-lime-50 disabled:opacity-50 dark:border-lime-900/40 dark:bg-slate-900/70 dark:text-lime-100"
          whileTap={{ scale: 0.97 }}
          onClick={() => onAction(action)}
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  )
}
