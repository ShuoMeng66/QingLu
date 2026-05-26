import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../hooks/useI18n'

function accountInitial(displayName: string | null | undefined, email: string): string {
  const source = displayName?.trim() || email.split('@')[0] || email
  const char = source.charAt(0)
  return char ? char.toUpperCase() : '?'
}

interface UserAccountAvatarProps {
  className?: string
  showLabel?: boolean
}

export function UserAccountAvatar({ className = '', showLabel = true }: UserAccountAvatarProps) {
  const { user, syncing } = useAuth()
  const { t } = useI18n()

  if (!user) return null

  const label = user.displayName?.trim() || user.email.split('@')[0]

  return (
    <Link
      to="/auth"
      className={`group flex shrink-0 items-center gap-2 rounded-full transition ${className}`}
      aria-label={t('auth.accountMenu')}
      title={user.email}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-semibold text-white shadow-glass ring-2 ring-white/80 transition group-hover:scale-105 group-active:scale-95">
        {accountInitial(user.displayName, user.email)}
      </span>
      {showLabel && (
        <span className="hidden max-w-[9rem] truncate text-xs font-medium text-slate-700 sm:inline">
          {syncing ? t('auth.syncing') : label}
        </span>
      )}
    </Link>
  )
}
