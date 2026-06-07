import type { ChatMessage } from '../types/openclaw'
import { buildDraftFromScene } from './buildDraft'
import type { DemoScene } from './types'

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = window.setTimeout(() => resolve(), ms)
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        resolve()
      },
      { once: true },
    )
  })
}

export async function streamDemoDraft(params: {
  draft: string
  conversationId: string
  assistantId: string
  charsPerTick: number
  tickMs: number
  signal: AbortSignal
  isActive: () => boolean
  onContent: (content: string) => void
}): Promise<string> {
  const { draft, charsPerTick, tickMs, signal, isActive, onContent } = params
  let cursor = 0
  let current = ''

  while (cursor < draft.length) {
    if (signal.aborted || !isActive()) return current
    cursor = Math.min(draft.length, cursor + charsPerTick)
    current = draft.slice(0, cursor)
    onContent(current)
    await sleep(tickMs, signal)
  }

  return draft
}

export function resolveDemoStreamOptions(scene: DemoScene) {
  return {
    charsPerTick: scene.stream?.charsPerTick ?? 6,
    tickMs: scene.stream?.tickMs ?? 24,
  }
}

export function buildSceneDraft(scene: DemoScene): string {
  return buildDraftFromScene(scene)
}

export type DemoPatchMessages = (
  conversationId: string,
  next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
) => void
