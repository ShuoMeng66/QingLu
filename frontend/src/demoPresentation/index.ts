export type { DemoScene, DemoRecommendation, DemoFollowUpChip } from './types'
export { DEMO_SCENES } from './scenes.generated'
export {
  isDemoPresentationEnabled,
  getDemoPresentationConversation,
  getSavedNormalActiveId,
  setDemoPresentationEnabled,
  updateDemoPresentationMessages,
  resetDemoPresentationConversation,
  touchDemoConversationTitle,
  DEMO_PRESENTATION_CONVERSATION_ID,
} from './storage'
export { matchDemoScene, normalizeDemoText } from './matchScene'
export { buildDraftFromScene } from './buildDraft'
export { enableDemoPresentation, disableDemoPresentation } from './enable'
export {
  streamDemoDraft,
  resolveDemoStreamOptions,
  buildSceneDraft,
} from './runPresentationStream'
