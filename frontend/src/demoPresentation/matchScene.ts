import { DEMO_SCENES } from './scenes.generated'
import type { DemoScene } from './types'

const FULLWIDTH_PUNCTUATION: Record<string, string> = {
  '，': ',',
  '。': '.',
  '；': ';',
  '：': ':',
  '？': '?',
  '！': '!',
  '（': '(',
  '）': ')',
  '「': '"',
  '」': '"',
  '『': '"',
  '』': '"',
  '、': ',',
  '％': '%',
  '＋': '+',
}

export function normalizeDemoText(value: string): string {
  let text = value.replace(/\s+/g, ' ').trim()
  text = text.replace(/[–—−‑]/g, '-')
  text = text.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  text = text.replace(/[Ａ-Ｚａ-ｚ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
  for (const [full, half] of Object.entries(FULLWIDTH_PUNCTUATION)) {
    text = text.split(full).join(half)
  }
  return text
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
    const groups = scene.match.keywordGroups ?? []
    if (groups.length === 0) continue
    const lower = normalized.toLowerCase()
    const matched = groups.some((group) =>
      group.length > 0 &&
      group.every((word) => lower.includes(normalizeDemoText(word).toLowerCase())),
    )
    if (matched) return scene
  }

  for (const scene of DEMO_SCENES) {
    const keywords = scene.match.keywords ?? []
    if (keywords.length === 0) continue
    const lower = normalized.toLowerCase()
    if (keywords.every((word) => lower.includes(word.toLowerCase()))) return scene
  }

  return null
}
