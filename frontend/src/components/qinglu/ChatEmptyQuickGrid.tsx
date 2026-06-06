import { motion } from 'framer-motion'
import { Dumbbell, Leaf, Salad, ShoppingBag, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { getQuickActions } from '../../lib/i18n/chatCopy'
import { buildTaskPrompt, type TaskSceneType } from '../../lib/taskPrompts'

const ICONS = {
  takeout: ShoppingBag,
  eat: Salad,
  train: Dumbbell,
  recover: Leaf,
  move: Users,
} as const

interface ChatEmptyQuickGridProps {
  disabled?: boolean
  onSelect: (prompt: string, scene?: TaskSceneType) => void
}

export function ChatEmptyQuickGrid({ disabled = false, onSelect }: ChatEmptyQuickGridProps) {
  const { locale, t } = useI18n()
  const eatPrompt = useMemo(
    () => getQuickActions(locale).find((action) => action.id === 'eat')?.prompt ?? '',
    [locale],
  )

  const items = useMemo(
    () =>
      [
        {
          id: 'takeout' as const,
          label: t('today.task.takeout.title'),
          hint: t('today.task.takeout.cta'),
          prompt: buildTaskPrompt('takeout'),
          scene: 'takeout' as TaskSceneType,
        },
        {
          id: 'eat' as const,
          label: t('quick.eat.label'),
          hint: t('quick.defaultHint'),
          prompt: eatPrompt,
        },
        {
          id: 'train' as const,
          label: t('today.task.train.title'),
          hint: t('today.task.train.cta'),
          prompt: buildTaskPrompt('train'),
          scene: 'train' as TaskSceneType,
        },
        {
          id: 'recover' as const,
          label: t('today.task.recover.title'),
          hint: t('today.task.recover.cta'),
          prompt: buildTaskPrompt('recover'),
          scene: 'recover' as TaskSceneType,
        },
        {
          id: 'move' as const,
          label: t('today.task.move.title'),
          hint: t('today.task.move.cta'),
          prompt: buildTaskPrompt('move'),
          scene: 'move' as TaskSceneType,
        },
      ] as const,
    [eatPrompt, t],
  )

  return (
    <div
      className="chat-empty-quick-grid grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3"
      role="group"
      aria-label={t('chat.emptyTitle')}
    >
      {items.map((item) => {
        const Icon = ICONS[item.id]
        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={disabled}
            className="quick-action-card glass-panel flex min-h-[7.5rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[20px] px-2 py-3 text-center shadow-glass transition-[transform,opacity] duration-200 hover:-translate-y-0.5 disabled:opacity-40 sm:min-h-[8rem]"
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            onClick={() => onSelect(item.prompt, 'scene' in item ? item.scene : undefined)}
          >
            <span className="quick-action-icon flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-lime-600">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="quick-action-label w-full truncate text-xs font-semibold text-body-primary">
              {item.label}
            </span>
            <span className="line-clamp-2 w-full text-[10px] leading-snug text-body-secondary">
              {item.hint}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
