import { useCallback, useEffect, useRef, useState } from 'react'
import { loadAppPreferences } from '../lib/appPreferences'
import { translate } from '../lib/i18n/messages'
import { sendChat, streamChat } from '../lib/openclaw'
import { createMessageId } from '../lib/storage'
import { debugPerf } from '../lib/debugPerf'
import type { ChatMessage, OpenClawConfig } from '../types/openclaw'

export interface StreamRevealContext {
  userMessage: string
}

export interface StreamSendOptions {
  systemPrompt?: string
  onAssistantDone?: (content: string, assistantId: string) => void | Promise<void>
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

  const abortStream = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => {
    abortStream()
    setLoading(false)
    streamConversationRef.current = null
  }, [activeId, abortStream])

  useEffect(() => () => abortStream(), [abortStream])

  const revealAssistant = useCallback(
    async (
      conversationId: string,
      assistantId: string,
      draft: string,
      apiMessages: ChatMessage[],
      options?: StreamSendOptions,
    ) => {
      const userMessage = lastUserMessage(apiMessages)
      let finalContent = draft
      const revealStart = performance.now()

      // #region agent log
      debugPerf(
        'useChatStream.ts:revealAssistant',
        'reveal_start',
        { draftLen: draft.length, hasGuard: Boolean(options?.onBeforeReveal) },
        'C',
      )
      // #endregion

      try {
        options?.onReviewPhase?.(true)
        if (options?.onBeforeReveal) {
          finalContent = await options.onBeforeReveal(draft, { userMessage })
        }
      } finally {
        options?.onReviewPhase?.(false)
      }

      // #region agent log
      debugPerf(
        'useChatStream.ts:revealAssistant',
        'reveal_done',
        {
          finalLen: finalContent.length,
          totalMs: Math.round(performance.now() - revealStart),
        },
        'C',
      )
      // #endregion

      patchMessages(conversationId, (current) =>
        current.map((message) =>
          message.id === assistantId
            ? finalizeAssistant(message, { content: finalContent, status: 'done' })
            : message,
        ),
      )

      if (finalContent.trim() && options?.onAssistantDone) {
        await options.onAssistantDone(finalContent, assistantId)
      }
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
      const assistantId = createMessageId()
      const controller = new AbortController()
      const systemPrompt = mergedOptions?.systemPrompt
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

      try {
        await streamChat(
          config,
          apiMessages,
          conversationId,
          {
            onDelta: (delta) => {
              draftRef.current += delta
            },
            onDone: () => {
              void revealAssistant(
                conversationId,
                assistantId,
                draftRef.current,
                apiMessages,
                mergedOptions,
              )
            },
            onError: async (message) => {
              if (controller.signal.aborted) return

              try {
                const fallback = await sendChat(
                  config,
                  apiMessages,
                  conversationId,
                  controller.signal,
                  systemPrompt,
                )
                await revealAssistant(
                  conversationId,
                  assistantId,
                  fallback,
                  apiMessages,
                  mergedOptions,
                )
              } catch {
                if (controller.signal.aborted) return
                patchMessages(conversationId, (current) =>
                  current.map((item) =>
                    item.id === assistantId
                      ? finalizeAssistant(item, { content: message, status: 'error' })
                      : item,
                  ),
                )
                toast(t('toast.sendFailed'), 'error')
              }
            },
          },
          controller.signal,
          systemPrompt,
        )
      } catch (error) {
        if (controller.signal.aborted) return

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
        if (streamConversationRef.current === conversationId) {
          setLoading(false)
          abortRef.current = null
          streamConversationRef.current = null
        }
      }
    },
    [config, getStreamSendOptions, patchMessages, revealAssistant, toast],
  )

  const handleSend = useCallback(
    async (content: string, options?: StreamSendOptions) => {
      const trimmed = content.trim()
      if (!trimmed || loading) return

      if (!connected) {
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
    patchMessages(conversationId, (current) =>
      current.map((message) => {
        if (!message.streaming) return message
        return finalizeAssistant(message, {
          status: message.content ? 'done' : 'aborted',
          content: message.content || t('chat.stopped'),
        })
      }),
    )

    setLoading(false)
    streamConversationRef.current = null
    toast(t('toast.stopped'))
  }, [activeId, abortStream, loading, patchMessages, toast])

  const handleRegenerate = useCallback(async () => {
    if (loading || !connected) return

    const lastAssistantIndex = messages.findLastIndex((message) => message.role === 'assistant')
    if (lastAssistantIndex < 0) return

    const apiMessages = messages.slice(0, lastAssistantIndex)
    if (!apiMessages.some((message) => message.role === 'user')) return

    patchMessages(activeId, apiMessages)
    await runStream(activeId, apiMessages)
  }, [activeId, connected, loading, messages, patchMessages, runStream])

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim()
      if (!trimmed || loading) return

      const index = messages.findIndex((message) => message.id === messageId)
      if (index === -1 || messages[index]?.role !== 'user') return

      const editedMessage = { ...messages[index], content: trimmed }
      const apiMessages = [...messages.slice(0, index), editedMessage]

      patchMessages(activeId, apiMessages)
      await runStream(activeId, apiMessages)
    },
    [activeId, loading, messages, patchMessages, runStream],
  )

  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      if (loading) return

      const index = messages.findIndex((message) => message.id === messageId)
      if (index === -1 || messages[index]?.role !== 'assistant') return

      const apiMessages = messages.slice(0, index)
      if (apiMessages.length === 0) return

      patchMessages(activeId, apiMessages)
      await runStream(activeId, apiMessages)
    },
    [activeId, loading, messages, patchMessages, runStream],
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
