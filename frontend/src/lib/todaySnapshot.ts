import { notifyUserDataChanged } from './userDataSync'

export interface TodaySnapshot {
  remaining_kcal?: number
  training_plan?: string
  location_label?: string
  body_status?: string
  special_note?: string
}

const STORAGE_KEY = 'qinglu.today-snapshot-v1'

export const EMPTY_TODAY_SNAPSHOT: TodaySnapshot = {
  body_status: '正常',
}

export function loadTodaySnapshot(): TodaySnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_TODAY_SNAPSHOT }
    return { ...EMPTY_TODAY_SNAPSHOT, ...(JSON.parse(raw) as TodaySnapshot) }
  } catch {
    return { ...EMPTY_TODAY_SNAPSHOT }
  }
}

export function saveTodaySnapshot(patch: Partial<TodaySnapshot>): TodaySnapshot {
  const next = { ...loadTodaySnapshot(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}

export function replaceTodaySnapshot(snapshot: TodaySnapshot): TodaySnapshot {
  const next = { ...EMPTY_TODAY_SNAPSHOT, ...snapshot }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  notifyUserDataChanged()
  return next
}
