import { motion } from 'framer-motion'
import { Dumbbell, Leaf, Salad, Users } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { getQuickActions } from '../../lib/i18n/chatCopy'

const ICONS = {
  eat: Salad,
  train: Dumbbell,
  recover: Leaf,
  move: Users,
} as const

export interface QuickActionPreview {
  id: string
  hint?: string
}

interface QuickActionBarProps {
  disabled?: boolean
  previews?: QuickActionPreview[]
  onSelect: (prompt: string) => void
}

export function QuickActionBar({
  disabled = false,
  previews = [],
  onSelect,
}: QuickActionBarProps) {
  const { locale, t } = useI18n()
  const actions = getQuickActions(locale)
  const hintById = Object.fromEntries(previews.map((item) => [item.id, item.hint]))

  return (
    <div className="grid grid-cols-4 gap-2 px-1 py-2" role="group" aria-label="快捷操作">
      {actions.map((action) => {
        const Icon = ICONS[action.id] ?? Salad
        const hint = hintById[action.id]

        return (
          <motion.button
            key={action.id}
            type="button"
            disabled={disabled}
            className="glass-panel flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] px-2 py-3 text-center shadow-glass transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-40"
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(action.prompt)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-emerald-400">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="w-full truncate text-xs font-semibold text-slate-700">
              {action.label}
            </span>
            {hint ? (
              <span className="line-clamp-2 w-full text-[10px] leading-snug text-emerald-400">
                {hint}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">{t('quick.defaultHint')}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
