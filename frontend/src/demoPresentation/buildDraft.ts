import type { DemoScene } from './types'

export function buildDraftFromScene(scene: DemoScene): string {
  const displayText = scene.assistant.displayText.trim()
  const payload: Record<string, unknown> = { ...scene.payload }

  if (scene.assistant.followUpChips?.length) {
    payload.follow_up_actions = scene.assistant.followUpChips.map((chip) => ({
      label: chip.label,
      message: chip.message ?? chip.label,
    }))
  }

  const json = JSON.stringify(payload, null, 2)
  return `${displayText}\n\n---JSON_START---\n${json}\n---JSON_END---`
}
