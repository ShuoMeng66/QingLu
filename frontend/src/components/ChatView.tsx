import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  Menu,
  MessageSquarePlus,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { Link, useLocation as useRouteLocation, useNavigate } from 'react-router-dom'
import type { ChatMessage } from '../types/openclaw'
import type { ConnectionStatus } from '../types/openclaw'
import type { Conversation } from '../types/conversation'
import type { ClusterTurn, MessageFeedback } from '../types/agentCluster'
import type { YiqidongConfig } from '../lib/yiqidong'
import { getFeedbackForMessage } from '../lib/agentFeedback'
import { updateTrajectoryFeedback } from '../lib/trajectoryLogger'
import { useToast } from '../context/ToastContext'
import { usePreferences } from '../context/PreferencesContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { useNearbyRecommendations } from '../hooks/useNearbyRecommendations'
import { formatLocationLabel } from '../lib/citySkyline'
import { openSmartNavigation } from '../lib/openMaps'
import { getMessageRecommendationCards } from '../lib/assistantStructured'
import { FollowUpActions } from './qinglu/FollowUpActions'
import { MessageAssistantToolbar } from './qinglu/MessageAssistantToolbar'
import { enrichCardsWithGeocode } from '../lib/skillVenueMatch'
import { enrichCardsWithFacade } from '../lib/venueEnrichment'
import { debugPerf } from '../lib/debugPerf'
import { AppShell } from './qinglu/AppShell'
import { QingluLogo } from './qinglu/QingluLogo'
import { UserAccountAvatar } from './auth/UserAccountAvatar'
import { ChatBubble } from './qinglu/ChatBubble'
import { ChatComposer } from './qinglu/ChatComposer'
import { TodayStatusBar } from './qinglu/TodayStatusBar'
import { TodayStatusSheet } from './qinglu/TodayStatusSheet'
import { QingluDiscoveryCard } from './qinglu/QingluDiscoveryCard'
import { ChatEmptyQuickGrid } from './qinglu/ChatEmptyQuickGrid'
import { ChatHistorySidebar } from './qinglu/ChatHistorySidebar'
import { DetailBottomSheet, type DetailSheetData } from './qinglu/DetailBottomSheet'
import { TrainingProfileSheet } from './qinglu/TrainingProfileSheet'
import type { TaskSceneType } from '../lib/taskPrompts'
import { RichCard } from './qinglu/RichCard'
import { TakeoutVenueCard } from './qinglu/TakeoutVenueCard'
import { PageTransition } from './layout/PageTransition'
import { usePersistedBoolean } from '../hooks/usePersistedBoolean'

const STORAGE_HISTORY_COLLAPSED = 'qinglu.chat.historyCollapsed'

function ChromeToggleButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`glass-panel flex h-9 w-9 items-center justify-center rounded-full shadow-glass transition-colors ${
        active ? 'text-lime-700 ring-1 ring-lime-400/50' : 'text-body-secondary'
      }`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export interface QuickPromptMeta {
  starterId?: string
  interestId?: string
  sceneType?: TaskSceneType
  autoSend?: boolean
  /** 跟进按钮 / 建档后自动续问，不重复记入 pending */
  skipPendingRemember?: boolean
  isAutoFollowUp?: boolean
}

interface ChatViewProps {
  title: string
  messages: ChatMessage[]
  input: string
  loading: boolean
  connected: boolean
  status: ConnectionStatus
  statusMessage?: string
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
  onFollowUpAction?: (action: import('../types/openclaw').FollowUpActionMeta) => void
}


export function ChatView({
  messages,
  input,
  loading,
  connected,
  status,
  statusMessage,
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
  onFollowUpAction,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pinnedToBottomRef = useRef(true)
  const [showScrollFab, setShowScrollFab] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = usePersistedBoolean(STORAGE_HISTORY_COLLAPSED, false)
  const routeLocation = useRouteLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { preferences, t } = usePreferences()
  const [feedbackMap, setFeedbackMap] = useState<Record<string, MessageFeedback>>({})
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [sheetDetail, setSheetDetail] = useState<DetailSheetData | null>(null)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [todayStatusOpen, setTodayStatusOpen] = useState(false)
  const [discoveryHidden, setDiscoveryHidden] = useState(false)
  const [geoCardsByMessageId, setGeoCardsByMessageId] = useState<
    Record<string, DetailSheetData[]>
  >({})

  const { location } = useUserLocation({
    enabled: preferences.locationShare,
  })
  const { foodPlaces, gym, recovery, loading: nearbyLoading } =
    useNearbyRecommendations(location)

  const showNotConnectedBanner = !connected && status !== 'checking'
  const connectionLabel =
    status === 'checking'
      ? t('chat.statusChecking')
      : connected
        ? loading
          ? t('chat.statusWorking')
          : t('chat.statusOnline')
        : t('chat.statusOffline')
  const displayMessages = messages
  const isBusy = loading

  const venueCardsCacheRef = useRef<Record<string, DetailSheetData[]>>({})
  const lastVenueEnrichRef = useRef<{ messageId: string; contentLen: number } | null>(
    null,
  )

  useEffect(() => {
    if (!preferences.ai.citeNearby) {
      setGeoCardsByMessageId({})
      venueCardsCacheRef.current = {}
      return
    }

    let cancelled = false
    const effectStart = performance.now()

    void (async () => {
      // #region agent log
      debugPerf(
        'ChatView.tsx:venueCardsEffect',
        'effect_start',
        { messageCount: displayMessages.length },
        'A',
      )
      // #endregion

      let latestAssistant: ChatMessage | null = null
      let latestUser: ChatMessage | null = null
      for (let index = displayMessages.length - 1; index >= 1; index -= 1) {
        const message = displayMessages[index]
        const prevMessage = displayMessages[index - 1]
        if (
          message.role === 'assistant' &&
          !message.streaming &&
          message.status !== 'error' &&
          prevMessage?.role === 'user'
        ) {
          latestAssistant = message
          latestUser = prevMessage
          break
        }
      }

      const next: Record<string, DetailSheetData[]> = { ...venueCardsCacheRef.current }

      if (!latestAssistant || !latestUser) {
        if (!cancelled) setGeoCardsByMessageId(next)
        return
      }

      const skipEnrich =
        lastVenueEnrichRef.current?.messageId === latestAssistant.id &&
        lastVenueEnrichRef.current?.contentLen === latestAssistant.content.length &&
        venueCardsCacheRef.current[latestAssistant.id] != null

      if (skipEnrich) {
        // #region agent log
        debugPerf(
          'ChatView.tsx:venueCardsEffect',
          'skip_cached_latest',
          { messageId: latestAssistant.id },
          'A',
        )
        // #endregion
        if (!cancelled) setGeoCardsByMessageId(next)
        return
      }

      const base = getMessageRecommendationCards(
        latestAssistant.content,
        latestUser.content,
        location,
        foodPlaces,
        gym,
        recovery,
        {
          citeNearby: preferences.ai.citeNearby,
          assistantMeta: latestAssistant.assistantMeta,
        },
      )

      if (base.length === 0) {
        delete next[latestAssistant.id]
        venueCardsCacheRef.current = next
        if (!cancelled) setGeoCardsByMessageId(next)
        return
      }

      const geoStart = performance.now()
      const geocoded = await enrichCardsWithGeocode(base, location)
      if (cancelled) return

      const facadeStart = performance.now()
      const facaded = await enrichCardsWithFacade(geocoded, location)
      if (cancelled) return

      next[latestAssistant.id] = facaded
      venueCardsCacheRef.current = next
      lastVenueEnrichRef.current = {
        messageId: latestAssistant.id,
        contentLen: latestAssistant.content.length,
      }

      // #region agent log
      debugPerf(
        'ChatView.tsx:venueCardsEffect',
        'effect_done',
        {
          messageId: latestAssistant.id,
          cardCount: facaded.length,
          geoMs: Math.round(performance.now() - geoStart),
          facadeMs: Math.round(performance.now() - facadeStart),
          totalMs: Math.round(performance.now() - effectStart),
        },
        'A',
      )
      // #endregion

      setGeoCardsByMessageId(next)
    })()

    return () => {
      cancelled = true
    }
  }, [
    displayMessages,
    location?.lat,
    location?.lon,
    foodPlaces.length,
    gym?.id,
    recovery?.id,
    preferences.ai.citeNearby,
  ])

  const openSheet = useCallback((data: DetailSheetData) => {
    setSheetDetail(data)
    setIsSheetOpen(true)
  }, [])

  const handleQuickGridSelect = useCallback(
    (prompt: string, scene?: TaskSceneType) => {
      if (isBusy) return
      if (!connected) {
        toast(t('toast.needConnection'), 'error')
        navigate('/settings')
        return
      }
      onInputChange('')
      void onQuickPrompt(
        prompt,
        scene ? { sceneType: scene, autoSend: true } : { autoSend: true },
      )
    },
    [connected, isBusy, navigate, onInputChange, onQuickPrompt, t, toast],
  )

  const lastAssistantId = [...displayMessages]
    .reverse()
    .find((message) => message.role === 'assistant')?.id
  const isEmpty = displayMessages.length === 0

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
      displayMessages.some((message) => message.streaming) ? 'auto' : 'smooth',
    )
  }, [displayMessages, scrollToBottom, clusterTurn.phase, clusterTurn.score])

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

  const handleRegenerateClick = useCallback(() => {
    if (isBusy) return
    toast(t('toast.regenerating'))
    void onRegenerate()
  }, [isBusy, onRegenerate, toast, t])

  const handleEditClick = useCallback(
    (messageId: string, content: string) => {
      if (isBusy) return
      toast(t('toast.editingResend'))
      void onEditMessage(messageId, content)
    },
    [isBusy, onEditMessage, toast, t],
  )

  const handleRetryClick = useCallback(
    (messageId: string) => {
      if (isBusy) return
      toast(t('toast.regenerating'))
      void onRetryMessage(messageId)
    },
    [isBusy, onRetryMessage, toast, t],
  )

  return (
    <AppShell>
      <PageTransition className="flex h-dvh flex-1 overflow-hidden p-3 lg:p-4">
        <div className="relative flex h-full min-h-0 w-full flex-1 gap-3 lg:gap-4">
          {historyCollapsed && (
            <aside className="qinglu-shell-panel hidden w-12 shrink-0 flex-col items-center gap-2 py-4 lg:flex">
              <ChromeToggleButton
                label={t('chat.expandSidebar')}
                onClick={() => setHistoryCollapsed(false)}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </ChromeToggleButton>
              <button
                type="button"
                className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-lime-700 shadow-glass"
                aria-label={t('sidebar.newChat')}
                title={t('sidebar.newChat')}
                disabled={loading}
                onClick={onCreateConversation}
              >
                <MessageSquarePlus className="h-4 w-4" />
              </button>
            </aside>
          )}

          <ChatHistorySidebar
            className={`hidden lg:flex ${historyCollapsed ? 'lg:hidden' : ''}`}
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
                className="fixed inset-0 z-40 bg-lime-950/10 backdrop-blur-sm lg:hidden"
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

          <div className="qinglu-shell-panel relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="relative z-50 shrink-0 overflow-visible px-4 pt-4 pb-2 lg:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="glass-panel flex h-9 w-9 items-center justify-center rounded-full text-body-secondary shadow-glass lg:hidden"
                aria-label={t('chat.openHistory')}
                onClick={() => setSidebarOpen((open) => !open)}
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div className="lg:hidden">
                <QingluLogo compact />
              </div>
              <div className="chat-header-account ml-auto">
                <span
                  className={`hidden h-2 w-2 shrink-0 rounded-full lg:inline-block ${
                    connected || status === 'checking' ? 'bg-lime-500' : 'bg-slate-300'
                  }`}
                  title={statusMessage || connectionLabel}
                  aria-label={connectionLabel}
                />
                {location && (
                  <span className="chat-location-chip hidden sm:inline-flex">
                    {formatLocationLabel(location.city, location.region)}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  </span>
                )}
                <div className="hidden md:block">
                  <UserAccountAvatar showLabel />
                </div>
                <div className="md:hidden">
                  <UserAccountAvatar showLabel={false} />
                </div>
              </div>
            </div>
          </header>

          <TodayStatusBar
            onEdit={() => setTodayStatusOpen(true)}
            onSetupProfile={() => setProfileSheetOpen(true)}
          />

          {showNotConnectedBanner && (
            <div className="qinglu-chat-column px-4 pb-2">
              <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                {t('chat.notConnectedBanner')}
                {statusMessage ? ` ${statusMessage}` : t('chat.notConnectedBannerExtra')}
                <Link to="/settings" className="ml-1 font-semibold text-lime-700 underline">
                  {t('chat.notConnectedBannerLink')}
                </Link>
              </p>
            </div>
          )}

          <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className="chat-main-scroll qinglu-scroll-hidden min-h-0 flex-1 overflow-y-auto"
              ref={scrollRef}
              onScroll={handleScroll}
            >
              {!discoveryHidden && connected && (
                <QingluDiscoveryCard
                  onSendPrompt={(text) => void handleQuickGridSelect(text)}
                  onDismiss={() => setDiscoveryHidden(true)}
                />
              )}

              {isEmpty ? (
                <div className="qinglu-chat-empty-hero qinglu-chat-empty-hero--compact qinglu-chat-column">
                  <h2 className="font-display-serif text-body-primary">{t('chat.emptyTitle')}</h2>
                  <p className="text-body-secondary">{t('chat.emptyHint')}</p>
                </div>
              ) : (
                <div className="qinglu-chat-column w-full py-4">
                  <AnimatePresence initial={false}>
                    {displayMessages.map((message, index) => {
                      const prevMessage = index > 0 ? displayMessages[index - 1] : null
                      const inlineCardsBase =
                        message.role === 'assistant' &&
                        !message.streaming &&
                        message.status !== 'error' &&
                        prevMessage?.role === 'user'
                          ? getMessageRecommendationCards(
                              message.content,
                              prevMessage.content,
                              location,
                              foodPlaces,
                              gym,
                              recovery,
                              {
                                citeNearby: preferences.ai.citeNearby,
                                assistantMeta: message.assistantMeta,
                              },
                            )
                          : []
                      const followUps =
                        message.role === 'assistant' &&
                        !message.streaming &&
                        message.assistantMeta?.followUpActions?.length
                          ? message.assistantMeta.followUpActions
                          : []
                      const inlineCards =
                        geoCardsByMessageId[message.id] ?? inlineCardsBase
                      const isAssistantMessage = message.role === 'assistant'
                      const showAssistantToolbar =
                        isAssistantMessage &&
                        !message.streaming &&
                        message.status !== 'aborted' &&
                        (Boolean(message.content) || message.status === 'error')

                      return (
                        <div key={message.id} className={isAssistantMessage ? 'assistant-message-group' : undefined}>
                          <ChatBubble
                            message={message}
                            loading={isBusy}
                            onEdit={(content) => handleEditClick(message.id, content)}
                          />
                          {followUps.length > 0 && onFollowUpAction && (
                            <FollowUpActions
                              actions={followUps}
                              disabled={isBusy}
                              onAction={onFollowUpAction}
                            />
                          )}
                          {inlineCards.length > 0 && (
                            <div className="mb-3 mt-1 flex flex-col gap-3 pl-14 pr-2">
                              {nearbyLoading ? (
                                <p className="text-xs text-body-secondary">{t('chat.nearbyLoading')}</p>
                              ) : (
                                inlineCards.map((card) =>
                                  card.cardLayout === 'takeout' ? (
                                    <TakeoutVenueCard
                                      key={`takeout-${card.title}`}
                                      title={card.title}
                                      titleLink={card.titleLink}
                                      galleryImages={card.galleryImages}
                                      intro={card.intro}
                                      bullets={card.bullets}
                                      tags={card.tags}
                                      listingUrl={card.listingUrl}
                                      city={card.city}
                                      onDetail={() => openSheet(card)}
                                    />
                                  ) : (
                                    <RichCard
                                      key={`${card.title}-${card.tag}`}
                                      {...card}
                                      onNavigate={
                                        card.lat != null && card.lon != null
                                          ? () =>
                                              openSmartNavigation(
                                                card.lat!,
                                                card.lon!,
                                                card.title,
                                                location
                                                  ? {
                                                      lat: location.lat,
                                                      lon: location.lon,
                                                    }
                                                  : undefined,
                                                {
                                                  country: location?.country,
                                                  region: location?.region,
                                                },
                                              )
                                          : undefined
                                      }
                                      onDetail={() => openSheet(card)}
                                    />
                                  ),
                                )
                              )}
                            </div>
                          )}
                          {showAssistantToolbar && (
                            <MessageAssistantToolbar
                              content={message.content}
                              isLastAssistant={message.id === lastAssistantId}
                              loading={isBusy}
                              isError={message.status === 'error'}
                              feedback={feedbackMap[message.id] ?? getFeedbackForMessage(message.id)}
                              onRegenerate={handleRegenerateClick}
                              onRetry={() => handleRetryClick(message.id)}
                              onFeedback={(vote) => handleFeedback(message.id, vote)}
                            />
                          )}
                        </div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>

            {showScrollFab && !isEmpty && (
              <button
                type="button"
                className="glass-panel fixed bottom-52 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full text-lime-600 shadow-glass"
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

            <div className="chat-sticky-footer relative z-20">
              <div className="qinglu-chat-column w-full max-w-none sm:max-w-[56rem]">
                <ChatEmptyQuickGrid
                  variant="footer"
                  disabled={isBusy}
                  onSelect={handleQuickGridSelect}
                />
                <ChatComposer
                  input={input}
                  loading={loading}
                  connected={connected}
                  onInputChange={onInputChange}
                  onSend={onSend}
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
      <TodayStatusSheet open={todayStatusOpen} onClose={() => setTodayStatusOpen(false)} />
    </AppShell>
  )
}
