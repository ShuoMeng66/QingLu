import { useState } from 'react'
import type { ChatMessage } from '../types/openclaw'
import type { MessageFeedback } from '../types/agentCluster'
import { QINGLU } from '../data/qingluAssets'
import { MarkdownContent } from './MarkdownContent'

interface MessageBubbleProps {
  message: ChatMessage
  isLastAssistant?: boolean
  loading?: boolean
  feedback?: MessageFeedback | null
  onRegenerate?: () => void
  onEdit?: (content: string) => void
  onRetry?: () => void
  onFeedback?: (vote: MessageFeedback) => void
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

export function MessageBubble({
  message,
  isLastAssistant = false,
  loading = false,
  feedback = null,
  onRegenerate,
  onEdit,
  onRetry,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const isError = message.status === 'error'
  const isAborted = message.status === 'aborted'

  const handleCopy = async () => {
    await copyText(message.content)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const handleSaveEdit = () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === message.content) {
      setEditing(false)
      setDraft(message.content)
      return
    }
    onEdit?.(trimmed)
    setEditing(false)
  }

  const showAssistantActions =
    !isUser && !message.streaming && !editing && (message.content || isError)
  const showUserActions = isUser && !editing && !loading

  const showFeedback =
    !isUser && !message.streaming && !editing && message.status === 'done' && message.content

  return (
    <article
      className={`message ${isUser ? 'message--user' : 'message--assistant'} ${
        isError ? 'message--error' : ''
      } ${isAborted ? 'message--aborted' : ''}`}
    >
      <div className="message__avatar">
        {isUser ? (
          '你'
        ) : (
          <img src={QINGLU.avatar} alt="" className="message__avatar-img" />
        )}
      </div>
      <div className="message__body">
        <div className="message__head">
          <p className="message__meta">{isUser ? '你' : QINGLU.name}</p>
          {(showAssistantActions || showUserActions) && (
            <div className="message__actions">
              <button type="button" className="message-action pressable" onClick={() => void handleCopy()}>
                {copied ? '已复制' : '复制'}
              </button>
              {showUserActions && (
                <button
                  type="button"
                  className="message-action pressable"
                  onClick={() => {
                    setDraft(message.content)
                    setEditing(true)
                  }}
                >
                  编辑
                </button>
              )}
              {showAssistantActions && isLastAssistant && !isError && (
                <button
                  type="button"
                  className="message-action pressable"
                  disabled={loading}
                  onClick={onRegenerate}
                >
                  重新生成
                </button>
              )}
              {showAssistantActions && isError && (
                <button
                  type="button"
                  className="message-action pressable"
                  disabled={loading}
                  onClick={onRetry}
                >
                  重试
                </button>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <div className="message__editor">
            <textarea
              value={draft}
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault()
                  handleSaveEdit()
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setEditing(false)
                  setDraft(message.content)
                }
              }}
            />
            <div className="message__editor-actions">
              <button type="button" className="btn btn--ghost pressable" onClick={() => setEditing(false)}>
                取消
              </button>
              <button type="button" className="btn btn--primary pressable" onClick={handleSaveEdit}>
                保存并发送
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`message__content ${isUser ? '' : 'message__content--markdown'}`}>
              {isUser ? message.content : <MarkdownContent content={message.content} />}
              {message.streaming && <span className="cursor-blink" />}
            </div>
            {showFeedback && (
              <div className="message__feedback" role="group" aria-label="回答反馈">
                <button
                  type="button"
                  className={`message-feedback pressable ${feedback === 'up' ? 'is-active' : ''}`}
                  onClick={() => onFeedback?.('up')}
                >
                  有帮助
                </button>
                <button
                  type="button"
                  className={`message-feedback pressable ${feedback === 'down' ? 'is-active' : ''}`}
                  onClick={() => onFeedback?.('down')}
                >
                  需改进
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  )
}
