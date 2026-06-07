import { applyDemoProfile } from '../lib/demoProfiles'
import { isDeveloperModeEnabled } from '../lib/developerMode'
import {
  resetDemoPresentationConversation,
  setDemoPresentationEnabled,
} from './storage'

export function enableDemoPresentation(savedNormalActiveId: string | null): void {
  if (!isDeveloperModeEnabled()) return
  setDemoPresentationEnabled(true, savedNormalActiveId)
  applyDemoProfile('user_a')
  resetDemoPresentationConversation()
}

export function disableDemoPresentation(): void {
  setDemoPresentationEnabled(false)
}
