import type { AppLocale } from './i18n/localeIds'
import {
  getCommonAreaOptions,
  getDietaryCustomOptions,
  getDietStrategyOptions,
  getFoodRestrictionOptions,
  getTastePreferenceOptions,
} from './healthProfileOptions'

const STORED_ALIASES: Record<string, string> = {
  near_company: '公司附近',
  near_work: '公司附近',
  offal: '内脏',
  light: '清淡',
}

const TRAINING_SESSION_LABELS: Record<string, string> = {
  light_exercise: '轻度运动',
  strength: '力量训练',
  mixed: '综合训练',
}

export function resolveTrainingSessionLabel(value?: string): string {
  if (!value?.trim()) return '今日训练'
  const key = value.trim()
  return TRAINING_SESSION_LABELS[key] ?? key
}

export function labelsFromStored(
  values: string[] | undefined,
  options: { id?: string; value: string; label: string }[],
  locale: AppLocale = 'zh',
): string[] {
  if (!values?.length) return []

  const pools = [
    ...getDietStrategyOptions(locale),
    ...getTastePreferenceOptions(locale),
    ...getFoodRestrictionOptions(locale),
    ...getDietaryCustomOptions(locale),
    ...getCommonAreaOptions(locale),
    ...options,
  ]

  return values
    .map((raw) => {
      const v = raw.trim()
      if (!v) return ''
      const hit = pools.find((o) => o.id === v || o.value === v || o.label === v)
      return hit?.label ?? STORED_ALIASES[v] ?? v
    })
    .filter(Boolean)
}
