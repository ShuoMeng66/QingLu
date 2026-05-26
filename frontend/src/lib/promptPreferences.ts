export interface PromptPreferences {
  version: number
  updatedAt: number
  clusterConstraints: string[]
  preferenceHints: string[]
  starterStyle: 'balanced' | 'conclusion_first' | 'detailed_steps'
  isgTone: string
}

const STORAGE_KEY = 'xiaozhua.prompt-preferences-v1'

export const DEFAULT_PROMPT_PREFERENCES: PromptPreferences = {
  version: 1,
  updatedAt: Date.now(),
  clusterConstraints: [
    '分步骤、给出可执行数字或具体动作',
    '语气友好简洁',
    '紧扣饮食/运动/恢复',
  ],
  preferenceHints: [],
  starterStyle: 'balanced',
  isgTone: '具体数字、低门槛、可点击即问',
}

export function loadPromptPreferences(): PromptPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROMPT_PREFERENCES
    return { ...DEFAULT_PROMPT_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROMPT_PREFERENCES
  }
}

export function savePromptPreferences(prefs: PromptPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function applyPromptPatch(patch: Partial<PromptPreferences>): PromptPreferences {
  const current = loadPromptPreferences()
  const next: PromptPreferences = {
    ...current,
    ...patch,
    version: current.version + 1,
    updatedAt: Date.now(),
    clusterConstraints: patch.clusterConstraints ?? current.clusterConstraints,
    preferenceHints: patch.preferenceHints ?? current.preferenceHints,
  }
  savePromptPreferences(next)
  return next
}

export function resetPromptPreferences(): PromptPreferences {
  savePromptPreferences(DEFAULT_PROMPT_PREFERENCES)
  return DEFAULT_PROMPT_PREFERENCES
}

export function getPromptPreferences(): PromptPreferences {
  return loadPromptPreferences()
}

export function applyPromptPatchFromJson(patch: Partial<PromptPreferences>): PromptPreferences {
  return applyPromptPatch(patch)
}

let evolvedLoaded = false

/** Load /evolved/prompt_patch.json once (Trace2Skill pipeline output). */
export async function loadEvolvedPromptPatch(): Promise<PromptPreferences | null> {
  if (evolvedLoaded) return loadPromptPreferences()
  evolvedLoaded = true
  try {
    const res = await fetch('/evolved/prompt_patch.json', { cache: 'no-cache' })
    if (!res.ok) return null
    const patch = (await res.json()) as Partial<PromptPreferences>
    return applyPromptPatch(patch)
  } catch {
    return null
  }
}

export function buildEvolvedPreferenceHints(): string {
  const prefs = loadPromptPreferences()
  const parts = [...prefs.preferenceHints]
  if (prefs.starterStyle === 'conclusion_first') {
    parts.push('用户偏好：先给结论、再展开细节')
  }
  if (prefs.starterStyle === 'detailed_steps') {
    parts.push('用户偏好：步骤清晰、带具体数字')
  }
  return parts.join('；')
}
