import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Conversation } from '../types/conversation'
import type { ConversationStarter, TriggerInterest } from '../types/icebreaker'
import type { YiqidongConfig } from '../lib/yiqidong'
import { distillTriggerInterests } from '../lib/icebreakerRid'
import { generateConversationStarters, pickFeaturedStarter } from '../lib/icebreakerIsg'
import { recordTelemetryEvent } from '../lib/icebreakerTelemetry'

interface UseIcebreakerStartersOptions {
  allConversations: Conversation[]
  yiqidongConfig: YiqidongConfig
  recentInput?: string
}

export function useIcebreakerStarters({
  allConversations,
  yiqidongConfig,
  recentInput,
}: UseIcebreakerStartersOptions) {
  const interests: TriggerInterest[] = useMemo(
    () =>
      distillTriggerInterests({
        conversations: allConversations,
        yiqidongConfig,
        recentInput,
      }),
    [allConversations, yiqidongConfig, recentInput],
  )

  const starters: ConversationStarter[] = useMemo(
    () => generateConversationStarters(interests, 3),
    [interests],
  )

  const featuredStarter = useMemo(() => pickFeaturedStarter(starters), [starters])

  const impressedRef = useRef<string>('')

  useEffect(() => {
    const key = starters.map((s) => s.id).join(',')
    if (!key || impressedRef.current === key) return
    impressedRef.current = key
    for (const starter of starters) {
      recordTelemetryEvent({
        type: 'starter_impression',
        starterId: starter.id,
        interestId: starter.interestId,
      })
    }
  }, [starters])

  const onStarterClick = useCallback((starter: ConversationStarter) => {
    recordTelemetryEvent({
      type: 'starter_click',
      starterId: starter.id,
      interestId: starter.interestId,
    })
    recordTelemetryEvent({
      type: 'starter_to_reply',
      starterId: starter.id,
      interestId: starter.interestId,
    })
  }, [])

  return {
    interests,
    starters,
    featuredStarter,
    onStarterClick,
  }
}
