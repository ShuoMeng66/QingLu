import { useCallback, useEffect, useRef, useState } from 'react'
import { loadAppPreferences } from '../lib/appPreferences'
import { translate } from '../lib/i18n/messages'
import { sendChat, streamChat } from '../lib/openclaw'
import { createMessageId } from '../lib/storage'
import { debugPerf } from '../lib/debugPerf'
import { splitAssistantStructured } from '../lib/assistantStructured'
import {
  buildSceneDraft,
  isDemoPresentationEnabled,
  matchDemoScene,
  resolveDemoStreamOptions,
  streamDemoDraft,
} from '../demoPresentation'
import { applyDemoProfile } from '../lib/demoProfiles'
import type { ChatMessage, OpenClawConfig } from '../types/openclaw'

export interface StreamRevealContext {
  userMessage: string
  /** Full model draft before display strip */
  rawDraft: string
  /** Rich cards / structured payload present (JSON block) */
  hasStructuredPayload: boolean
}

export interface StreamSendOptions {
  systemPrompt?: string
  /** Rebuild skill prompt from last user turn (regenerate / edit / retry) */
  resolveSystemPrompt?: (
    messages: ChatMessage[],
  ) => string | undefined | Promise<string | undefined>
  onAssistantDone?: (
    content: string,
    assistantId: string,
    meta?: import('../types/openclaw').AssistantMessageMeta,
    rawDraft?: string,
  ) => void | Promise<void>
  /** Run after model finishes, before user sees assistant text */
  onBeforeReveal?: (draft: string, ctx: StreamRevealContext) => Promise<string>
  onReviewPhase?: (active: boolean) => void
}

interface UseChatStreamOptions {
  config: OpenClawConfig
  connected: boolean
  activeId: string
  messages: ChatMessage[]
  updateConversationMessages: (
    id: string,
    next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
  ) => void
  onNeedSettings: () => void
  toast: (message: string, type?: 'success' | 'error') => void
  /** Merged into every runStream call (send / regenerate / retry) */
  getStreamSendOptions?: () => StreamSendOptions | undefined
}

function finalizeAssistant(
  message: ChatMessage,
  patch: Partial<ChatMessage>,
): ChatMessage {
  return { ...message, streaming: false, ...patch }
}

function t(key: Parameters<typeof translate>[1]) {
  return translate(loadAppPreferences().locale, key)
}

function lastUserMessage(apiMessages: ChatMessage[]): string {
  for (let i = apiMessages.length - 1; i >= 0; i -= 1) {
    if (apiMessages[i]?.role === 'user') return apiMessages[i].content
  }
  return ''
}

function mergeStreamOptions(
  base?: StreamSendOptions,
  extra?: StreamSendOptions,
): StreamSendOptions | undefined {
  if (!base && !extra) return undefined
  return { ...base, ...extra }
}

function finalizeStreamingMessages(
  messages: ChatMessage[],
  fallbackContent: string,
): ChatMessage[] {
  return messages.map((message) => {
    if (!message.streaming) return message
    return finalizeAssistant(message, {
      status: message.content ? 'done' : 'aborted',
      content: message.content || fallbackContent,
    })
  })
}

export function useChatStream({
  config,
  connected,
  activeId,
  messages,
  updateConversationMessages,
  onNeedSettings,
  toast,
  getStreamSendOptions,
}: UseChatStreamOptions) {
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const streamConversationRef = useRef<string | null>(null)

  const patchMessages = useCallback(
    (
      conversationId: string,
      next: ChatMessage[] | ((current: ChatMessage[]) => ChatMessage[]),
    ) => {
      updateConversationMessages(conversationId, next)
    },
    [updateConversationMessages],
  )

  const finalizeConversationStreaming = useCallback(
    (conversationId: string) => {
      patchMessages(conversationId, (current) =>
        finalizeStreamingMessages(current, t('chat.stopped')),
      )
    },
    [patchMessages],
  )

  const abortStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => {
    const streamingConv = streamConversationRef.current
    abortStream()
    if (streamingConv) {
      finalizeConversationStreaming(streamingConv)
    }
    setLoading(false)
    streamConversationRef.current = null
  }, [activeId, abortStream, finalizeConversationStreaming])

  useEffect(() => () => abortStream(), [abortStream])

  const revealAssistant = useCallback(
    async (
      conversationId: string,
      assistantId: string,
      draft: string,
      apiMessages: ChatMessage[],
      options: StreamSendOptions | undefined,
      signal: AbortSignal,
    ): Promise<boolean> => {
      if (signal.aborted) return false
      if (streamConversationRef.current !== conversationId) return false

      const userMessage = lastUserMessage(apiMessages)
      const revealStart = performance.now()

      debugPerf(
        'useChatStream.ts:revealAssistant',
        'reveal_start',
        { draftLen: draft.length, hasGuard: Boolean(options?.onBeforeReveal) },
        'C',
      )

      const structured = splitAssistantStructured(draft)
      let displayContent = structured.displayContent
      const revealCtx: StreamRevealContext = {
        userMessage,
        rawDraft: draft,
        hasStructuredPayload: Boolean(structured.payload || structured.meta?.structuredPayload),
      }

      try {
        options?.onReviewPhase?.(true)
        if (options?.onBeforeReveal) {
          displayContent = await options.onBeforeReveal(displayContent, revealCtx)
        }
      } finally {
        options?.onReviewPhase?.(false)
      }

      if (signal.aborted || streamConversationRef.current !== conversationId) {
        return false
      }
      const finalContent = displayContent
      const assistantMeta = structured.meta ?? undefined

      debugPerf(
        'useChatStream.ts:revealAssistant',
        'reveal_done',
        {
          finalLen: finalContent.length,
          totalMs: Math.round(performance.now() - revealStart),
        },
        'C',
      )

      patchMessages(conversationId, (current) =>
        current.map((message) =>
          message.id === assistantId
            ? finalizeAssistant(message, {
                content: finalContent,
                status: 'done',
                assistantMeta,
              })
            : message,
        ),
      )

      if (finalContent.trim() && options?.onAssistantDone) {
        await options.onAssistantDone(finalContent, assistantId, assistantMeta, draft)
      }

      return true
    },
    [patchMessages],
  )

  const runStream = useCallback(
    async (
      conversationId: string,
      apiMessages: ChatMessage[],
      options?: StreamSendOptions,
    ) => {
      const mergedOptions = mergeStreamOptions(getStreamSendOptions?.(), options)

      if (isDemoPresentationEnabled()) {
        const userText = lastUserMessage(apiMessages)
        const scene = matchDemoScene(userText)
        if (!scene) return

        if (scene.profileId) {
          applyDemoProfile(scene.profileId)
        }

        const assistantId = createMessageId()
        const controller = new AbortController()
        const draft = buildSceneDraft(scene)
        const { charsPerTick, tickMs } = resolveDemoStreamOptions(scene)

        abortRef.current = controller
        streamConversationRef.current = conversationId
        setLoading(true)

        patchMessages(conversationId, (current) => [
          ...current,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
            streaming: true,
          },
        ])

        const finishStream = () => {
          if (streamConversationRef.current === conversationId) {
            setLoading(false)
            abortRef.current = null
            streamConversationRef.current = null
          }
        }

        try {
          await streamDemoDraft({
            draft,
            conversationId,
            assistantId,
            charsPerTick,
            tickMs,
            signal: controller.signal,
            isActive: () => streamConversationRef.current === conversationId,
            onContent: (content) => {
              patchMessages(conversationId, (current) =>
                current.map((item) =>
                  item.id === assistantId
                    ? { ...item, content, streaming: true }
                    : item,
                ),
              )
            },
          })

          if (controller.signal.aborted) {
            finalizeConversationStreaming(conversationId)
            return
          }

          if (streamConversationRef.current === conversationId) {
            await revealAssistant(
              conversationId,
              assistantId,
              draft,
              apiMessages,
              mergedOptions,
              controller.signal,
            )
          }
        } finally {
          finishStream()
        }
        return
      }

      const assistantId = createMessageId()
      const controller = new AbortController()
      let systemPrompt = mergedOptions?.systemPrompt
      if (!systemPrompt?.trim() && mergedOptions?.resolveSystemPrompt) {
        systemPrompt = await Promise.resolve(mergedOptions.resolveSystemPrompt(apiMessages))
      }
      const draftRef = { current: '' }

      abortRef.current = controller
      streamConversationRef.current = conversationId
      setLoading(true)

      patchMessages(conversationId, (current) => [
        ...current,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          streaming: true,
        },
      ])

      const finishStream = () => {
        if (streamConversationRef.current === conversationId) {
          setLoading(false)
          abortRef.current = null
          streamConversationRef.current = null
        }
      }

      let streamFailed = false
      let streamErrorMessage = ''

      try {
        await streamChat(
          config,
          apiMessages,
          conversationId,
          {
            onDelta: (delta) => {
              if (controller.signal.aborted) return
              draftRef.current += delta
              if (streamConversationRef.current !== conversationId) return
              patchMessages(conversationId, (current) =>
                current.map((item) =>
                  item.id === assistantId
                    ? { ...item, content: draftRef.current, streaming: true }
                    : item,
                ),
              )
            },
            onDone: () => {
              /* reveal after streamChat resolves */
            },
            onError: (message) => {
              streamFailed = true
              streamErrorMessage = message
            },
          },
          controller.signal,
          systemPrompt,
        )

        if (controller.signal.aborted) {
          finalizeConversationStreaming(conversationId)
          return
        }

        if (streamFailed) {
          try {
            const fallback = await sendChat(
              config,
              apiMessages,
              conversationId,
              controller.signal,
              systemPrompt,
            )
            if (
              !controller.signal.aborted &&
              streamConversationRef.current === conversationId
            ) {
              await revealAssistant(
                conversationId,
                assistantId,
                fallback,
                apiMessages,
                mergedOptions,
                controller.signal,
              )
            }
          } catch {
            if (controller.signal.aborted) {
              finalizeConversationStreaming(conversationId)
              return
            }
            patchMessages(conversationId, (current) =>
              current.map((item) =>
                item.id === assistantId
                  ? finalizeAssistant(item, {
                      content: streamErrorMessage,
                      status: 'error',
                    })
                  : item,
              ),
            )
            toast(t('toast.sendFailed'), 'error')
          }
          return
        }

        if (streamConversationRef.current === conversationId) {
          await revealAssistant(
            conversationId,
            assistantId,
            draftRef.current,
            apiMessages,
            mergedOptions,
            controller.signal,
          )
        }
      } catch (error) {
        if (controller.signal.aborted) {
          finalizeConversationStreaming(conversationId)
          return
        }

        const message = error instanceof Error ? error.message : t('toast.sendFailed')
        patchMessages(conversationId, (current) =>
          current.map((item) =>
            item.id === assistantId
              ? finalizeAssistant(item, { content: message, status: 'error' })
              : item,
          ),
        )
        toast(t('toast.sendFailed'), 'error')
      } finally {
        finishStream()
      }
    },
    [
      config,
      finalizeConversationStreaming,
      getStreamSendOptions,
      patchMessages,
      revealAssistant,
      toast,
    ],
  )

  const handleSend = useCallback(
    async (content: string, options?: StreamSendOptions) => {
      const trimmed = content.trim()
      if (!trimmed || loading) return

      if (!connected && !isDemoPresentationEnabled()) {
        toast(t('toast.needConnection'), 'error')
        onNeedSettings()
        return
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmed,
      }
      const apiMessages = [...messages, userMessage]

      patchMessages(activeId, apiMessages)
      await runStream(activeId, apiMessages, options)
    },
    [activeId, connected, loading, messages, onNeedSettings, patchMessages, runStream, toast],
  )

  const handleStop = useCallback(() => {
    if (!loading) return

    const conversationId = streamConversationRef.current ?? activeId

    abortStream()
    finalizeConversationStreaming(conversationId)

    setLoading(false)
    streamConversationRef.current = null
    toast(t('toast.stopped'))
  }, [activeId, abortStream, finalizeConversationStreaming, loading, toast])

  const requireConnected = useCallback(() => {
    if (connected || isDemoPresentationEnabled()) return true
    toast(t('toast.needConnection'), 'error')
    onNeedSettings()
    return false
  }, [connected, onNeedSettings, toast])

  const handleRegenerate = useCallback(async () => {
    if (loading || !requireConnected()) return

    const lastAssistantIndex = messages.findLastIndex((message) => message.role === 'assistant')
    if (lastAssistantIndex < 0) return

    const apiMessages = messages.slice(0, lastAssistantIndex)
    if (!apiMessages.some((message) => message.role === 'user')) return

    patchMessages(activeId, apiMessages)
    await runStream(activeId, apiMessages)
  }, [activeId, loading, messages, patchMessages, requireConnected, runStream])

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim()
      if (!trimmed || loading || !requireConnected()) return

      const index = messages.findIndex((message) => message.id === messageId)
      if (index === -1 || messages[index]?.role !== 'user') return

      const editedMessage = { ...messages[index], content: trimmed }
      const apiMessages = [...messages.slice(0, index), editedMessage]

      patchMessages(activeId, apiMessages)
      await runStream(activeId, apiMessages)
    },
    [activeId, loading, messages, patchMessages, requireConnected, runStream],
  )

  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      if (loading || !requireConnected()) return

      const index = messages.findIndex((message) => message.id === messageId)
      if (index === -1 || messages[index]?.role !== 'assistant') return

      const apiMessages = messages.slice(0, index)
      if (apiMessages.length === 0) return

      patchMessages(activeId, apiMessages)
      await runStream(activeId, apiMessages)
    },
    [activeId, loading, messages, patchMessages, requireConnected, runStream],
  )

  return {
    loading,
    handleSend,
    handleStop,
    handleRegenerate,
    handleEditMessage,
    handleRetryMessage,
    abortStream,
  }
}
