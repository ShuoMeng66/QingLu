import { useState } from 'react'
import type { MessageFeedback } from '../../types/agentCluster'
import { useI18n } from '../../hooks/useI18n'

interface MessageAssistantToolbarProps {
  content: string
  isLastAssistant?: boolean
  loading?: boolean
  isError?: boolean
  feedback?: MessageFeedback | null
  onRegenerate?: () => void
  onRetry?: () => void
  onFeedback?: (vote: MessageFeedback) => void
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function MessageAssistantToolbar({
  content,
  isLastAssistant = false,
  loading = false,
  isError = false,
  feedback = null,
  onRegenerate,
  onRetry,
  onFeedback,
}: MessageAssistantToolbarProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const showActions = Boolean(content || isError)
  const showFeedback = !isError && Boolean(content)

  if (!showActions && !showFeedback) return null

  const handleCopy = async () => {
    await copyText(content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="message-assistant-toolbar" role="toolbar" aria-label={t('action.copy')}>
      {showActions && (
        <button
          type="button"
          className="message-assistant-toolbar__action"
          onClick={() => void handleCopy()}
        >
          {copied ? t('action.copied') : t('action.copy')}
        </button>
      )}
      {showActions && isLastAssistant && !isError && (
        <button
          type="button"
          className="message-assistant-toolbar__action"
          disabled={loading}
          onClick={onRegenerate}
        >
          {loading ? t('action.regenerating') : t('action.regenerate')}
        </button>
      )}
      {showActions && isError && (
        <button
          type="button"
          className="message-assistant-toolbar__action message-assistant-toolbar__action--retry"
          disabled={loading}
          onClick={onRetry}
        >
          {t('action.retry')}
        </button>
      )}
      {showFeedback && (
        <>
          <button
            type="button"
            aria-pressed={feedback === 'up'}
            className={`message-assistant-toolbar__action ${
              feedback === 'up' ? 'message-assistant-toolbar__action--active-up' : ''
            }`}
            onClick={() => onFeedback?.('up')}
          >
            {feedback === 'up' ? t('action.helpfulMarked') : t('action.helpful')}
          </button>
          <button
            type="button"
            aria-pressed={feedback === 'down'}
            className={`message-assistant-toolbar__action ${
              feedback === 'down' ? 'message-assistant-toolbar__action--active-down' : ''
            }`}
            onClick={() => onFeedback?.('down')}
          >
            {feedback === 'down' ? t('action.improveMarked') : t('action.improve')}
          </button>
        </>
      )}
    </div>
  )
}
