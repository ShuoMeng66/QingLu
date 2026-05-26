import type { YiqidongConfig } from './yiqidong'

export type YiqidongLetterKind = 'scheduled' | 'casual'

export interface YiqidongLetter {
  id: string
  kind: YiqidongLetterKind
  title: string
  body: string
  createdAt: number
  read: boolean
}

const LETTERS_KEY = 'xiaozhua.yiqidong.letters-v1'
const CASUAL_DAY_KEY = 'xiaozhua.yiqidong.casual-day'
const QUEST_COOLDOWN_KEY = 'xiaozhua.yiqidong.quest-cooldown'
const QUEST_DISMISSED_KEY = 'xiaozhua.yiqidong.quest-dismissed'

export const QUEST_COOLDOWN_MS = 60_000

const DAY_MAP: Record<number, string> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
}

const CASUAL_BODIES = [
  '今天空气不错，适合快走 20 分钟或做一组拉伸。记得补水。',
  '久坐了一上午？起来做 3 分钟靠墙静蹲，激活一下下肢。',
  '下午阳光正好，楼下绕圈走 15 分钟，心率到 100 左右即可。',
  '天气一般，室内来 10 个深蹲 + 10 个俯卧撑，组间休息 30 秒。',
]

const SCHEDULED_BODIES = [
  '固定提醒：先 5 分钟动态热身，再按你的计划完成主训，最后拉伸 3 分钟。',
  '到点啦！今天建议中等强度有氧 25 分钟，或力量训练 40 分钟（含组间休息）。',
  '提醒：训练前确认睡眠与补水；若昨晚没睡好，把强度降一档。',
]

function loadLetters(): YiqidongLetter[] {
  try {
    const raw = localStorage.getItem(LETTERS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as YiqidongLetter[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveLetters(letters: YiqidongLetter[]) {
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters.slice(0, 50)))
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getCasualCountToday(): number {
  try {
    const raw = localStorage.getItem(CASUAL_DAY_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw) as { day: string; count: number }
    return data.day === todayKey() ? data.count : 0
  } catch {
    return 0
  }
}

function bumpCasualCount() {
  localStorage.setItem(
    CASUAL_DAY_KEY,
    JSON.stringify({ day: todayKey(), count: getCasualCountToday() + 1 }),
  )
}

function matchesSchedule(config: YiqidongConfig, now: Date): boolean {
  const { schedule } = config
  const nearTime = schedule.times.some((time) => {
    const [h, m] = time.split(':').map(Number)
    const diff = Math.abs(now.getHours() * 60 + now.getMinutes() - (h * 60 + m))
    return diff <= 30
  })
  if (!nearTime) return false

  switch (schedule.repeat) {
    case 'daily':
      return true
    case 'weekly':
      return true
    case 'interval': {
      const dayNum = Math.floor(now.getTime() / 86_400_000)
      return dayNum % Math.max(1, schedule.intervalDays) === 0
    }
    case 'custom':
      return schedule.days.includes(DAY_MAP[now.getDay()] ?? 'mon')
    default:
      return false
  }
}

function letterExistsToday(kind: YiqidongLetterKind): boolean {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return loadLetters().some(
    (letter) => letter.kind === kind && letter.createdAt >= start.getTime(),
  )
}

export function syncYiqidongLetters(config: YiqidongConfig): YiqidongLetter[] {
  if (config.mode === 'off') return loadLetters()

  const now = new Date()
  let letters = loadLetters()

  if (config.mode === 'scheduled' && matchesSchedule(config, now) && !letterExistsToday('scheduled')) {
    letters = [createScheduledLetter(now), ...letters]
  }

  if (config.mode === 'casual' && getCasualCountToday() < config.casual.maxPerDay && Math.random() > 0.35) {
    const spawned = createCasualLetter(now)
    if (spawned) {
      letters = [spawned, ...letters]
      bumpCasualCount()
    }
  }

  saveLetters(letters)
  return letters
}

export function getYiqidongLetters(): YiqidongLetter[] {
  return loadLetters().sort((a, b) => b.createdAt - a.createdAt)
}

export function exportYiqidongLetters(): YiqidongLetter[] {
  return loadLetters()
}

export function importYiqidongLetters(letters: YiqidongLetter[]) {
  saveLetters(Array.isArray(letters) ? letters : [])
}

export function markLetterRead(id: string): YiqidongLetter[] {
  const letters = loadLetters().map((letter) =>
    letter.id === id ? { ...letter, read: true } : letter,
  )
  saveLetters(letters)
  return letters
}

export function countUnreadLetters(letters = getYiqidongLetters()): number {
  return letters.filter((letter) => !letter.read).length
}

function createCasualLetter(now = new Date()): YiqidongLetter {
  const body = CASUAL_BODIES[Math.floor(Math.random() * CASUAL_BODIES.length)]
  return {
    id: `casual-${now.getTime()}`,
    kind: 'casual',
    title: '随心推',
    body,
    createdAt: now.getTime(),
    read: false,
  }
}

function createScheduledLetter(now = new Date()): YiqidongLetter {
  const body = SCHEDULED_BODIES[Math.floor(Math.random() * SCHEDULED_BODIES.length)]
  return {
    id: `scheduled-${now.getTime()}`,
    kind: 'scheduled',
    title: '运动提醒',
    body,
    createdAt: now.getTime(),
    read: false,
  }
}

function loadQuestDismissed(): string[] {
  try {
    const raw = localStorage.getItem(QUEST_DISMISSED_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as string[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function getQuestCooldownUntil(): number {
  try {
    const raw = localStorage.getItem(QUEST_COOLDOWN_KEY)
    if (!raw) return 0
    const until = Number(raw)
    return Number.isFinite(until) ? until : 0
  } catch {
    return 0
  }
}

export function canShowQuestPopup(): boolean {
  return Date.now() >= getQuestCooldownUntil()
}

export function markQuestDismissed(letterId: string): void {
  const dismissed = loadQuestDismissed()
  if (!dismissed.includes(letterId)) {
    localStorage.setItem(QUEST_DISMISSED_KEY, JSON.stringify([letterId, ...dismissed].slice(0, 30)))
  }
  localStorage.setItem(QUEST_COOLDOWN_KEY, String(Date.now() + QUEST_COOLDOWN_MS))
}

export function wasQuestDismissed(letterId: string): boolean {
  return loadQuestDismissed().includes(letterId)
}

export function trySpawnCasualLetter(config: YiqidongConfig): YiqidongLetter | null {
  if (config.mode !== 'casual') return null
  if (getCasualCountToday() >= config.casual.maxPerDay) return null

  const now = new Date()
  const letter = createCasualLetter(now)
  const letters = [letter, ...loadLetters()]
  saveLetters(letters)
  bumpCasualCount()
  return letter
}

export function trySpawnScheduledLetter(config: YiqidongConfig, now = new Date()): YiqidongLetter | null {
  if (config.mode !== 'scheduled') return null
  if (!matchesSchedule(config, now)) return null
  if (letterExistsToday('scheduled')) return null

  const letter = createScheduledLetter(now)
  const letters = [letter, ...loadLetters()]
  saveLetters(letters)
  return letter
}

export function previewLetterBody(body: string, maxLen = 48): string {
  const trimmed = body.trim()
  if (trimmed.length <= maxLen) return trimmed
  return `${trimmed.slice(0, maxLen)}…`
}

/** 纸质信件开场白，如「人：你好，」 */
export function formatLetterSalutation(name = '你'): string {
  return `人：${name}，你好`
}
