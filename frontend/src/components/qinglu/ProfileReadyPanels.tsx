import {
  Activity,
  Ban,
  BarChart3,
  Dumbbell,
  Heart,
  MapPin,
  ShoppingBag,
  Sparkles,
  Target,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ProfileReadyTagGroups } from '../../lib/profileReady'
import type { UserProfile } from '../../lib/userProfile'
import type { TodaySnapshot } from '../../lib/todaySnapshot'
import { useI18n } from '../../hooks/useI18n'

function ProfileReadyCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <section className="profile-ready-card glass-panel rounded-[22px] p-4 shadow-glass sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-body-primary">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-100 text-lime-700">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function TagList({ tags, variant = 'default' }: { tags: string[]; variant?: 'default' | 'warn' }) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={
            variant === 'warn'
              ? 'profile-ready-tag profile-ready-tag--warn'
              : 'profile-ready-tag'
          }
        >
          {tag}
        </span>
      ))}
    </div>
  )
}

function SummaryRow({
  icon: Icon,
  label,
  tags,
  variant = 'default',
}: {
  icon: LucideIcon
  label: string
  tags: string[]
  variant?: 'default' | 'warn'
}) {
  return (
    <div className="profile-ready-row">
      <span className="profile-ready-row__icon text-lime-600" aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span className="profile-ready-row__label text-body-secondary">{label}</span>
      <TagList tags={tags} variant={variant} />
    </div>
  )
}

export function ProfileSummaryCard({ tags }: { tags: ProfileReadyTagGroups }) {
  const { t } = useI18n()
  return (
    <ProfileReadyCard icon={Heart} title={t('ready.summaryTitle')}>
      <SummaryRow icon={Target} label={t('ready.rowGoal')} tags={[tags.goalLabel]} />
      <SummaryRow icon={Utensils} label={t('ready.rowDiet')} tags={tags.dietTags} />
      <SummaryRow
        icon={Ban}
        label={t('ready.rowAvoid')}
        tags={tags.avoidTags}
        variant="warn"
      />
      <SummaryRow icon={MapPin} label={t('ready.rowRegion')} tags={tags.regionTags} />
    </ProfileReadyCard>
  )
}

export function ProfileHelpCard() {
  const { t } = useI18n()
  const items = [
    { icon: ShoppingBag, title: t('ready.helpTakeoutTitle'), desc: t('ready.helpTakeoutDesc') },
    { icon: Dumbbell, title: t('ready.helpTrainTitle'), desc: t('ready.helpTrainDesc') },
    { icon: Activity, title: t('ready.helpRecoverTitle'), desc: t('ready.helpRecoverDesc') },
  ]

  return (
    <ProfileReadyCard icon={Sparkles} title={t('ready.helpTitle')}>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-50 text-lime-700">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-body-primary">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-body-secondary">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </ProfileReadyCard>
  )
}

export function ProfileTodayCard({
  profile,
  today,
  regionFallback,
}: {
  profile: UserProfile
  today: TodaySnapshot
  regionFallback: string
}) {
  const { t } = useI18n()
  const remaining = today.remaining_kcal ?? profile.daily_targets?.kcal ?? '—'
  const training = today.training_plan ?? profile.training?.typical_session ?? '—'
  const location = today.location_label ?? regionFallback
  const body = today.body_status ?? t('today.bodyNormal')

  const rows = [
    { label: t('ready.rowRemaining'), value: `${remaining} kcal`, highlight: true },
    { label: t('ready.rowTraining'), value: training },
    { label: t('ready.rowLocation'), value: location },
    { label: t('ready.rowBody'), value: body },
  ]

  return (
    <ProfileReadyCard icon={BarChart3} title={t('ready.todayTitle')}>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="profile-ready-today-row">
            <span className="text-sm text-body-secondary">{row.label}</span>
            <span
              className={
                row.highlight
                  ? 'text-base font-bold text-body-primary'
                  : 'text-sm font-medium text-body-primary'
              }
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </ProfileReadyCard>
  )
}

export function ProfilePrioritiesCard({ priorities }: { priorities: string[] }) {
  const { t } = useI18n()
  return (
    <section className="profile-ready-card glass-panel mt-4 rounded-[22px] p-4 shadow-glass sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-body-primary">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-100 text-lime-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        {t('ready.prioritiesTitle')}
      </h2>
      <ol className="profile-ready-priorities mt-4">
        {priorities.map((item, index) => (
          <li key={item} className="profile-ready-priority-item">
            <span className="profile-ready-priority-num" aria-hidden="true">
              {index + 1}
            </span>
            <p className="text-xs leading-relaxed text-body-secondary sm:text-sm">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ProfileReadyActions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel: string
  onSecondary: () => void
}) {
  return (
    <div className="profile-ready-actions mt-8">
      <button
        type="button"
        className="btn-vitality w-full rounded-full py-4 text-base font-semibold"
        onClick={onPrimary}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        className="mt-4 w-full text-center text-sm text-body-secondary hover:text-lime-800"
        onClick={onSecondary}
      >
        {secondaryLabel}
      </button>
    </div>
  )
}
