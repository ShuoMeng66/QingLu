import type { IcebreakerTelemetryEvent, InterestWeightState } from '../types/icebreaker'

const TELEMETRY_KEY = 'xiaozhua.icebreaker.telemetry-v1'
const WEIGHTS_KEY = 'xiaozhua.icebreaker.interest-weights-v1'
const CLICK_HISTORY_KEY = 'xiaozhua.icebreaker.click-history-v1'

const ALPHA = 0.15
const BETA = 0.03
const IMPRESSION_REORDER = 20
const CLICK_HISTORY_DAYS = 7

export function loadTelemetryEvents(): IcebreakerTelemetryEvent[] {
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as IcebreakerTelemetryEvent[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function recordTelemetryEvent(
  event: Omit<IcebreakerTelemetryEvent, 'at'>,
): IcebreakerTelemetryEvent {
  const full: IcebreakerTelemetryEvent = { ...event, at: Date.now() }
  const events = [...loadTelemetryEvents(), full].slice(-500)
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events))

  if (event.type === 'starter_impression') {
    bumpImpressionCount()
  }
  if (event.type === 'starter_click' || event.type === 'starter_to_reply') {
    updateInterestWeight(event.interestId, true)
    recordStarterClick(event.starterId)
  }

  return full
}

function loadInterestWeights(): InterestWeightState {
  try {
    const raw = localStorage.getItem(WEIGHTS_KEY)
    if (!raw) return { weights: {}, impressions: 0, updatedAt: Date.now() }
    return JSON.parse(raw) as InterestWeightState
  } catch {
    return { weights: {}, impressions: 0, updatedAt: Date.now() }
  }
}

function saveInterestWeights(state: InterestWeightState): void {
  localStorage.setItem(WEIGHTS_KEY, JSON.stringify(state))
}

function bumpImpressionCount(): void {
  const state = loadInterestWeights()
  state.impressions += 1
  state.updatedAt = Date.now()
  saveInterestWeights(state)
}

function updateInterestWeight(interestId: string, clicked: boolean): void {
  const state = loadInterestWeights()
  const current = state.weights[interestId] ?? 0.5
  state.weights[interestId] = clicked
    ? Math.min(1, current + ALPHA)
    : Math.max(0, current - BETA)
  state.updatedAt = Date.now()
  saveInterestWeights(state)
}

export function getInterestWeight(interestId: string): number {
  return loadInterestWeights().weights[interestId] ?? 0.5
}

export function getInterestWeights(): Record<string, number> {
  return loadInterestWeights().weights
}

export function shouldReorderStarters(): boolean {
  const { impressions } = loadInterestWeights()
  return impressions > 0 && impressions % IMPRESSION_REORDER === 0
}

function recordStarterClick(starterId: string): void {
  try {
    const raw = localStorage.getItem(CLICK_HISTORY_KEY)
    const history = raw ? (JSON.parse(raw) as Record<string, number>) : {}
    history[starterId] = Date.now()
    localStorage.setItem(CLICK_HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* ignore */
  }
}

export function wasStarterClickedRecently(starterId: string): boolean {
  try {
    const raw = localStorage.getItem(CLICK_HISTORY_KEY)
    if (!raw) return false
    const history = JSON.parse(raw) as Record<string, number>
    const at = history[starterId]
    if (!at) return false
    return Date.now() - at < CLICK_HISTORY_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export function computeStarterMetrics(): {
  impressions: number
  clicks: number
  ctr: number
  firstMessageRate: number
  thumbsUpRate: number
} {
  const events = loadTelemetryEvents()
  const impressions = events.filter((e) => e.type === 'starter_impression').length
  const clicks = events.filter((e) => e.type === 'starter_click').length
  const replies = events.filter((e) => e.type === 'starter_to_reply').length
  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? clicks / impressions : 0,
    firstMessageRate: impressions > 0 ? replies / impressions : 0,
    thumbsUpRate: 0,
  }
}
