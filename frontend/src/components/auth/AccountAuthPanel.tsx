import { useCallback, useEffect, useRef, useState } from 'react'
import { Cloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../hooks/useI18n'
import { pingAuthHealth, sendVerificationCode, ApiError } from '../../lib/api/client'
import { agentLog } from '../../lib/debugLog'

interface AccountAuthPanelProps {
  defaultMode?: 'login' | 'register'
  onSuccess?: (mode: 'login' | 'register') => void
  variant?: 'compact' | 'full' | 'landing'
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function AccountAuthPanel({
  defaultMode = 'login',
  onSuccess,
  variant = 'full',
}: AccountAuthPanelProps) {
  const { toast } = useToast()
  const { t } = useI18n()
  const { user, login, register, logout, syncing } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [codeSentEmail, setCodeSentEmail] = useState<string | null>(null)
  const [justRegistered, setJustRegistered] = useState(false)
  const autoSendTimerRef = useRef<number | null>(null)
  const autoSendAttemptedForRef = useRef<string | null>(null)

  const compact = variant === 'compact'
  const landing = variant === 'landing'

  useEffect(() => {
    if (mode !== 'register') return
    void pingAuthHealth()
      .then((health) => {
        if (health.emailConfigured && health.emailReachable === false && health.hint) {
          toast(health.hint, 'error')
        }
      })
      .catch(() => {
        /* warm Render backend; ignore failures */
      })
  }, [mode])

  useEffect(() => {
    if (countdown <= 0) return

    const timer = window.setInterval(() => {
      setCountdown((current) => (current > 1 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [countdown])

  const sendCodeToEmail = useCallback(
    async (targetEmail: string) => {
      if (sendingCode) return false

      const trimmed = targetEmail.trim()
      if (!isValidEmail(trimmed)) {
        toast(t('auth.invalidEmailForCode'), 'error')
        return false
      }

      setSendingCode(true)
      try {
        const result = await sendVerificationCode(trimmed)
        const normalized = normalizeEmail(trimmed)
        setCodeSentEmail(normalized)
        setCountdown(60)
        toast(
          result.existing
            ? t('auth.codeSentExisting', { email: trimmed })
            : t('auth.codeSentTo', { email: trimmed }),
          'success',
        )
        return true
      } catch (error) {
        const message =
          error instanceof ApiError && error.status === 502
            ? t('auth.backendUnavailable')
            : error instanceof ApiError && error.status === 503
              ? t('auth.smtpUnavailable')
              : error instanceof ApiError && error.status === 504
                ? t('auth.backendWaking')
                : error instanceof ApiError && error.status === 429
                  ? error.message
                  : error instanceof Error
                    ? error.message
                    : t('auth.failed')
        toast(message, 'error')
        return false
      } finally {
        setSendingCode(false)
      }
    },
    [sendingCode, t, toast],
  )

  useEffect(() => {
    if (mode !== 'register') return

    const normalized = normalizeEmail(email)
    if (codeSentEmail && codeSentEmail !== normalized) {
      setCodeSentEmail(null)
      setVerificationCode('')
      setCountdown(0)
      autoSendAttemptedForRef.current = null
    }
  }, [email, mode, codeSentEmail])

  useEffect(() => {
    if (mode !== 'register') return

    const trimmed = email.trim()
    if (!isValidEmail(trimmed)) return

    const normalized = normalizeEmail(trimmed)
    if (
      codeSentEmail === normalized ||
      sendingCode ||
      countdown > 0 ||
      autoSendAttemptedForRef.current === normalized
    ) {
      return
    }

    if (autoSendTimerRef.current != null) {
      window.clearTimeout(autoSendTimerRef.current)
    }

    autoSendTimerRef.current = window.setTimeout(() => {
      autoSendTimerRef.current = null
      autoSendAttemptedForRef.current = normalized
      void sendCodeToEmail(trimmed)
    }, 700)

    return () => {
      if (autoSendTimerRef.current != null) {
        window.clearTimeout(autoSendTimerRef.current)
        autoSendTimerRef.current = null
      }
    }
  }, [mode, email, codeSentEmail, sendingCode, countdown, sendCodeToEmail])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    if (mode === 'register') {
      if (!isValidEmail(email)) {
        toast(t('auth.invalidEmailForCode'), 'error')
        return
      }

      if (!verificationCode.trim()) {
        await sendCodeToEmail(email)
        return
      }
    }

    setSubmitting(true)
    agentLog('AccountAuthPanel.tsx:handleSubmit', 'submitting true', { mode }, 'E')
    try {
      if (mode === 'register') {
        const { created } = await register(
          email,
          password,
          verificationCode.trim(),
          displayName.trim() || undefined,
        )
        setJustRegistered(created)
        toast(created ? t('auth.registerSuccess') : t('auth.loginSuccess'), 'success')
        onSuccess?.('register')
      } else {
        await login(email, password)
        agentLog('AccountAuthPanel.tsx:handleSubmit', 'login returned', {}, 'E')
        toast(t('auth.loginSuccess'), 'success')
        onSuccess?.('login')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.failed')
      agentLog('AccountAuthPanel.tsx:handleSubmit', 'error', {
        mode,
        err: error instanceof Error ? error.message : 'unknown',
      }, 'E')
      toast(message, 'error')
    } finally {
      setSubmitting(false)
      agentLog('AccountAuthPanel.tsx:handleSubmit', 'submitting false', { mode }, 'E')
    }
  }

  if (user) {
    return (
      <section className="glass-panel rounded-[24px] p-4 shadow-glass sm:p-5">
        {justRegistered && (
          <div
            className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/95 px-4 py-3 text-sm font-medium text-emerald-800"
            role="status"
          >
            {t('auth.registerSuccess')}
          </div>
        )}
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          {t('splash.accountLoggedInBadge')}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-800">{user.email}</p>
        {user.displayName && (
          <p className="mt-1 text-sm text-slate-500">{user.displayName}</p>
        )}
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{t('settings.accountHint')}</p>
        {syncing && <p className="mt-2 text-xs text-emerald-500">{t('auth.syncing')}</p>}
        <div className={`mt-4 flex flex-col gap-2 ${compact ? 'sm:flex-row' : ''}`}>
          <button
            type="button"
            className="btn-vitality rounded-full py-2.5 text-sm font-semibold"
            onClick={() => onSuccess?.('login')}
          >
            {t('auth.backToChat')}
          </button>
          <Link
            to="/auth"
            className="rounded-full border border-white/80 bg-white/60 py-2.5 text-center text-sm font-semibold text-slate-600"
          >
            {t('settings.accountManage')}
          </Link>
          <button
            type="button"
            className="rounded-full border border-white/80 bg-white/60 py-2.5 text-sm font-semibold text-slate-600"
            onClick={() => {
              logout()
              toast(t('auth.logoutSuccess'), 'success')
            }}
          >
            {t('auth.logout')}
          </button>
        </div>
      </section>
    )
  }

  const codeSentToCurrentEmail =
    mode === 'register' &&
    codeSentEmail != null &&
    codeSentEmail === normalizeEmail(email)

  const shellClass = landing
    ? 'splash-auth-card splash-auth-card--compact'
    : 'glass-panel rounded-[24px] p-4 shadow-glass sm:p-5'

  return (
    <section className={shellClass}>
      {landing ? (
        <div className="splash-auth-card__header flex items-start gap-2.5">
          <span className="splash-auth-card__icon flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 text-white shadow-md">
            <Cloud className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">{t('splash.accountTitle')}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {mode === 'register' ? t('auth.registerIntro') : t('auth.intro')}
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-base font-semibold text-slate-800">{t('splash.accountTitle')}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {mode === 'register' ? t('auth.registerIntro') : t('auth.intro')}
          </p>
        </>
      )}

      <div className={`flex gap-2 ${landing ? 'splash-auth-card__tabs' : 'mb-4 mt-4'}`}>
        {(['login', 'register'] as const).map((id) => (
          <button
            key={id}
            type="button"
            className={
              landing
                ? `flex-1 rounded-full py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    mode === id
                      ? 'btn-vitality shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700'
                  }`
                : `flex-1 rounded-full py-2 text-sm font-semibold ${
                    mode === id ? 'btn-vitality' : 'bg-white/60 text-slate-500'
                  }`
            }
            onClick={() => {
              setMode(id)
              if (id === 'login') {
                setVerificationCode('')
                setCountdown(0)
                setCodeSentEmail(null)
                autoSendAttemptedForRef.current = null
              }
            }}
          >
            {t(id === 'login' ? 'auth.loginTab' : 'auth.registerTab')}
          </button>
        ))}
      </div>

      <form
        className={`flex flex-col ${landing ? 'splash-auth-card__form gap-2' : 'gap-3'}`}
        onSubmit={(event) => void handleSubmit(event)}
      >
        {mode === 'register' && (
          <label className={`flex flex-col gap-1 ${landing ? 'text-xs' : 'gap-1.5 text-sm'}`}>
            <span className="font-medium text-slate-700">{t('auth.displayName')}</span>
            <input
              className={`rounded-xl border border-white/80 bg-white/70 px-3 outline-none focus:border-emerald-400 ${
                landing ? 'py-2 text-sm' : 'py-2.5'
              }`}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('auth.displayNamePlaceholder')}
            />
          </label>
        )}

        <label className={`flex flex-col ${landing ? 'gap-1 text-xs' : 'gap-1.5 text-sm'}`}>
          <span className="font-medium text-slate-700">{t('auth.email')}</span>
          <input
            type="email"
            required
            autoComplete="email"
            className={`rounded-xl border border-white/80 bg-white/70 px-3 outline-none focus:border-emerald-400 ${
              landing ? 'py-2 text-sm' : 'py-2.5'
            }`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {mode === 'register' && isValidEmail(email) && (
            <span className="text-xs text-slate-500">{t('auth.codeHint')}</span>
          )}
        </label>

        {mode === 'register' && (
          <label className={`flex flex-col ${landing ? 'gap-1 text-xs' : 'gap-1.5 text-sm'}`}>
            <span className="font-medium text-slate-700">{t('auth.verificationCode')}</span>
            {codeSentToCurrentEmail && (
              <span className="text-xs text-emerald-600">
                {t('auth.codeSentTo', { email: email.trim() })}
              </span>
            )}
            {sendingCode && !codeSentToCurrentEmail && (
              <span className="text-xs text-slate-500">{t('auth.sendingCode')}</span>
            )}
            <div className="flex gap-2">
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t('auth.verificationCodePlaceholder')}
                className={`min-w-0 flex-1 rounded-xl border border-white/80 bg-white/70 px-3 outline-none focus:border-emerald-400 ${
                  landing ? 'py-2 text-sm' : 'py-2.5'
                }`}
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
              />
              <button
                type="button"
                disabled={sendingCode || countdown > 0 || !isValidEmail(email)}
                className={`shrink-0 rounded-xl border border-white/80 bg-white/70 px-3 font-semibold text-slate-700 disabled:opacity-50 ${
                  landing ? 'py-2 text-xs' : 'py-2.5 text-sm'
                }`}
                onClick={() => void sendCodeToEmail(email)}
              >
                {countdown > 0
                  ? t('auth.resendCode', { seconds: countdown })
                  : t('auth.sendCode')}
              </button>
            </div>
          </label>
        )}

        <label className={`flex flex-col ${landing ? 'gap-1 text-xs' : 'gap-1.5 text-sm'}`}>
          <span className="font-medium text-slate-700">{t('auth.password')}</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className={`rounded-xl border border-white/80 bg-white/70 px-3 outline-none focus:border-emerald-400 ${
              landing ? 'py-2 text-sm' : 'py-2.5'
            }`}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {mode === 'login' && (
          <p className={`leading-relaxed text-slate-500 ${landing ? 'text-[11px]' : 'text-xs'}`}>
            {t('auth.loginForgotHint')}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || sendingCode}
          className={`btn-vitality rounded-full font-semibold disabled:opacity-50 ${
            landing ? 'py-2 text-sm' : 'mt-1 py-2.5 text-sm'
          }`}
        >
          {submitting
            ? t('auth.submitting')
            : mode === 'register'
              ? t('auth.registerSubmit')
              : t('auth.loginSubmit')}
        </button>
      </form>
    </section>
  )
}
