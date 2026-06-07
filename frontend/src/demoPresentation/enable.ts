import { applyDemoProfile } from '../lib/demoProfiles'
import {
  resetDemoPresentationConversation,
  setDemoPresentationEnabled,
} from './storage'

export function enableDemoPresentation(savedNormalActiveId: string | null): void {
  setDemoPresentationEnabled(true, savedNormalActiveId)
  applyDemoProfile('user_a')
  resetDemoPresentationConversation()
}

export function disableDemoPresentation(): void {
  setDemoPresentationEnabled(false)
}
