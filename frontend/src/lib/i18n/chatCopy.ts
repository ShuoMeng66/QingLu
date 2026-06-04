import { VALID_LOCALES, type AppLocale } from './localeIds'
import type { MessageKey } from './messages'
import { translate } from './messages'
import type { MealSlot } from '../mealLog'
import type { FitnessGoal } from '../userProfile'
import type { TaskSceneType } from '../taskPrompts'

export interface TodayTaskDefinition {
  id: TaskSceneType
  title: string
  description: string
  cta: string
}

export function getTodayTasks(
  locale: AppLocale,
  context: { remainingKcal: number; trainingPlan: string },
): TodayTaskDefinition[] {
  const ids: TaskSceneType[] = ['takeout', 'gathering', 'train', 'recover', 'move']
  return ids.map((id) => ({
    id,
    title: translate(locale, `today.task.${id}.title` as MessageKey),
    description: translate(locale, `today.task.${id}.desc` as MessageKey, {
      remaining: context.remainingKcal,
      training: context.trainingPlan,
    }),
    cta: translate(locale, `today.task.${id}.cta` as MessageKey),
  }))
}

export interface LocalizedQuickAction {
  id: 'eat' | 'train' | 'recover' | 'move'
  label: string
  prompt: string
}

export function getQuickActions(locale: AppLocale): LocalizedQuickAction[] {
  return [
    {
      id: 'eat',
      label: translate(locale, 'quick.eat.label'),
      prompt: translate(locale, 'quick.eat.prompt'),
    },
    {
      id: 'train',
      label: translate(locale, 'quick.train.label'),
      prompt: translate(locale, 'quick.train.prompt'),
    },
    {
      id: 'recover',
      label: translate(locale, 'quick.recover.label'),
      prompt: translate(locale, 'quick.recover.prompt'),
    },
    {
      id: 'move',
      label: translate(locale, 'quick.move.label'),
      prompt: translate(locale, 'quick.move.prompt'),
    },
  ]
}

export function buildLocaleReplyInstruction(locale: AppLocale): string {
  const instructions: Record<AppLocale, string> = {
    zh: '请使用简体中文回复用户。',
    'zh-HK':
      '請用香港書面粵語回覆（用嘅、唔、冇、喺、佢、嚟、點樣等；可用嘅士、軟件、設定等港式詞彙）。',
    'zh-TW': '請使用台灣繁體中文回覆用戶（台式用詞，如計程車、軟體、設定）。',
    en: 'Reply to the user in English.',
    ja: 'ユーザーには日本語で回答してください。',
    ko: '사용자에게 한국어로 답변하세요.',
  }
  return instructions[locale]
}

export function getMealSlotLabel(locale: AppLocale, slot: MealSlot): string {
  return translate(locale, `meal.slot.${slot}` as MessageKey)
}

export function getDefaultConversationTitle(locale: AppLocale): string {
  return translate(locale, 'chat.defaultTitle')
}

function buildDefaultTitleValues(): Set<string> {
  const values = new Set(
    VALID_LOCALES.map((locale) => getDefaultConversationTitle(locale)),
  )
  values.add('新对话')
  return values
}

let defaultTitleValues: Set<string> | null = null

function getDefaultTitleValues(): Set<string> {
  if (!defaultTitleValues) defaultTitleValues = buildDefaultTitleValues()
  return defaultTitleValues
}

export function isDefaultConversationTitle(title: string): boolean {
  return getDefaultTitleValues().has(title)
}

export function displayConversationTitle(title: string, locale: AppLocale): string {
  return isDefaultConversationTitle(title) ? getDefaultConversationTitle(locale) : title
}

export function getGoalOptions(locale: AppLocale): { id: FitnessGoal; label: string }[] {
  return [
    { id: 'fat_loss', label: translate(locale, 'goal.fat_loss') },
    { id: 'muscle_gain', label: translate(locale, 'goal.muscle_gain') },
    { id: 'maintain', label: translate(locale, 'goal.maintain') },
  ]
}

export const CUISINE_OPTION_IDS = [
  'sichuan',
  'light',
  'japanese',
  'cantonese',
  'western',
  'vegetarian',
] as const

export const AVOID_OPTION_IDS = ['organ', 'fried', 'sugar', 'alcohol'] as const

const CUISINE_STORAGE: Record<(typeof CUISINE_OPTION_IDS)[number], string> = {
  sichuan: '川菜',
  light: '轻食',
  japanese: '日料',
  cantonese: '粤菜',
  western: '西餐',
  vegetarian: '素食',
}

const AVOID_STORAGE: Record<(typeof AVOID_OPTION_IDS)[number], string> = {
  organ: '内脏',
  fried: '油炸',
  sugar: '高糖',
  alcohol: '酒精',
}

export function getCuisineOptions(locale: AppLocale): { value: string; label: string }[] {
  return CUISINE_OPTION_IDS.map((id) => ({
    value: CUISINE_STORAGE[id],
    label: translate(locale, `cuisine.${id}` as MessageKey),
  }))
}

export function getAvoidOptions(locale: AppLocale): { value: string; label: string }[] {
  return AVOID_OPTION_IDS.map((id) => ({
    value: AVOID_STORAGE[id],
    label: translate(locale, `avoid.${id}` as MessageKey),
  }))
}

export function locationSourceLabel(locale: AppLocale, source: 'gps' | 'ip'): string {
  return translate(locale, source === 'gps' ? 'settings.locationSourceGps' : 'settings.locationSourceIp')
}

export type { MessageKey }
