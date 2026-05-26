import { useEffect, useState } from 'react'
import type { YiqidongConfig } from '../../lib/yiqidong'
import {
  countUnreadLetters,
  getYiqidongLetters,
  syncYiqidongLetters,
} from '../../lib/yiqidongEnvelopes'
import { EnvelopeModal } from './EnvelopeModal'
import './YiqidongEnvelope.css'

interface YiqidongEnvelopeProps {
  config: YiqidongConfig
  onApply: (config: YiqidongConfig) => void
}

export function YiqidongEnvelope({ config, onApply }: YiqidongEnvelopeProps) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const letters = syncYiqidongLetters(config)
    setUnread(countUnreadLetters(letters))
  }, [config])

  const handleApply = (next: YiqidongConfig) => {
    onApply(next)
    const letters = syncYiqidongLetters(next)
    setUnread(countUnreadLetters(letters))
  }

  const handleClose = () => {
    setOpen(false)
    setUnread(countUnreadLetters(getYiqidongLetters()))
  }

  return (
    <>
      <button
        type="button"
        className="yiqidong-envelope pressable"
        aria-label="一起动信封"
        onClick={() => setOpen(true)}
      >
        <span className="yiqidong-envelope__body" aria-hidden="true" />
        <span className="yiqidong-envelope__flap" aria-hidden="true" />
        <span className="yiqidong-envelope__label">一起动</span>
        {unread > 0 && <span className="yiqidong-envelope__badge">{unread}</span>}
      </button>

      {open && (
        <EnvelopeModal onApply={handleApply} onClose={handleClose} />
      )}
    </>
  )
}
