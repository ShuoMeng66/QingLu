const STORAGE_KEY = 'xiaozhua.onboarding.dismissed'

export const ONBOARDING_TIPS = {
  yiqidongIntro: 'yiqidong-intro',
} as const

export type OnboardingTipId = (typeof ONBOARDING_TIPS)[keyof typeof ONBOARDING_TIPS]

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

export function isTipDismissed(id: OnboardingTipId): boolean {
  return loadDismissed().has(id)
}

export function dismissTip(id: OnboardingTipId): void {
  const dismissed = loadDismissed()
  dismissed.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
}
