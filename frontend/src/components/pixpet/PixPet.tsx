import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage } from '../../types/openclaw'
import type { AppPage } from '../AppSidebar'
import { detectPixPetState } from './detectPixPetState'
import { QINGLU } from '../../data/qingluAssets'
import {
  PIX_PET_MOOD_QUOTES,
  PIX_PET_QUOTES,
  pickQuote,
  pixPetQuoteKey,
  type PixPetState,
} from './types'
import { usePixPetController } from './usePixPetController'
import './PixPet.css'

interface PixPetProps {
  messages?: ChatMessage[]
  input?: string
  page?: AppPage
  loading?: boolean
  previewState?: PixPetState | null
  layout?: 'hero' | 'compact'
}

export function PixPet({
  messages = [],
  input = '',
  page = 'home',
  loading = false,
  previewState = null,
  layout = 'hero',
}: PixPetProps) {
  const hasChatContent = messages.length > 0 || input.trim().length > 0
  const isTyping = input.trim().length > 0
  const prevMessageCount = useRef(messages.length)

  const chatState = useMemo(
    () => detectPixPetState({ messages, input, page }),
    [messages, input, page],
  )

  const { state, restPhase, mood, poke, celebrate, wake } = usePixPetController({
    chatState,
    autoPlay: !hasChatContent && !previewState,
    loading,
    isTyping,
    previewState,
  })

  const [quote, setQuote] = useState(() =>
    pickQuote(pixPetQuoteKey(state, restPhase), PIX_PET_QUOTES),
  )

  const handleTap = () => {
    if (restPhase !== 'awake') {
      wake()
      setQuote(pickQuote('happy', PIX_PET_MOOD_QUOTES))
      return
    }
    poke()
    setQuote(pickQuote('happy', PIX_PET_MOOD_QUOTES))
  }

  useEffect(() => {
    setQuote(pickQuote(pixPetQuoteKey(state, restPhase), PIX_PET_QUOTES))
  }, [state, restPhase])

  useEffect(() => {
    if (mood !== 'normal') {
      const moodQuotes = PIX_PET_MOOD_QUOTES[mood]
      if (moodQuotes.length) setQuote(pickQuote(mood, PIX_PET_MOOD_QUOTES))
    }
  }, [mood])

  useEffect(() => {
    if (messages.length > prevMessageCount.current && messages.at(-1)?.role === 'user') {
      celebrate()
    }
    prevMessageCount.current = messages.length
  }, [messages, celebrate])

  const restLabel =
    restPhase === 'sleep' ? '休息' : restPhase === 'doze' ? '打盹' : '在线'

  return (
    <div className={`pix-pet pix-pet--${layout} pix-pet--rest-${restPhase}`}>
      <div
        className={`pix-pet__bubble pix-pet__bubble--${mood}`}
        role="status"
        aria-live="polite"
      >
        {quote}
      </div>

      <div className={`pix-pet__tamagotchi pix-pet__tamagotchi--${layout}`}>
        <div className="pix-pet__tama-shell">
          <div className="pix-pet__tama-header">
            <span className="pix-pet__tama-brand">{QINGLU.name}</span>
            <span className={`pix-pet__tama-led pix-pet__tama-led--${restPhase}`} title={restLabel} />
          </div>

          <div className="pix-pet__tama-lcd">
            <button
              type="button"
              className="pix-pet__stage"
              onClick={handleTap}
              aria-label={`戳戳${QINGLU.name}`}
            >
              <img
                src={QINGLU.avatar}
                alt={QINGLU.name}
                className={`pix-pet__avatar pix-pet__avatar--${state.mode}`}
              />
            </button>
          </div>

          <div className="pix-pet__tama-footer">
            <span className="pix-pet__tama-status">{restLabel}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
