import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { QuickPromptMeta } from '../components/ChatView'
import { MealEnvelopePopup } from '../components/meal/MealEnvelopePopup'
import { EnvelopeModal } from '../components/yiqidong/EnvelopeModal'
import { YiqidongLetterExperience } from '../components/yiqidong/YiqidongLetterExperience'
import { AppContextProvider } from './AppContext'
import { useToast } from './ToastContext'
import { useAgentCluster } from '../hooks/useAgentCluster'
import { useChatStream } from '../hooks/useChatStream'
import { useConversations } from '../hooks/useConversations'
import { useOpenClawConfig } from '../hooks/useOpenClawConfig'
import { useYiqidongQuest } from '../hooks/useYiqidongQuest'
import {
  buildClusterSystemPrompt,
  buildSystemPromptForUserMessage,
  scoreResponse,
} from '../lib/agentCluster'
import {
  buildFollowUpUserMessage,
  inferFollowUpSelection,
} from '../lib/assistantStructured'
import {
  canRunProfileAutoFollowup,
  clearPendingUserQuestion,
  consumePendingUserQuestion,
  markProfileAutoFollowupRan,
  rememberPendingUserQuestion,
} from '../lib/onboardingPending'
import { preloadSkillModules } from '../lib/skillModuleLoader'
import {
  loadSessionContext,
  setSessionSelection,
  updateSessionFromAssistantReply,
} from '../lib/sessionContext'
import { routeQingluSkillModule } from '../lib/skillRouter'
import type { FollowUpActionMeta } from '../types/openclaw'
import { runOutputGuard } from '../lib/outputGuard'
import { getCachedUserLocation } from '../lib/userLocation'
import {
  createTrajectoryDraft,
  completeTrajectory,
  markTrajectoryFollowUp,
} from '../lib/trajectoryLogger'
import {
  countUnreadLetters,
  getYiqidongLetters,
  markLetterRead,
  syncYiqidongLetters,
} from '../lib/yiqidongEnvelopes'
import {
  describeYiqidongConfig,
  loadYiqidongConfig,
  type YiqidongConfig,
} from '../lib/yiqidong'
import { loadAppPreferences } from '../lib/appPreferences'
import { translate } from '../lib/i18n/messages'
import {
  areMealRemindersEnabled,
  dismissMealReminder,
  getActiveMealReminder,
  syncMealReminders,
  type MealReminder,
} from '../lib/mealLog'
import { loadUserProfile, type UserProfile } from '../lib/userProfile'

type YiqidongModalState =
  | { open: false }
  | { open: true; tab: 'inbox' | 'settings'; letterId?: string | null }

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const shouldConnectOpenClaw =
    location.pathname === '/chat' || location.pathname === '/settings'
  const [input, setInput] = useState('')
  const [yiqidongConfig, setYiqidongConfig] = useState(loadYiqidongConfig)
  const [yiqidongUnread, setYiqidongUnread] = useState(() =>
    countUnreadLetters(syncYiqidongLetters(loadYiqidongConfig())),
  )
  const [yiqidongModal, setYiqidongModal] = useState<YiqidongModalState>({ open: false })
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile())
  const [mealReminder, setMealReminder] = useState<MealReminder | null>(() =>
    areMealRemindersEnabled() ? getActiveMealReminder() : null,
  )
  const mealRemindersEnabled = areMealRemindersEnabled()
  const profileAutoSendingRef = useRef(false)

  const refreshUserProfile = useCallback(() => {
    setUserProfile(loadUserProfile())
  }, [])

  const {
    config,
    draftConfig,
    status,
    statusMessage,
    models,
    setDraftConfig,
    runConnectionTest,
    handleSaveConfig,
    handleResetDraft,
    syncDraftFromActive,
  } = useOpenClawConfig({ autoConnect: shouldConnectOpenClaw })

  const {
    activeConversation,
    activeId,
    historyConversations,
    conversations,
    selectConversation,
    createNewConversation,
    deleteConversation,
    updateConversationMessages,
  } = useConversations()

  const connected = status === 'connected'

  const scoreAnswer = useCallback(
    async (question: string, answer: string) => scoreResponse(question, answer),
    [],
  )

  const {
    turn: clusterTurn,
    prepareTurn,
    finishExecution,
    setReviewing,
    resetTurn,
    submitFeedback,
  } = useAgentCluster({ scoreAnswer })

  const { questLetter, dismissQuest, clearQuest } = useYiqidongQuest(yiqidongConfig)

  const messages = activeConversation?.messages ?? []

  const refreshYiqidongUnread = useCallback(() => {
    setYiqidongUnread(countUnreadLetters(getYiqidongLetters()))
  }, [])

  useEffect(() => {
    syncYiqidongLetters(yiqidongConfig)
    refreshYiqidongUnread()
  }, [yiqidongConfig, refreshYiqidongUnread])

  useEffect(() => {
    const onUserDataApplied = () => {
      clearPendingUserQuestion()
      refreshUserProfile()
      const nextYiqidong = loadYiqidongConfig()
      setYiqidongConfig(nextYiqidong)
      syncYiqidongLetters(nextYiqidong)
      refreshYiqidongUnread()
    }
    window.addEventListener('qinglu:user-data-applied', onUserDataApplied)
    return () => window.removeEventListener('qinglu:user-data-applied', onUserDataApplied)
  }, [refreshUserProfile, refreshYiqidongUnread])

  useEffect(() => {
    if (questLetter) refreshYiqidongUnread()
  }, [questLetter, refreshYiqidongUnread])

  useEffect(() => {
    if (!mealRemindersEnabled || !userProfile.profile_complete) return

    const tick = () => {
      const next = syncMealReminders(userProfile)
      if (next) setMealReminder(next)
    }

    tick()
    const timer = window.setInterval(tick, 60_000)
    return () => window.clearInterval(timer)
  }, [mealRemindersEnabled, userProfile])

  const openYiqidongModal = useCallback(
    (tab: 'inbox' | 'settings', letterId?: string | null) => {
      setYiqidongModal({ open: true, tab, letterId })
    },
    [],
  )

  const closeYiqidongModal = useCallback(() => {
    setYiqidongModal({ open: false })
    refreshYiqidongUnread()
  }, [refreshYiqidongUnread])

  useEffect(() => {
    if (location.pathname === '/chat') {
      preloadSkillModules()
    }
  }, [location.pathname])

  const resolveSystemPrompt = useCallback(
    async (apiMessages: import('../types/openclaw').ChatMessage[]) => {
      const lastUser = [...apiMessages].reverse().find((m) => m.role === 'user')
      if (!lastUser?.content.trim()) return undefined
      return buildSystemPromptForUserMessage(lastUser.content.trim())
    },
    [],
  )

  const runUserTurnRef = useRef<
    (content: string, meta?: QuickPromptMeta) => Promise<void>
  >(async () => {})

  const handleStreamAssistantDone = useCallback(
    async (
      userMessage: string,
      answer: string,
      assistantId: string,
      assistantMeta: import('../types/openclaw').AssistantMessageMeta | undefined,
      rawDraft: string | undefined,
      sceneType?: QuickPromptMeta['sceneType'],
    ) => {
      const route = routeQingluSkillModule(userMessage, { sceneType })
      updateSessionFromAssistantReply(rawDraft ?? answer, route.moduleId)
      const score = await finishExecution(userMessage, answer)
      completeTrajectory({
        conversationId: activeId,
        userMessage,
        assistantReply: answer,
        score,
        messageId: assistantId,
      })

      if (assistantMeta?.isProfileComplete && canRunProfileAutoFollowup()) {
        refreshUserProfile()
        const pending = consumePendingUserQuestion()
        if (pending && pending !== userMessage && !profileAutoSendingRef.current) {
          markProfileAutoFollowupRan()
          profileAutoSendingRef.current = true
          try {
            await runUserTurnRef.current(pending, {
              skipPendingRemember: true,
              isAutoFollowUp: true,
            })
          } finally {
            profileAutoSendingRef.current = false
          }
        }
      }
    },
    [activeId, finishExecution, refreshUserProfile],
  )

  const getStreamSendOptions = useCallback(
    () => ({
      resolveSystemPrompt,
      onAssistantDone: async (
        answer: string,
        assistantId: string,
        assistantMeta?: import('../types/openclaw').AssistantMessageMeta,
        rawDraft?: string,
      ) => {
        const lastUser = [...messages].reverse().find((m) => m.role === 'user')
        if (!lastUser?.content.trim()) return
        await handleStreamAssistantDone(
          lastUser.content.trim(),
          answer,
          assistantId,
          assistantMeta,
          rawDraft,
        )
      },
      onReviewPhase: (active: boolean) => {
        if (active) setReviewing(true)
      },
      onBeforeReveal: async (draft: string, ctx: import('../hooks/useChatStream').StreamRevealContext) => {
        const result = await runOutputGuard({
          config,
          connected,
          enabled: true,
          userMessage: ctx.userMessage,
          draft,
          rawDraft: ctx.rawDraft,
          hasStructuredPayload: ctx.hasStructuredPayload,
          userLocation: getCachedUserLocation(),
        })
        return result.finalContent
      },
    }),
    [config, connected, handleStreamAssistantDone, messages, resolveSystemPrompt, setReviewing],
  )

  const {
    loading,
    handleSend: sendMessage,
    handleStop,
    handleRegenerate,
    handleEditMessage,
    handleRetryMessage,
  } = useChatStream({
    config,
    connected,
    activeId,
    messages,
    updateConversationMessages,
    onNeedSettings: () => navigate('/settings'),
    toast,
    getStreamSendOptions,
  })

  const handleCreateNewConversation = useCallback(() => {
    createNewConversation()
    setInput('')
    toast(translate(loadAppPreferences().locale, 'toast.newConversation'), 'success')
  }, [createNewConversation, toast])

  const handleSelectConversation = useCallback(
    (id: string) => {
      selectConversation(id)
      setInput('')
    },
    [selectConversation],
  )

  const handleDeleteConversation = useCallback(
    (id: string) => {
      const result = deleteConversation(id)
      setInput('')
      toast(
        result.createdNew
          ? translate(loadAppPreferences().locale, 'toast.conversationDeletedNew')
          : translate(loadAppPreferences().locale, 'toast.conversationDeleted'),
      )
      return result
    },
    [deleteConversation, toast],
  )

  const handleSaveSettings = useCallback(() => {
    handleSaveConfig()
    toast(translate(loadAppPreferences().locale, 'settings.saved'), 'success')
  }, [handleSaveConfig, toast])

  const handleResetSettings = useCallback(() => {
    handleResetDraft()
    toast(translate(loadAppPreferences().locale, 'toast.settingsReset'))
  }, [handleResetDraft, toast])

  const handleTestSettings = useCallback(async () => {
    const ok = await runConnectionTest(draftConfig)
    toast(
      ok
        ? translate(loadAppPreferences().locale, 'toast.connectionOk')
        : statusMessage,
      ok ? 'success' : 'error',
    )
  }, [draftConfig, runConnectionTest, statusMessage, toast])

  const runUserTurn = useCallback(
    async (content: string, meta?: QuickPromptMeta) => {
      if (!meta?.skipPendingRemember) {
        rememberPendingUserQuestion(content)
      }

      if (messages.length > 0) {
        markTrajectoryFollowUp(activeId)
      }

      const plan = await prepareTurn(content)
      const systemPrompt = await buildClusterSystemPrompt(plan, content, {
        sceneType: meta?.sceneType,
      })
      createTrajectoryDraft({
        conversationId: activeId,
        userMessage: content,
        focus: plan.focus,
        plan,
        systemPrompt,
        starterId: meta?.starterId,
        interestId: meta?.interestId,
      })
      await sendMessage(content, {
        systemPrompt,
        onAssistantDone: async (answer, assistantId, assistantMeta, rawDraft) => {
          await handleStreamAssistantDone(
            content,
            answer,
            assistantId,
            assistantMeta,
            rawDraft,
            meta?.sceneType,
          )
        },
      })
    },
    [
      activeId,
      handleStreamAssistantDone,
      messages.length,
      prepareTurn,
      sendMessage,
    ],
  )

  runUserTurnRef.current = runUserTurn

  const handleSend = useCallback(
    async (text?: string, meta?: QuickPromptMeta) => {
      const content = (text ?? input).trim()
      if (!content) return
      setInput('')

      try {
        await runUserTurn(content, meta)
      } catch {
        resetTurn()
      }
    },
    [input, resetTurn, runUserTurn],
  )

  const handleFollowUpAction = useCallback(
    async (action: FollowUpActionMeta) => {
      const ctx = loadSessionContext()
      const { item, partySize } = inferFollowUpSelection(action, ctx.last_recommendations)
      if (item) setSessionSelection(item, partySize ?? undefined)

      const text = buildFollowUpUserMessage(action)
      if (!text) return

      try {
        await runUserTurn(text, { skipPendingRemember: true, isAutoFollowUp: true })
      } catch {
        resetTurn()
      }
    },
    [resetTurn, runUserTurn],
  )

  const handleStopWithCluster = useCallback(() => {
    handleStop()
    resetTurn()
  }, [handleStop, resetTurn])

  const handleYiqidongApply = useCallback(
    (nextConfig: YiqidongConfig) => {
      setYiqidongConfig(nextConfig)
      syncYiqidongLetters(nextConfig)
      refreshYiqidongUnread()
      toast(
        translate(loadAppPreferences().locale, 'toast.yiqidongSaved', {
          summary: describeYiqidongConfig(nextConfig, loadAppPreferences().locale),
        }),
        'success',
      )
    },
    [refreshYiqidongUnread, toast],
  )

  const handleQuestAcknowledge = useCallback(
    (letterId: string) => {
      markLetterRead(letterId)
      clearQuest()
      refreshYiqidongUnread()
    },
    [clearQuest, refreshYiqidongUnread],
  )

  const handleQuestDismiss = useCallback(
    (letterId: string) => {
      dismissQuest(letterId)
      refreshYiqidongUnread()
    },
    [dismissQuest, refreshYiqidongUnread],
  )

  const value = useMemo(
    () => ({
      config,
      draftConfig,
      status,
      statusMessage,
      models,
      connected,
      setDraftConfig,
      syncDraftFromActive,
      handleSaveSettings,
      handleResetSettings,
      handleTestSettings,
      activeConversation,
      activeId,
      historyConversations,
      conversations,
      selectConversation: handleSelectConversation,
      createNewConversation: handleCreateNewConversation,
      deleteConversation: handleDeleteConversation,
      input,
      setInput,
      messages,
      loading,
      handleSend,
      handleFollowUpAction,
      handleStop: handleStopWithCluster,
      handleRegenerate,
      handleEditMessage,
      handleRetryMessage,
      clusterTurn,
      submitFeedback,
      yiqidongConfig,
      yiqidongUnread,
      handleYiqidongApply,
      openYiqidongModal,
      questLetter,
      handleQuestAcknowledge,
      handleQuestDismiss,
      userProfile,
      refreshUserProfile,
      mealRemindersEnabled,
    }),
    [
      config,
      draftConfig,
      status,
      statusMessage,
      models,
      connected,
      setDraftConfig,
      syncDraftFromActive,
      handleSaveSettings,
      handleResetSettings,
      handleTestSettings,
      activeConversation,
      activeId,
      historyConversations,
      conversations,
      handleSelectConversation,
      handleCreateNewConversation,
      handleDeleteConversation,
      input,
      messages,
      loading,
      handleSend,
      handleFollowUpAction,
      handleStopWithCluster,
      handleRegenerate,
      handleEditMessage,
      handleRetryMessage,
      clusterTurn,
      submitFeedback,
      yiqidongConfig,
      yiqidongUnread,
      handleYiqidongApply,
      openYiqidongModal,
      questLetter,
      handleQuestAcknowledge,
      handleQuestDismiss,
      userProfile,
      refreshUserProfile,
      mealRemindersEnabled,
    ],
  )

  return (
    <AppContextProvider value={value}>
      {children}

      {questLetter && (
        <YiqidongLetterExperience
          letter={questLetter}
          onAcknowledge={handleQuestAcknowledge}
          onDismiss={handleQuestDismiss}
        />
      )}

      {yiqidongModal.open && (
        <EnvelopeModal
          initialTab={yiqidongModal.tab}
          initialLetterId={yiqidongModal.letterId}
          onApply={handleYiqidongApply}
          onClose={closeYiqidongModal}
        />
      )}

      {mealReminder && mealRemindersEnabled && (
        <MealEnvelopePopup
          reminder={mealReminder}
          profile={userProfile}
          config={config}
          connected={connected}
          onSubmit={() => refreshUserProfile()}
          onDismiss={() => {
            dismissMealReminder(mealReminder.id)
            setMealReminder(null)
            refreshUserProfile()
          }}
        />
      )}
    </AppContextProvider>
  )
}
