import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, LogOut, Settings, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useI18n } from '../../hooks/useI18n'
import { loadUserProfile, saveUserProfile } from '../../lib/userProfile'

const AVATAR_MAX_BYTES = 512_000

function accountInitial(displayName: string | null | undefined, email: string): string {
  const source = displayName?.trim() || email.split('@')[0] || email
  const char = source.charAt(0)
  return char ? char.toUpperCase() : '?'
}

interface UserAccountMenuProps {
  className?: string
  showLabel?: boolean
  menuAlign?: 'left' | 'right'
}

export function UserAccountMenu({
  className = '',
  showLabel = true,
  menuAlign = 'right',
}: UserAccountMenuProps) {
  const { user, syncing, loading, logout, updateDisplayName, changePassword } = useAuth()
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(() => loadUserProfile().avatar_url)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const refreshAvatar = useCallback(() => {
    setAvatarUrl(loadUserProfile().avatar_url)
  }, [])

  useEffect(() => {
    const onApplied = () => refreshAvatar()
    window.addEventListener('burnpal:user-data-applied', onApplied)
    window.addEventListener('burnpal:user-data-changed', onApplied)
    return () => {
      window.removeEventListener('burnpal:user-data-applied', onApplied)
      window.removeEventListener('burnpal:user-data-changed', onApplied)
    }
  }, [refreshAvatar])

  useEffect(() => {
    if (user) {
      setDisplayNameDraft(user.displayName?.trim() ?? '')
    }
  }, [user])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setShowPasswordForm(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setShowPasswordForm(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const loggedIn = Boolean(user)
  const label = user
    ? user.displayName?.trim() || user.email.split('@')[0]
    : t('auth.guestLabel')
  const statusLabel = loading
    ? t('auth.restoringSession')
    : syncing
      ? t('auth.syncing')
      : loggedIn
        ? t('auth.loggedInAs')
        : t('auth.guestLimited')

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast(t('auth.avatarInvalidType'), 'error')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast(t('auth.avatarTooLarge'), 'error')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('read failed'))
      reader.readAsDataURL(file)
    })

    saveUserProfile({ avatar_url: dataUrl })
    setAvatarUrl(dataUrl)
    toast(t('auth.avatarUpdated'), 'success')
  }

  const handleSaveDisplayName = async () => {
    if (!loggedIn) return
    setSaving(true)
    try {
      await updateDisplayName(displayNameDraft)
      toast(t('auth.profileSaved'), 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : t('auth.failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast(t('auth.passwordMismatch'), 'error')
      return
    }
    if (newPassword.length < 6) {
      toast(t('auth.passwordMinLength'), 'error')
      return
    }
    setSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
      toast(t('auth.passwordChanged'), 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : t('auth.failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const avatarButton = (
    <button
      type="button"
      className={`group flex shrink-0 items-center gap-2 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ${className}`}
      aria-label={t('auth.accountMenu')}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-controls={menuId}
      title={user?.email ?? t('auth.signInOrRegister')}
      onClick={() => setOpen((value) => !value)}
    >
      <span
        className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-semibold shadow-glass ring-2 transition group-hover:scale-105 group-active:scale-95 ${
          loggedIn
            ? 'gradient-vitality-br text-white ring-white/80'
            : 'bg-slate-800 text-slate-400 ring-slate-600/50'
        }`}
      >
        {loggedIn && avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : loggedIn ? (
          accountInitial(user!.displayName, user!.email)
        ) : (
          <User className="h-5 w-5" strokeWidth={2} />
        )}
        {!loggedIn && (
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-900 bg-slate-500"
            aria-hidden
          />
        )}
      </span>
      {showLabel && (
        <span className="hidden max-w-[9rem] flex-col text-left sm:flex">
          <span className="truncate text-xs font-semibold text-slate-800">{label}</span>
          <span className="truncate text-[10px] text-slate-500">{statusLabel}</span>
        </span>
      )}
    </button>
  )

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {avatarButton}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          void handleAvatarFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute top-[calc(100%+0.5rem)] z-[60] w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-glass backdrop-blur-md ${
            menuAlign === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {loggedIn ? (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full gradient-vitality-br text-sm font-semibold text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    accountInitial(user!.displayName, user!.email)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user!.email}</p>
                  <p className="text-[11px] text-emerald-600">
                    {syncing ? t('auth.syncing') : t('auth.loggedInAs')}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <label className="block text-[11px] font-medium text-slate-500">{t('auth.displayName')}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayNameDraft}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-800"
                    placeholder={t('auth.displayNamePlaceholder')}
                    onChange={(event) => setDisplayNameDraft(event.target.value)}
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void handleSaveDisplayName()}
                  >
                    {t('auth.saveProfile')}
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50/80"
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4 text-emerald-600" />
                  {t('auth.changeAvatar')}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                    onClick={() => {
                      saveUserProfile({ avatar_url: undefined })
                      setAvatarUrl(undefined)
                      toast(t('auth.avatarRemoved'), 'success')
                    }}
                  >
                    {t('auth.removeAvatar')}
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-emerald-50/80"
                  onClick={() => setShowPasswordForm((value) => !value)}
                >
                  {t('auth.changePassword')}
                </button>
                {showPasswordForm && (
                  <div className="space-y-2 rounded-xl bg-slate-50/90 p-3">
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder={t('auth.currentPassword')}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t('auth.newPassword')}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t('auth.confirmPassword')}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-vitality w-full rounded-full py-2 text-xs font-semibold disabled:opacity-50"
                      disabled={saving}
                      onClick={() => void handleChangePassword()}
                    >
                      {t('auth.changePassword')}
                    </button>
                  </div>
                )}
                <Link
                  to="/settings"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-emerald-50/80"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-4 w-4 text-emerald-600" />
                  {t('settings.accountManage')}
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-red-50/80 hover:text-red-600"
                  onClick={() => {
                    logout()
                    setOpen(false)
                    toast(t('auth.logoutSuccess'), 'success')
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout')}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">{t('auth.guestLabel')}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{t('auth.guestLimited')}</p>
              <button
                type="button"
                role="menuitem"
                className="btn-vitality mt-3 w-full rounded-full py-2.5 text-sm font-semibold"
                onClick={() => {
                  setOpen(false)
                  navigate('/auth')
                }}
              >
                {t('auth.signInOrRegister')}
              </button>
              <button
                type="button"
                role="menuitem"
                className="mt-2 w-full rounded-full border border-slate-200/80 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => {
                  setOpen(false)
                  navigate('/')
                }}
              >
                {t('splash.backToHome')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
