import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionResultListLike {
  length: number
  [index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface SpeechRecognitionErrorEventLike {
  error: string
  message?: string
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null
}

export interface UseSpeechRecognitionOptions {
  lang?: string
  onInterim?: (transcript: string) => void
  onFinal: (transcript: string) => void
  onError?: (message: string) => void
}

export function useSpeechRecognition({
  lang = 'zh-CN',
  onInterim,
  onFinal,
  onError,
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(() => getSpeechRecognitionCtor() !== null)

  const onInterimRef = useRef(onInterim)
  const onFinalRef = useRef(onFinal)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onInterimRef.current = onInterim
    onFinalRef.current = onFinal
    onErrorRef.current = onError
  }, [onFinal, onInterim, onError])

  useEffect(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setSupported(false)
      return
    }

    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) final += transcript
        else interim += transcript
      }

      if (final.trim()) onFinalRef.current(final.trim())
      else if (interim.trim()) onInterimRef.current?.(interim.trim())
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onerror = (event) => {
      setListening(false)
      const message = mapSpeechError(event.error)
      onErrorRef.current?.(message)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.onresult = null
      recognition.onend = null
      recognition.onerror = null
      recognition.abort()
      recognitionRef.current = null
    }
  }, [lang])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) {
      onErrorRef.current?.('当前浏览器不支持语音输入，请改用 Chrome 或 Edge')
      return
    }

    try {
      recognition.start()
      setListening(true)
    } catch {
      try {
        recognition.stop()
        recognition.start()
        setListening(true)
      } catch {
        onErrorRef.current?.('无法启动语音识别，请稍后重试')
        setListening(false)
      }
    }
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { listening, supported, start, stop, toggle }
}

function mapSpeechError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风权限被拒绝，请在浏览器设置中允许访问'
    case 'no-speech':
      return '没有检测到语音，请再试一次'
    case 'audio-capture':
      return '未找到可用麦克风，请检查设备连接'
    case 'network':
      return '语音识别需要网络连接，请检查网络后重试'
    case 'aborted':
      return '语音输入已取消'
    default:
      return '语音识别失败，请稍后重试'
  }
}
