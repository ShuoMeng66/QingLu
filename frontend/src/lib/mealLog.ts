/** 三餐记录 · 信封提醒 · 热量估算 */

import { loadAppPreferences } from './appPreferences'
import { getMealSlotLabel } from './i18n/chatCopy'
import { translate } from './i18n/messages'
import type { AppLocale } from './appPreferences'
import type { UserProfile } from './userProfile'
import { getRemainingKcal, isProfileComplete } from './userProfile'
import { notifyUserDataChanged } from './userDataSync'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

export interface MealLogEntry {
  id: string
  slot: MealSlot
  description: string
  kcal: number
  loggedAt: number
}

export interface MealReminder {
  id: string
  slot: MealSlot
  title: string
  body: string
  createdAt: number
  dismissed: boolean
}

const LOG_KEY = 'burnpal.meal-log-v1'
const REMINDER_KEY = 'burnpal.meal-reminders-v1'
const REMINDERS_ENABLED_KEY = 'burnpal.meal-reminders-enabled'

export function areMealRemindersEnabled(): boolean {
  try {
    const raw = localStorage.getItem(REMINDERS_ENABLED_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

export function setMealRemindersEnabled(enabled: boolean) {
  localStorage.setItem(REMINDERS_ENABLED_KEY, String(enabled))
  notifyUserDataChanged()
}

export const MEAL_SLOTS: Record<
  MealSlot,
  { windowStart: number; windowEnd: number; defaultHour: number }
> = {
  breakfast: { windowStart: 7 * 60 + 30, windowEnd: 9 * 60 + 30, defaultHour: 8 },
  lunch: { windowStart: 11 * 60 + 30, windowEnd: 13 * 60 + 30, defaultHour: 12 },
  dinner: { windowStart: 17 * 60 + 30, windowEnd: 19 * 60 + 30, defaultHour: 18 },
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function loadLogs(): Record<string, MealLogEntry[]> {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as Record<string, MealLogEntry[]>) : {}
  } catch {
    return {}
  }
}

function saveLogs(data: Record<string, MealLogEntry[]>) {
  localStorage.setItem(LOG_KEY, JSON.stringify(data))
  notifyUserDataChanged()
}

export function exportAllMealLogs(): Record<string, MealLogEntry[]> {
  return loadLogs()
}

export function importAllMealLogs(data: Record<string, MealLogEntry[]>) {
  saveLogs(data ?? {})
}

function loadReminders(): MealReminder[] {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    return raw ? (JSON.parse(raw) as MealReminder[]) : []
  } catch {
    return []
  }
}

function saveReminders(items: MealReminder[]) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(items.slice(-30)))
}

export function getTodayMealLogs(): MealLogEntry[] {
  return loadLogs()[todayKey()] ?? []
}

export function getTodayConsumedKcal(): number {
  return getTodayMealLogs().reduce((sum, entry) => sum + entry.kcal, 0)
}

export function hasLoggedMealToday(slot: MealSlot): boolean {
  return getTodayMealLogs().some((entry) => entry.slot === slot)
}

/** 简易热量估算（可后续接 AI） */
export function estimateMealCalories(description: string): number {
  const text = description.trim()
  if (!text) return 0
  const rules: [RegExp, number][] = [
    [/沙拉|轻食|蔬菜/i, 320],
    [/鸡胸|牛肉|蛋白|牛排/i, 520],
    [/麻辣|火锅|烧烤/i, 780],
    [/奶茶|饮料|可乐/i, 280],
    [/面|粉|饺子/i, 550],
    [/饭|盖浇|便当/i, 620],
    [/水果|酸奶/i, 180],
  ]
  for (const [pattern, kcal] of rules) {
    if (pattern.test(text)) return kcal
  }
  return 450
}

export function logMeal(slot: MealSlot, description: string): MealLogEntry {
  const kcal = estimateMealCalories(description)
  const entry: MealLogEntry = {
    id: `meal-${Date.now()}`,
    slot,
    description: description.trim(),
    kcal,
    loggedAt: Date.now(),
  }
  const day = todayKey()
  const all = loadLogs()
  all[day] = [...(all[day] ?? []), entry]
  saveLogs(all)
  return entry
}

export function recommendNextMeal(profile: UserProfile, slot: MealSlot, locale?: AppLocale): string {
  const loc = locale ?? loadAppPreferences().locale
  const remaining = getRemainingKcal(profile, getTodayConsumedKcal())
  if (remaining <= 200) {
    return translate(loc, 'meal.recommend.low')
  }
  if (remaining <= 500) {
    return translate(loc, 'meal.recommend.medium')
  }
  if (slot === 'breakfast') {
    return translate(loc, 'meal.recommend.breakfast')
  }
  if (slot === 'lunch') {
    return translate(loc, 'meal.recommend.lunch')
  }
  return translate(loc, 'meal.recommend.dinner')
}

function minutesNow(now: Date) {
  return now.getHours() * 60 + now.getMinutes()
}

function reminderExistsToday(slot: MealSlot): boolean {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return loadReminders().some(
    (item) => item.slot === slot && item.createdAt >= start.getTime(),
  )
}

/** 在早/午/晚窗口内生成信封提醒（需完整档案） */
export function syncMealReminders(profile: UserProfile, now = new Date()): MealReminder | null {
  if (!isProfileComplete(profile)) return null

  const locale = loadAppPreferences().locale
  const mins = minutesNow(now)
  let activeSlot: MealSlot | null = null

  for (const slot of ['breakfast', 'lunch', 'dinner'] as MealSlot[]) {
    const { windowStart, windowEnd } = MEAL_SLOTS[slot]
    if (mins >= windowStart && mins <= windowEnd && !hasLoggedMealToday(slot)) {
      activeSlot = slot
      break
    }
  }

  if (!activeSlot || reminderExistsToday(activeSlot)) return null

  const slotLabel = getMealSlotLabel(locale, activeSlot)
  const remaining = getRemainingKcal(profile, getTodayConsumedKcal())
  const reminder: MealReminder = {
    id: `reminder-${activeSlot}-${todayKey()}`,
    slot: activeSlot,
    title: translate(locale, 'meal.reminderTitle', { slot: slotLabel }),
    body: translate(locale, 'meal.reminderBody', { remaining }),
    createdAt: now.getTime(),
    dismissed: false,
  }

  saveReminders([...loadReminders(), reminder])
  return reminder
}

export function dismissMealReminder(id: string) {
  saveReminders(
    loadReminders().map((item) => (item.id === id ? { ...item, dismissed: true } : item)),
  )
}

export function getActiveMealReminder(): MealReminder | null {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return (
    loadReminders()
      .filter((item) => !item.dismissed && item.createdAt >= start.getTime())
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
  )
}

export interface MealLogResult {
  entry: MealLogEntry
  consumed: number
  remaining: number
  recommendation: string
  estimateSource?: 'ai' | 'rules'
}

export function logMealWithKcal(slot: MealSlot, description: string, kcal: number): MealLogEntry {
  const entry: MealLogEntry = {
    id: `meal-${Date.now()}`,
    slot,
    description: description.trim(),
    kcal,
    loggedAt: Date.now(),
  }
  const day = todayKey()
  const all = loadLogs()
  all[day] = [...(all[day] ?? []), entry]
  saveLogs(all)
  return entry
}

export async function submitMealLogAsync(
  profile: UserProfile,
  slot: MealSlot,
  description: string,
  estimate: { kcal: number; source: 'ai' | 'rules' },
): Promise<MealLogResult> {
  const entry = logMealWithKcal(slot, description, estimate.kcal)
  const consumed = getTodayConsumedKcal()
  const remaining = getRemainingKcal(profile, consumed)
  return {
    entry,
    consumed,
    remaining,
    recommendation: recommendNextMeal(profile, slot, loadAppPreferences().locale),
    estimateSource: estimate.source,
  }
}
