export type PixPetMode = 'idle' | 'eating' | 'exercising'

/** @deprecated 兼容旧 FSM 命名 */
export type PixPetAction = PixPetMode

export type EatingVariant = 'hotpot' | 'bbq' | 'meal'

export type ExerciseVariant = 'dumbbell' | 'treadmill' | 'football' | 'basketball' | 'workout'

/** 休息阶段 — 参考 Desktop-Pixel-Pet 待机/睡觉 */
export type PixPetRestPhase = 'awake' | 'doze' | 'sleep'

/** 互动心情 — 叠加在动作状态之上 */
export type PixPetMood = 'normal' | 'happy' | 'listening' | 'thinking' | 'celebrate'

export interface PixPetState {
  mode: PixPetMode
  eating?: EatingVariant
  exercise?: ExerciseVariant
}

export interface PixPetPosition {
  x: number
  y: number
}

export const IDLE_STATE: PixPetState = { mode: 'idle' }

export const PIX_PET_POSITION_KEY = 'xiaozhua-pixpet-position-v1'

export function pixPetQuoteKey(state: PixPetState, restPhase: PixPetRestPhase = 'awake'): string {
  if (restPhase === 'sleep') return 'sleep'
  if (restPhase === 'doze') return 'doze'
  if (state.mode === 'idle') return 'idle'
  if (state.mode === 'eating') return `eating-${state.eating ?? 'meal'}`
  return `exercising-${state.exercise ?? 'workout'}`
}

export const PIX_PET_QUOTES: Record<string, string[]> = {
  idle: ['吃得聪明，动得科学～', '戳戳我！', '今天也要好好吃饭哦', '轻鹭在呢 ♡'],
  doze: ['嗯…有点困…', 'Zzz…', '打个盹～', '呼…'],
  sleep: ['晚安…', 'Zzz…', '梦里也在算卡路里', '呼呼…'],
  'eating-hotpot': ['番茄锅打底！', '毛肚七上八下～', '蘸醋别蘸麻酱'],
  'eating-bbq': ['烤肉选里脊', '少酱多蔬菜', '烧烤也要控热量'],
  'eating-meal': ['细嚼慢咽更减脂', '蛋白质要够～', '这口先给轻鹭！'],
  'exercising-dumbbell': ['弯举！感受二头', '力量训练走起', '组间别歇太久'],
  'exercising-treadmill': ['配速稳住', '跑步前记得热身', '有氧燃起来'],
  'exercising-football': ['带球突破！', '踢完记得拉伸', '足球燃脂超赞'],
  'exercising-basketball': ['运球运球！', '投篮手型要对', '篮球练协调'],
  'exercising-workout': ['动一下，代谢 up！', '飞盘还是跑团？', '练完记得补充蛋白'],
}

export const PIX_PET_MOOD_QUOTES: Record<PixPetMood, string[]> = {
  normal: [],
  happy: ['嘿嘿～', '好痒！', '醒啦醒啦！', '开心 ♡'],
  listening: ['我在听～', '嗯嗯，继续说', '轻鹭竖耳朵中…'],
  thinking: ['让我想想…', '轻鹭开动脑子', '嗯…分析一下'],
  celebrate: ['耶！', '发送成功～', '太棒啦 ♡', '继续聊！'],
}

export function pickQuote(key: string, pool: Record<string, string[]>, fallback = '…'): string {
  const list = pool[key]
  if (!list?.length) return fallback
  return list[Math.floor(Math.random() * list.length)]
}

export function loadPixPetPosition(layout: string): PixPetPosition | null {
  try {
    const raw = localStorage.getItem(PIX_PET_POSITION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, PixPetPosition>
    const pos = data[layout]
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return null
    return pos
  } catch {
    return null
  }
}

export function savePixPetPosition(layout: string, position: PixPetPosition | null) {
  try {
    const raw = localStorage.getItem(PIX_PET_POSITION_KEY)
    const data = raw ? (JSON.parse(raw) as Record<string, PixPetPosition>) : {}
    if (position) data[layout] = position
    else delete data[layout]
    localStorage.setItem(PIX_PET_POSITION_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota errors */
  }
}
