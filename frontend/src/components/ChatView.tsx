import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link, useLocation as useRouteLocation } from 'react-router-dom'
import type { ChatMessage } from '../types/openclaw'
import type { ConnectionStatus } from '../types/openclaw'
import type { Conversation } from '../types/conversation'
import type { ClusterTurn, MessageFeedback } from '../types/agentCluster'
import type { YiqidongConfig } from '../lib/yiqidong'
import { getFeedbackForMessage } from '../lib/agentFeedback'
import { isFoodIntent, isGymIntent, isRecoveryIntent } from '../lib/recommendationIntent'
import { updateTrajectoryFeedback } from '../lib/trajectoryLogger'
import { createMessageId } from '../lib/storage'
import { useToast } from '../context/ToastContext'
import { usePreferences } from '../context/PreferencesContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyRecommendations } from '../hooks/useNearbyRecommendations'
import { formatLocationLabel } from '../lib/citySkyline'
import { getConversationRecommendationCards } from '../lib/recommendationIntent'
import { formatDistance, formatWalkMinutes } from '../lib/userLocation'
import { AgentPhaseRail } from './agents/AgentPhaseRail'
import { AppShell } from './burnpal/AppShell'
import { BurnPalLogo } from './burnpal/BurnPalLogo'
import { UserAccountAvatar } from './auth/UserAccountAvatar'
import { ChatBubble } from './burnpal/ChatBubble'
import { ChatComposer } from './burnpal/ChatComposer'
import { ChatDashboardBar } from './burnpal/ChatDashboardBar'
import { ChatHistorySidebar } from './burnpal/ChatHistorySidebar'
import { DetailBottomSheet, type DetailSheetData } from './burnpal/DetailBottomSheet'
import { TrainingProfileSheet } from './burnpal/TrainingProfileSheet'
import { QuickActionBar } from './burnpal/QuickActionBar'
import { RichCard } from './burnpal/RichCard'
import { PageTransition } from './layout/PageTransition'

export interface QuickPromptMeta {
  starterId?: string
  interestId?: string
}

interface ChatViewProps {
  title: string
  messages: ChatMessage[]
  input: string
  loading: boolean
  connected: boolean
  status: ConnectionStatus
  clusterTurn: ClusterTurn
  yiqidongConfig: YiqidongConfig
  activeConversation: Conversation | undefined
  historyConversations: Conversation[]
  allConversations: Conversation[]
  activeId: string
  onInputChange: (value: string) => void
  onSend: () => void
  onQuickPrompt: (text: string, meta?: QuickPromptMeta) => void
  onStop: () => void
  onRegenerate: () => void
  onEditMessage: (messageId: string, content: string) => void
  onRetryMessage: (messageId: string) => void
  onMessageFeedback: (messageId: string, vote: MessageFeedback) => void
  onYiqidongApply: (config: YiqidongConfig) => void
  onCreateConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onOpenYiqidong?: () => void
  yiqidongUnread?: number
}


function buildDemoReply(
  prompt: string,
  food: ReturnType<typeof useNearbyRecommendations>['food'],
  gym: ReturnType<typeof useNearbyRecommendations>['gym'],
  recovery: ReturnType<typeof useNearbyRecommendations>['recovery'],
): string {
  if (isFoodIntent(prompt) && food) {
    return `根据你的位置，推荐「${food.name}」，距离约 ${formatDistance(food.distanceM)}（步行 ${formatWalkMinutes(food.distanceM)}）。可在对话里告诉我你的口味偏好，我再帮你细化选择。`
  }
  if (isGymIntent(prompt) && gym) {
    return `附近找到「${gym.name}」，距离约 ${formatDistance(gym.distanceM)}，步行 ${formatWalkMinutes(gym.distanceM)}。告诉我你的训练目标，我可以帮你安排具体动作。`
  }
  if (isRecoveryIntent(prompt) && recovery) {
    return `附近可以去「${recovery.name}」做恢复性散步和拉伸，距离约 ${formatDistance(recovery.distanceM)}。我也可以给你一套练后放松动作。`
  }
  if (isRecoveryIntent(prompt)) {
    return '练完腿建议做 20 分钟静态拉伸：泡沫轴放松股四头肌、腘绳肌，再配合猫式与鸽子式，能缓解延迟性酸痛。'
  }
  if (/运动|计划|训练|move|workout|plan/i.test(prompt)) {
    return '告诉我今天的可用时间和训练目标，我可以帮你安排具体的运动计划与饮食搭配。'
  }
  return '好的，我来帮你安排。请告诉我更多细节～'
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

export function ChatView({
  messages,
  input,
  loading,
  connected,
  clusterTurn,
  activeConversation,
  historyConversations,
  activeId,
  onInputChange,
  onSend,
  onQuickPrompt,
  onStop,
  onRegenerate,
  onEditMessage,
  onRetryMessage,
  onMessageFeedback,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenYiqidong,
  yiqidongUnread = 0,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pinnedToBottomRef = useRef(true)
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const routeLocation = useRouteLocation()
  const { toast } = useToast()
  const { preferences, t } = usePreferences()
  const [feedbackMap, setFeedbackMap] = useState<Record<string, MessageFeedback>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetDetail, setSheetDetail] = useState<DetailSheetData | null>(null)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [demoMessages, setDemoMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)

  const { location, loading: locationLoading } = useUserLocation({
    enabled: preferences.locationShare,
  })
  const { food, gym, recovery, loading: nearbyLoading } = useNearbyRecommendations(location)

  const useDemo = !connected
  const displayMessages = useDemo ? demoMessages : messages
  const isBusy = loading || isTyping

  const quickActionPreviews = useMemo(
    () => [
      {
        id: 'eat',
        hint: food
          ? `${food.name} · ${formatDistance(food.distanceM)}`
          : locationLoading || nearbyLoading
            ? t('chat.locating')
            : undefined,
      },
      {
        id: 'train',
        hint: gym ? `${gym.name} · ${formatDistance(gym.distanceM)}` : undefined,
      },
      {
        id: 'recover',
        hint: recovery
          ? `${recovery.name} · ${formatDistance(recovery.distanceM)}`
          : t('quick.recover.label'),
      },
      {
        id: 'move',
        hint: t('quick.customPlan'),
      },
    ],
    [food, gym, recovery, locationLoading, nearbyLoading, t],
  )

  const openSheet = useCallback((data: DetailSheetData) => {
    setSheetDetail(data)
    setIsSheetOpen(true)
  }, [])

  const handleQuickAction = useCallback(
    async (prompt: string) => {
      if (isBusy) return

      onInputChange(prompt)

      if (connected) {
        onQuickPrompt(prompt)
        return
      }

      setDemoMessages((current) => [
        ...current,
        { id: createMessageId(), role: 'user', content: prompt },
      ])
      setIsTyping(true)
      await sleep(2000)
      setIsTyping(false)
      setDemoMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: buildDemoReply(prompt, food, gym, recovery),
          status: 'done',
        },
      ])
    },
    [connected, food, gym, recovery, isBusy, onInputChange, onQuickPrompt],
  )

  const lastAssistantId = [...displayMessages]
    .reverse()
    .find((message) => message.role === 'assistant')?.id
  const isEmpty = displayMessages.length === 0 && !isTyping

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    setIsSheetOpen(false)
    setSidebarOpen(false)
  }, [routeLocation.pathname])

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
    const nearBottom = distanceFromBottom < 96
    pinnedToBottomRef.current = nearBottom
    setShowScrollFab(!nearBottom && displayMessages.length > 0)
  }

  useEffect(() => {
    if (!pinnedToBottomRef.current) return
    scrollToBottom(
      displayMessages.some((message) => message.streaming) || isTyping ? 'auto' : 'smooth',
    )
  }, [displayMessages, isTyping, scrollToBottom, clusterTurn.phase, clusterTurn.score])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSheetOpen) {
          setIsSheetOpen(false)
          return
        }
        if (loading) {
          event.preventDefault()
          onStop()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSheetOpen, loading, onStop])

  const handleFeedback = (messageId: string, vote: MessageFeedback) => {
    const previous = feedbackMap[messageId] ?? getFeedbackForMessage(messageId)
    if (previous === vote) return

    onMessageFeedback(messageId, vote)
    updateTrajectoryFeedback(messageId, vote)
    setFeedbackMap((current) => ({ ...current, [messageId]: vote }))
    toast(vote === 'up' ? t('toast.feedbackThanks') : t('toast.feedbackImprove'), 'success')
  }

  const runDemoAssistantReply = useCallback(
    async (userContent: string, baseMessages: ChatMessage[]) => {
      setDemoMessages(baseMessages)
      setIsTyping(true)
      await sleep(2000)
      setIsTyping(false)
      setDemoMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: buildDemoReply(userContent, food, gym, recovery),
          status: 'done',
        },
      ])
    },
    [food, gym, recovery],
  )

  const handleRegenerateClick = useCallback(() => {
    if (isBusy) return

    if (useDemo) {
      const lastAssistantIndex = demoMessages.findLastIndex((message) => message.role === 'assistant')
      if (lastAssistantIndex < 0) return

      const kept = demoMessages.slice(0, lastAssistantIndex)
      const lastUser = [...kept].reverse().find((message) => message.role === 'user')
      if (!lastUser) return

      toast(t('toast.regenerating'))
      void runDemoAssistantReply(lastUser.content, kept)
      return
    }

    toast(t('toast.regenerating'))
    void onRegenerate()
  }, [demoMessages, isBusy, onRegenerate, runDemoAssistantReply, toast, t, useDemo])

  const handleEditClick = useCallback(
    (messageId: string, content: string) => {
      if (isBusy) return

      if (useDemo) {
        const index = demoMessages.findIndex((message) => message.id === messageId)
        if (index === -1 || demoMessages[index]?.role !== 'user') return

        const editedMessage = { ...demoMessages[index], content }
        const kept = [...demoMessages.slice(0, index), editedMessage]

        toast(t('toast.editingResend'))
        void runDemoAssistantReply(content, kept)
        return
      }

      toast(t('toast.editingResend'))
      void onEditMessage(messageId, content)
    },
    [demoMessages, isBusy, onEditMessage, runDemoAssistantReply, toast, t, useDemo],
  )

  const handleRetryClick = useCallback(
    (messageId: string) => {
      if (isBusy) return

      if (useDemo) {
        const index = demoMessages.findIndex((message) => message.id === messageId)
        if (index === -1) return

        const kept = demoMessages.slice(0, index)
        const lastUser = [...kept].reverse().find((message) => message.role === 'user')
        if (!lastUser) return

        toast(t('toast.regenerating'))
        void runDemoAssistantReply(lastUser.content, kept)
        return
      }

      toast(t('toast.regenerating'))
      void onRetryMessage(messageId)
    },
    [demoMessages, isBusy, onRetryMessage, runDemoAssistantReply, toast, useDemo],
  )

  const typingBubble: ChatMessage = {
    id: '__typing__',
    role: 'assistant',
    content: '',
    streaming: true,
  }

  return (
    <AppShell>
      <PageTransition className="flex h-dvh flex-1 overflow-hidden p-3 lg:p-4">
        <div className="relative flex h-full min-h-0 w-full flex-1 gap-3 lg:gap-4">
          <ChatHistorySidebar
            className="hidden lg:flex"
            activeConversation={activeConversation}
            historyConversations={historyConversations}
            activeId={activeId}
            loading={loading}
            onCreate={onCreateConversation}
            onSelect={(id) => {
              onSelectConversation(id)
              setSidebarOpen(false)
            }}
            onDelete={onDeleteConversation}
            onOpenYiqidong={onOpenYiqidong}
            yiqidongUnread={yiqidongUnread}
          />

          {sidebarOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-emerald-950/10 backdrop-blur-sm lg:hidden"
                aria-label={t('chat.closeSidebar')}
                onClick={() => setSidebarOpen(false)}
              />
              <ChatHistorySidebar
                className="fixed bottom-3 left-3 top-3 z-50 lg:hidden"
                activeConversation={activeConversation}
                historyConversations={historyConversations}
                activeId={activeId}
                loading={loading}
                onCreate={onCreateConversation}
                onSelect={(id) => {
                  onSelectConversation(id)
                  setSidebarOpen(false)
                }}
                onDelete={onDeleteConversation}
                onOpenYiqidong={onOpenYiqidong}
                yiqidongUnread={yiqidongUnread}
              />
            </>
          )}

          <div className="burnpal-shell-panel relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="relative z-10 shrink-0 px-4 pt-4 pb-2 lg:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-body-secondary shadow-glass lg:hidden"
                aria-label={t('chat.openHistory')}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="lg:hidden">
                <BurnPalLogo compact />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <UserAccountAvatar showLabel={false} />
                <span
                  className={`text-xs font-medium ${connected ? 'text-emerald-500' : 'text-body-secondary'}`}
                >
                  {connected
                    ? loading
                      ? t('chat.statusWorking')
                      : t('chat.statusOnline')
                    : t('chat.statusOffline')}
                </span>
                {location && (
                  <span className="hidden text-xs text-body-secondary/70 sm:inline">
                    {formatLocationLabel(location.city, location.region)}
                  </span>
                )}
              </div>
            </div>
          </header>

          <ChatDashboardBar onOpenProfile={() => setProfileSheetOpen(true)} />

          {useDemo && (
            <div className="burnpal-chat-column px-5 pb-2">
              <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-2 text-center text-xs leading-relaxed text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                {t('chat.demoBanner')}
                <Link to="/settings" className="ml-1 font-semibold underline">
                  {t('chat.demoBannerLink')}
                </Link>
                {t('chat.demoBannerExtra')}
              </p>
            </div>
          )}

          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div
              className="burnpal-scroll-hidden min-h-0 flex-1 overflow-y-auto"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              <div className="burnpal-chat-column">
              {isEmpty ? (
                <div className="flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center px-2 py-10 text-center">
                  <h2 className="font-display-serif text-3xl font-semibold text-body-primary sm:text-[2.5rem]">
                    {t('chat.emptyTitle')}
                  </h2>
                  <p className="mt-3 max-w-xl text-base leading-relaxed text-body-secondary">
                    {t('chat.emptyHint')}
                  </p>
                </div>
              ) : (
                <div className="w-full py-4">
                  {!useDemo && (
                    <AgentPhaseRail
                      phase={clusterTurn.phase}
                      plan={clusterTurn.plan}
                      score={clusterTurn.score}
                    />
                  )}
                  <AnimatePresence initial={false}>
                    {displayMessages.map((message, index) => {
                      const prevMessage = index > 0 ? displayMessages[index - 1] : null
                      const inlineCards =
                        message.role === 'assistant' &&
                        !message.streaming &&
                        message.status !== 'error' &&
                        prevMessage?.role === 'user'
                          ? getConversationRecommendationCards(
                              prevMessage.content,
                              location,
                              food,
                              gym,
                              recovery,
                              { citeNearby: preferences.ai.citeNearby },
                            )
                          : []

                      return (
                        <div key={message.id}>
                          <ChatBubble
                            message={message}
                            isLastAssistant={message.id === lastAssistantId}
                            loading={isBusy}
                            feedback={feedbackMap[message.id] ?? getFeedbackForMessage(message.id)}
                            onRegenerate={handleRegenerateClick}
                            onEdit={(content) => handleEditClick(message.id, content)}
                            onRetry={() => handleRetryClick(message.id)}
                            onFeedback={(vote) => handleFeedback(message.id, vote)}
                          />
                          {inlineCards.length > 0 && (
                            <div className="mb-3 mt-1 flex flex-col gap-3 pl-14 pr-2">
                              {nearbyLoading ? (
                                <p className="text-xs text-body-secondary">{t('chat.nearbyLoading')}</p>
                              ) : (
                                inlineCards.map((card) => (
                                  <RichCard
                                    key={`${card.title}-${card.tag}`}
                                    {...card}
                                    onDetail={() => openSheet(card)}
                                  />
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {isTyping && (
                      <ChatBubble key="__typing__" message={typingBubble} loading={isBusy} />
                    )}
                  </AnimatePresence>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
              </div>
            </div>

            {showScrollFab && (
              <button
                type="button"
                className="glass-panel fixed bottom-40 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full text-emerald-500 shadow-glass"
                aria-label={t('chat.scrollToBottom')}
                onClick={() => {
                  pinnedToBottomRef.current = true
                  setShowScrollFab(false)
                  scrollToBottom()
                }}
              >
                ↓
              </button>
            )}

            <div className="relative z-20 shrink-0 px-4 pb-4 pt-2 lg:px-6">
              <div className="burnpal-shell-divider mb-3" aria-hidden="true" />
              <div className="burnpal-chat-column w-full max-w-none sm:max-w-[56rem]">
                <QuickActionBar
                  disabled={isBusy}
                  previews={quickActionPreviews}
                  onSelect={(prompt) => void handleQuickAction(prompt)}
                />
                <ChatComposer
                  input={input}
                  loading={loading}
                  connected={connected || useDemo}
                  onInputChange={onInputChange}
                  onSend={useDemo ? () => void handleQuickAction(input) : onSend}
                  onStop={onStop}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </PageTransition>

      <DetailBottomSheet
        open={isSheetOpen}
        data={sheetDetail}
        onClose={() => setIsSheetOpen(false)}
      />
      <TrainingProfileSheet
        open={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
      />
    </AppShell>
  )
}
