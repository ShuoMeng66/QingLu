import { isDeveloperModeEnabled } from '../lib/developerMode'
import {
  resetDemoPresentationConversation,
  setDemoPresentationEnabled,
} from './storage'

export function enableDemoPresentation(savedNormalActiveId: string | null): void {
  if (!isDeveloperModeEnabled()) return
  setDemoPresentationEnabled(true, savedNormalActiveId)
  resetDemoPresentationConversation()
}

export function disableDemoPresentation(): void {
  setDemoPresentationEnabled(false)
}
