import type { FeedbackRecord, FeedbackStats, MessageFeedback } from '../types/agentCluster'

const STORAGE_KEY = 'xiaozhua.agent-feedback-v1'

export function loadFeedbackRecords(): FeedbackRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as FeedbackRecord[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function saveFeedback(messageId: string, vote: MessageFeedback): FeedbackStats {
  const records = loadFeedbackRecords().filter((item) => item.messageId !== messageId)
  records.push({ messageId, vote, at: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-200)))
  return computeStats(records)
}

export function getFeedbackForMessage(messageId: string): MessageFeedback | null {
  const hit = loadFeedbackRecords().find((item) => item.messageId === messageId)
  return hit?.vote ?? null
}

export function computeStats(records = loadFeedbackRecords()): FeedbackStats {
  const up = records.filter((item) => item.vote === 'up').length
  const down = records.filter((item) => item.vote === 'down').length
  const total = up + down
  return {
    up,
    down,
    total,
    preferenceHint: buildPreferenceHintFromCounts(up, down, total),
  }
}

export function buildPreferenceHint(): string {
  const { up, down, total } = computeStats()
  return buildPreferenceHintFromCounts(up, down, total)
}

function buildPreferenceHintFromCounts(up: number, down: number, total: number): string {
  if (total < 2) return ''
  const ratio = up / total
  if (ratio >= 0.72) {
    return '用户近期偏好：步骤清晰、带具体数字、少空泛鼓励。'
  }
  if (ratio <= 0.38 && down >= 2) {
    return '用户近期偏好：先给结论、再展开；举例要更具体、避免过长。'
  }
  return '用户近期偏好：平衡简洁与细节，重点突出可执行项。'
}
