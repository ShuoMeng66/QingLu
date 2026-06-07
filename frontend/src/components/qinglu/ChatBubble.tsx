import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { splitAssistantStructured } from '../../lib/assistantStructured'
import type { ChatMessage } from '../../types/openclaw'
import { MarkdownContent } from '../MarkdownContent'
import { useI18n } from '../../hooks/useI18n'
import { QingluAvatar } from './QingluAvatar'

interface ChatBubbleProps {
  message: ChatMessage
  loading?: boolean
  onEdit?: (content: string) => void
}

const BUBBLE_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 }
const EDIT_TRANSITION = { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const }

function UserEditPanel({
  draft,
  onChange,
  onCancel,
  onSave,
  disabled,
}: {
  draft: string
  onChange: (value: string) => void
  onCancel: () => void
  onSave: () => void
  disabled?: boolean
}) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus()
      const length = textareaRef.current?.value.length ?? 0
      textareaRef.current?.setSelectionRange(length, length)
    }, 120)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <motion.div
      key="user-edit"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={EDIT_TRANSITION}
      className="glass-panel overflow-hidden rounded-[24px] shadow-glass"
    >
      <div className="border-b border-white/50 px-4 py-2.5 dark:border-white/10">
        <p className="text-xs font-medium text-slate-500">{t('action.editTitle')}</p>
      </div>
      <div className="p-3 pt-2">
        <textarea
          ref={textareaRef}
          value={draft}
          rows={Math.min(8, Math.max(3, draft.split('\n').length + 1))}
          disabled={disabled}
          className="w-full resize-y rounded-2xl border border-lime-100/80 bg-white/70 px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none transition-shadow focus:border-lime-300 focus:shadow-[0_0_0_3px_rgba(190,242,100,0.25)] disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/60"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              onSave()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              onCancel()
            }
          }}
        />
        <p className="mt-2 text-[11px] text-slate-400">{t('action.editHint')}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/60"
            disabled={disabled}
            onClick={onCancel}
          >
            {t('action.cancel')}
          </button>
          <button
            type="button"
            className="btn-vitality rounded-full px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
            disabled={disabled || !draft.trim()}
            onClick={onSave}
          >
            {t('action.saveSend')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export function ChatBubble({
  message,
  loading = false,
  onEdit,
}: ChatBubbleProps) {
  const { t } = useI18n()
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content)
  const isError = message.status === 'error'
  const isAborted = message.status === 'aborted'
  const isThinking = message.streaming && !message.content.trim()
  const hasJsonBlock = /---JSON_START---/i.test(message.content)
  const assistantDisplay =
    message.streaming && hasJsonBlock
      ? splitAssistantStructured(message.content).displayContent
      : message.content

  const cancelEdit = () => {
    setEditing(false)
    setDraft(message.content)
  }

  const handleSaveEdit = () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === message.content) {
      cancelEdit()
      return
    }
    setEditing(false)
    onEdit?.(trimmed)
  }

  const showUserActions = isUser && !editing && !loading

  if (isUser) {
    return (
      <motion.article
        className="relative z-10 flex justify-end px-4 py-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={BUBBLE_SPRING}
        layout="position"
      >
        <div className="max-w-[min(88%,42rem)]">
          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <UserEditPanel
                draft={draft}
                disabled={loading}
                onChange={setDraft}
                onCancel={cancelEdit}
                onSave={handleSaveEdit}
              />
            ) : (
              <motion.div
                key="user-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={EDIT_TRANSITION}
              >
                <div className="bubble-user rounded-2xl rounded-tr-sm px-5 py-3.5 text-base leading-relaxed">
                  {message.content}
                  {message.streaming && <span className="cursor-blink" />}
                </div>
                {showUserActions && (
                  <div className="mt-1.5 flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-full px-2 py-0.5 text-[11px] text-slate-500 transition hover:bg-white/50 hover:text-slate-700"
                      onClick={() => {
                        setDraft(message.content)
                        setEditing(true)
                      }}
                    >
                      {t('action.edit')}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article
      className="relative z-10 flex gap-2.5 px-4 py-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={BUBBLE_SPRING}
    >
      <QingluAvatar size={40} />
      <div className="min-w-0 max-w-[min(92%,44rem)] flex-1">
        <p className="mb-1 text-xs font-medium text-body-secondary">轻鹭</p>
        <div
          className={`ai-bubble-glass rounded-[20px] px-5 py-3.5 text-base leading-relaxed text-body-primary ${
            isError ? 'text-destructive' : ''
          } ${isAborted ? 'opacity-70' : ''}`}
        >
          {isThinking ? (
            <p className="text-sm text-slate-500">{t('chat.guardReviewing')}</p>
          ) : assistantDisplay ? (
            <MarkdownContent content={assistantDisplay} />
          ) : (
            <span className="text-gray-600">{t('chat.emptyReply')}</span>
          )}
          {message.streaming && !isThinking && <span className="cursor-blink" />}
        </div>
      </div>
    </motion.article>
  )
}
