import type { AppLocale } from './appPreferences'
import { translate } from './i18n/messages'
import { notifyUserDataChanged } from './userDataSync'

export type YiqidongMode = 'off' | 'casual' | 'scheduled'

export type ScheduleRepeat = 'daily' | 'weekly' | 'interval' | 'custom'

export interface YiqidongSchedule {
  times: string[]
  repeat: ScheduleRepeat
  days: string[]
  intervalDays: number
}

export interface YiqidongCasual {
  maxPerDay: number
}

export interface YiqidongConfig {
  mode: YiqidongMode
  schedule: YiqidongSchedule
  casual: YiqidongCasual
}

const STORAGE_KEY = 'xiaozhua.yiqidong.config'

export const WEEKDAY_OPTIONS = [
  { id: 'mon', label: '一' },
  { id: 'tue', label: '二' },
  { id: 'wed', label: '三' },
  { id: 'thu', label: '四' },
  { id: 'fri', label: '五' },
  { id: 'sat', label: '六' },
  { id: 'sun', label: '日' },
] as const

export const REPEAT_OPTIONS: { id: ScheduleRepeat; label: string }[] = [
  { id: 'daily', label: '每天' },
  { id: 'weekly', label: '每周' },
  { id: 'interval', label: '每 N 天' },
  { id: 'custom', label: '指定星期' },
]

export const DEFAULT_YIQIDONG_CONFIG: YiqidongConfig = {
  mode: 'off',
  schedule: {
    times: ['09:00'],
    repeat: 'daily',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    intervalDays: 1,
  },
  casual: {
    maxPerDay: 1,
  },
}

const DAY_LABEL: Record<string, string> = {
  mon: '周一',
  tue: '周二',
  wed: '周三',
  thu: '周四',
  fri: '周五',
  sat: '周六',
  sun: '周日',
}

export function loadYiqidongConfig(): YiqidongConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_YIQIDONG_CONFIG }
    const parsed = JSON.parse(raw) as Partial<YiqidongConfig>
    return {
      mode: parsed.mode ?? 'off',
      schedule: {
        ...DEFAULT_YIQIDONG_CONFIG.schedule,
        ...parsed.schedule,
        times: parsed.schedule?.times?.length ? parsed.schedule.times : ['09:00'],
      },
      casual: {
        ...DEFAULT_YIQIDONG_CONFIG.casual,
        ...parsed.casual,
      },
    }
  } catch {
    return { ...DEFAULT_YIQIDONG_CONFIG }
  }
}

export function saveYiqidongConfig(config: YiqidongConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  notifyUserDataChanged()
}

export function describeYiqidongConfig(config: YiqidongConfig, locale?: AppLocale): string {
  const loc = locale ?? 'zh'
  if (config.mode === 'off') return translate(loc, 'yiqidong.describe.off')
  if (config.mode === 'casual') {
    return translate(loc, 'yiqidong.describe.casual', { count: config.casual.maxPerDay })
  }

  const timeText = config.schedule.times.join('、')
  switch (config.schedule.repeat) {
    case 'daily':
      return translate(loc, 'yiqidong.describe.daily', { times: timeText })
    case 'weekly':
      return translate(loc, 'yiqidong.describe.weekly', { times: timeText })
    case 'interval':
      return translate(loc, 'yiqidong.describe.interval', {
        days: config.schedule.intervalDays,
        times: timeText,
      })
    case 'custom': {
      const days = config.schedule.days
        .map((day) => translate(loc, `yiqidong.weekday.${day}` as Parameters<typeof translate>[1]))
        .join('、')
      return translate(loc, 'yiqidong.describe.custom', { days, times: timeText })
    }
    default:
      return translate(loc, 'yiqidong.describe.fallback', { times: timeText })
  }
}

function describeRepeat(config: YiqidongSchedule): string {
  switch (config.repeat) {
    case 'daily':
      return '每天'
    case 'weekly':
      return '每周'
    case 'interval':
      return `每 ${config.intervalDays} 天`
    case 'custom':
      return config.days.map((day) => DAY_LABEL[day] ?? day).join('、')
    default:
      return '按设定周期'
  }
}

export function buildYiqidongPrompt(config: YiqidongConfig): string {
  if (config.mode === 'off') {
    return '请帮我关闭一起动推送提醒。'
  }

  if (config.mode === 'casual') {
    return `请帮我开启一起动「随心推」：天气和空气质量合适时偶尔提醒，每天最多 ${config.casual.maxPerDay} 次，不要频繁打扰。`
  }

  const times = config.schedule.times.join('、')
  const repeat = describeRepeat(config.schedule)
  return `请帮我设置一起动固定提醒：${repeat} 的 ${times}，推送今日适合的运动与附近活动建议。`
}
