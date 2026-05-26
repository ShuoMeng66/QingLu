import { useLocation } from 'react-router-dom'
import { BRAND, SIDEBAR } from '../../copy/ui'
import { QINGLU } from '../../data/qingluAssets'

const NAV_ITEMS = [
  { href: '/chat', label: SIDEBAR.navChat },
  { href: '/history', label: SIDEBAR.historySection },
  { href: '/quests', label: SIDEBAR.yiqidong },
  { href: '/settings', label: SIDEBAR.navSettings },
  { href: '/about', label: '关于' },
] as const

interface AppNavProps {
  mobileOpen: boolean
  onMobileToggle: () => void
  onNavigate?: () => void
  yiqidongUnread?: number
  /** 对话页移动端：打开左侧历史抽屉 */
  onOpenSidebar?: () => void
}

export function AppNav({
  mobileOpen,
  onMobileToggle,
  onNavigate,
  yiqidongUnread = 0,
  onOpenSidebar,
}: AppNavProps) {
  const location = useLocation()
  const onChatPage = location.pathname === '/chat'

  const handleNavClick = () => {
    onNavigate?.()
    if (mobileOpen) onMobileToggle()
  }

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  return (
    <>
      {onChatPage && onOpenSidebar && (
        <button
          type="button"
          className="app-nav__sidebar-toggle md:hidden"
          aria-label="打开对话列表"
          onClick={onOpenSidebar}
        >
          ☰
        </button>
      )}

      <button
        type="button"
        className="app-nav__hamburger md:hidden"
        aria-label={mobileOpen ? '关闭导航' : '打开导航'}
        aria-expanded={mobileOpen}
        onClick={onMobileToggle}
      >
        <span />
        <span />
        <span />
      </button>

      <nav
        className={`app-nav ${mobileOpen ? 'app-nav--open' : ''} ${onChatPage ? 'app-nav--chat' : ''}`}
        aria-label="主导航"
      >
        {onChatPage && (
          <a href="/" className="app-nav__back" aria-label="返回封面" onClick={handleNavClick}>
            ←
          </a>
        )}

        <a href={onChatPage ? '/chat' : '/'} className="app-nav__brand" onClick={handleNavClick}>
          <span className="app-nav__mark app-nav__mark--avatar">
            <img src={QINGLU.avatar} alt="" />
          </span>
          <span className="app-nav__brand-text">
            <strong>{BRAND.name}</strong>
            <span>{BRAND.tagline}</span>
          </span>
        </a>

        <ul className="app-nav__links">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className={`app-nav__link ${isActive(href) ? 'app-nav__link--active' : ''}`}
                aria-current={isActive(href) ? 'page' : undefined}
                onClick={handleNavClick}
              >
                {label}
                {href === '/quests' && yiqidongUnread > 0 && (
                  <span className="app-nav__badge">{yiqidongUnread}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {mobileOpen && (
        <button
          type="button"
          className="app-nav__backdrop md:hidden"
          aria-label="关闭导航"
          onClick={onMobileToggle}
        />
      )}
    </>
  )
}
