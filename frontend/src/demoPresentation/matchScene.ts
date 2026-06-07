import { DEMO_SCENES } from './scenes.generated'
import type { DemoScene } from './types'

export function normalizeDemoText(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function matchDemoScene(userText: string): DemoScene | null {
  const normalized = normalizeDemoText(userText)
  if (!normalized) return null

  for (const scene of DEMO_SCENES) {
    const exactList = scene.match.exact ?? []
    for (const exact of exactList) {
      if (normalizeDemoText(exact) === normalized) return scene
    }
  }

  for (const scene of DEMO_SCENES) {
    const keywords = scene.match.keywords ?? []
    if (keywords.length === 0) continue
    const lower = normalized.toLowerCase()
    if (keywords.every((word) => lower.includes(word.toLowerCase()))) return scene
  }

  return null
}
