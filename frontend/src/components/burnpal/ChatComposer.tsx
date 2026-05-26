import { Mic, MicOff, Send, Square } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../hooks/useI18n'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'

interface ChatComposerProps {
  input: string
  loading: boolean
  connected: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
}

export function ChatComposer({
  input,
  loading,
  connected,
  onInputChange,
  onSend,
  onStop,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceBaseRef = useRef('')
  const { t } = useI18n()
  const { toast } = useToast()

  const appendTranscript = (base: string, chunk: string) => {
    const trimmedChunk = chunk.trim()
    if (!trimmedChunk) return base
    if (!base.trim()) return trimmedChunk
    const separator = /[\s，。！？,.!?]$/.test(base) ? '' : ' '
    return `${base}${separator}${trimmedChunk}`
  }

  const { listening, supported, toggle, stop } = useSpeechRecognition({
    lang: 'zh-CN',
    onInterim: (transcript) => {
      onInputChange(appendTranscript(voiceBaseRef.current, transcript))
    },
    onFinal: (transcript) => {
      const next = appendTranscript(voiceBaseRef.current, transcript)
      voiceBaseRef.current = next
      onInputChange(next)
    },
    onError: (message) => {
      toast(message, 'error')
    },
  })

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`
  }, [input])

  useEffect(() => {
    if (loading && listening) stop()
  }, [loading, listening, stop])

  const handleVoiceToggle = () => {
    if (loading) return

    if (!supported) {
      toast(t('toast.voiceUnsupported'), 'error')
      return
    }

    if (listening) {
      stop()
      return
    }

    voiceBaseRef.current = input
    toast(t('toast.voiceStarted'))
    toggle()
  }

  const inputEnabled = connected && !loading

  return (
    <form
      className="glass-input flex min-h-[3.75rem] w-full items-end gap-3 rounded-[28px] px-5 py-3.5 shadow-glass"
      onSubmit={(event) => {
        event.preventDefault()
        if (loading) {
          onStop()
          return
        }
        if (listening) stop()
        onSend()
      }}
    >
      <button
        type="button"
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
          listening
            ? 'bg-red-100 text-red-500 ring-2 ring-red-300/60 dark:bg-red-950/40 dark:text-red-400'
            : 'text-body-secondary hover:bg-white/40'
        }`}
        aria-label={listening ? t('composer.voiceStop') : t('composer.voiceStart')}
        aria-pressed={listening}
        disabled={!inputEnabled}
        onClick={handleVoiceToggle}
      >
        {listening ? (
          <MicOff className="h-4 w-4 animate-pulse" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4" aria-hidden="true" />
        )}
        {listening && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
        )}
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        rows={1}
        placeholder={
          listening
            ? t('toast.voiceListening')
            : connected
              ? loading
                ? t('chat.placeholderGenerating')
                : t('chat.placeholderReady')
              : t('chat.placeholderOffline')
        }
        disabled={!inputEnabled}
        className="min-h-[28px] max-h-[200px] flex-1 resize-none border-0 bg-transparent py-1.5 text-base leading-relaxed text-gray-900 outline-none placeholder:text-gray-600"
        onChange={(event) => {
          if (listening) stop()
          onInputChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (loading) {
              onStop()
              return
            }
            if (listening) stop()
            onSend()
          }
        }}
      />
      {loading ? (
        <button
          type="button"
          className="btn-vitality flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          aria-label={t('composer.stopGenerate')}
          onClick={onStop}
        >
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="submit"
          className="btn-vitality flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
          disabled={!connected || !input.trim()}
          aria-label={t('composer.send')}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  )
}
