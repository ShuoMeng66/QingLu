import { useCallback, useEffect, useState } from 'react'
import type { ChatMessage } from '../types/openclaw'
import type { Conversation } from '../types/conversation'
import {
  disableDemoPresentation,
  enableDemoPresentation,
  getDemoPresentationConversation,
  getSavedNormalActiveId,
  isDemoPresentationEnabled,
  resetDemoPresentationConversation,
  updateDemoPresentationMessages,
  DEMO_PRESENTATION_CONVERSATION_ID,
} from '../demoPresentation'
import { setDeveloperModeEnabled } from '../lib/developerMode'
import { preloadDemoAssets } from '../demoPresentation/preloadDemoAssets'
import { DEMO_RECORDING_BOOTSTRAP } from '../demoPresentation/recording'

export function useDemoPresentation() {
  const [enabled, setEnabled] = useState(() => isDemoPresentationEnabled())
  const [conversation, setConversation] = useState<Conversation>(() =>
    getDemoPresentationConversation(),
  )

  const refresh = useCallback(() => {
    setEnabled(isDemoPresentationEnabled())
    setConversation(getDemoPresentationConversation())
  }, [])

  useEffect(() => {
    const onChange = () => refresh()
    window.addEventListener('qinglu:demo-presentation-changed', onChange)
    return () => window.removeEventListener('qinglu:demo-presentation-changed', onChange)
  }, [refresh])

  useEffect(() => {
    if (!DEMO_RECORDING_BOOTSTRAP) return
    setDeveloperModeEnabled(true)
    preloadDemoAssets()
    if (!isDemoPresentationEnabled()) {
      enableDemoPresentation(null)
    }
    refresh()
  }, [refresh])

  const turnOn = useCallback((currentActiveId: string) => {
    enableDemoPresentation(currentActiveId)
    refresh()
  }, [refresh])

  const turnOff = useCallback(() => {
    disableDemoPresentation()
    refresh()
    return getSavedNormalActiveId()
  }, [refresh])

  const updateMessages = useCallback(
    (
      _conversationId: string,
      next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
    ) => {
      const updated = updateDemoPresentationMessages(next)
      setConversation(updated)
    },
    [],
  )

  const resetConversation = useCallback(() => {
    resetDemoPresentationConversation()
    refresh()
  }, [refresh])

  return {
    enabled,
    conversation,
    demoActiveId: DEMO_PRESENTATION_CONVERSATION_ID,
    turnOn,
    turnOff,
    updateMessages,
    resetConversation,
    refresh,
  }
}
