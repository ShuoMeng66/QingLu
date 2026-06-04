import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { getTodayTasks, type TodayTaskDefinition } from '../../lib/i18n/chatCopy'
import { buildTaskPrompt, type TaskSceneType } from '../../lib/taskPrompts'
import { loadTodaySnapshot } from '../../lib/todaySnapshot'
import { loadUserProfile } from '../../lib/userProfile'

/** 首屏展示的四宫格任务（并排紧凑卡片） */
const GRID_TASK_IDS: TaskSceneType[] = ['takeout', 'gathering', 'train', 'recover']

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

  const tasks = useMemo(
    () =>
      getTodayTasks(locale, context).filter((task) =>
        GRID_TASK_IDS.includes(task.id),
      ),
    [locale, context],
  )

  return (
    <div className="qinglu-chat-column flex min-h-0 flex-1 flex-col px-4 pb-3">
      <header className="mb-4 text-left">
        <h2 className="font-display-serif text-xl font-semibold text-body-primary sm:text-2xl">
          {t('today.tasksTitle')}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-body-secondary">
          {t('today.tasksSubtitle')}
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2.5">
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
    <motion.button
      type="button"
      disabled={disabled}
      className="glass-panel flex min-h-[9.5rem] min-w-0 flex-col rounded-[20px] p-3.5 text-left shadow-glass transition-colors hover:border-lime-200/80 disabled:opacity-40 sm:min-h-[8.5rem] sm:p-3"
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onRun}
    >
      <h3 className="text-sm font-semibold leading-snug text-body-primary">{task.title}</h3>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-body-secondary line-clamp-2 sm:line-clamp-3">
        {task.description}
      </p>
      <span className="mt-2.5 inline-flex rounded-full bg-lime-50 px-2 py-1 text-xs font-semibold leading-none text-emerald-700">
        {task.cta}
      </span>
    </motion.button>
  )
}
