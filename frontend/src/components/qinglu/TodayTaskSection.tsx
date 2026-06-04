import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { getTodayTasks, type TodayTaskDefinition } from '../../lib/i18n/chatCopy'
import { buildTaskPrompt, type TaskSceneType } from '../../lib/taskPrompts'
import { loadTodaySnapshot } from '../../lib/todaySnapshot'
import { loadUserProfile } from '../../lib/userProfile'

interface TodayTaskSectionProps {
  disabled?: boolean
  onRunTask: (prompt: string, scene: TaskSceneType) => void
}

export function TodayTaskSection({ disabled = false, onRunTask }: TodayTaskSectionProps) {
  const { locale, t } = useI18n()
  const profile = loadUserProfile()
  const today = loadTodaySnapshot()

  const context = useMemo(
    () => ({
      remainingKcal: today.remaining_kcal ?? 650,
      trainingPlan: today.training_plan ?? profile.training?.next_session ?? '今日训练',
    }),
    [today.remaining_kcal, today.training_plan, profile.training?.next_session],
  )

  const tasks = getTodayTasks(locale, context)

  return (
    <div className="qinglu-chat-column flex min-h-0 flex-1 flex-col px-4 pb-4">
      <header className="mb-4 text-left">
        <h2 className="font-display-serif text-2xl font-semibold text-body-primary sm:text-3xl">
          {t('today.tasksTitle')}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-body-secondary">{t('today.tasksSubtitle')}</p>
      </header>
      <div className="qinglu-scroll-hidden flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
        {tasks.map((task) => (
          <TodayTaskCard
            key={task.id}
            task={task}
            disabled={disabled}
            onRun={() => onRunTask(buildTaskPrompt(task.id), task.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TodayTaskCard({
  task,
  disabled,
  onRun,
}: {
  task: TodayTaskDefinition
  disabled: boolean
  onRun: () => void
}) {
  return (
    <motion.article
      className="glass-panel rounded-[22px] p-4 shadow-glass"
      whileTap={{ scale: disabled ? 1 : 0.99 }}
    >
      <h3 className="text-base font-semibold text-body-primary">{task.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-body-secondary">{task.description}</p>
      <motion.button
        type="button"
        disabled={disabled}
        className="btn-vitality mt-4 w-full rounded-full py-2.5 text-sm font-semibold disabled:opacity-40"
        onClick={onRun}
      >
        {task.cta}
      </motion.button>
    </motion.article>
  )
}
