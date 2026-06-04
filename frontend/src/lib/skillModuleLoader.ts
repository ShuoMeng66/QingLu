import type { QingluSkillModuleId } from '../generated/qingluSkillModules'

type SkillModulesModule = typeof import('../generated/qingluSkillModules')

let modulesPromise: Promise<SkillModulesModule> | null = null

function loadSkillModules(): Promise<SkillModulesModule> {
  if (!modulesPromise) {
    modulesPromise = import('../generated/qingluSkillModules')
  }
  return modulesPromise
}

/** Warm skill chunk on chat mount (code-split). */
export function preloadSkillModules(): void {
  void loadSkillModules()
}

export async function getQingluSkillModuleContextAsync(
  moduleId: QingluSkillModuleId,
): Promise<string> {
  const mod = await loadSkillModules()
  return mod.getQingluSkillModuleContext(moduleId)
}
