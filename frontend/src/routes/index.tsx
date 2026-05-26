import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { AppProvider } from '../context/AppProvider'
import { AuthProvider } from '../context/AuthContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { ToastProvider } from '../context/ToastContext'

import { AboutPage } from '../pages/AboutPage'
import { AuthPage } from '../pages/AuthPage'

import { ChatPage } from '../pages/ChatPage'

import { SettingsPage } from '../pages/SettingsPage'

import { SplashPage } from '../pages/SplashPage'

function AppProviderLayout() {
  const location = useLocation()
  return (
    <AppProvider>
      {/* pathname 作为 key，避免仅 URL 变化时 Outlet 子页面不卸载/不重渲染 */}
      <Outlet key={location.pathname} />
    </AppProvider>
  )
}

function SpaFallback() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/api/') || pathname.startsWith('/openclaw-api')) {
    return null
  }
  return <Navigate to="/" replace />
}

function AppRoutesInner() {
  return (
    <Routes>
      <Route index element={<SplashPage />} />
      <Route path="splash" element={<SplashPage />} />
      <Route path="auth" element={<AuthPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route element={<AppProviderLayout />}>
        <Route path="chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<SpaFallback />} />
    </Routes>
  )
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PreferencesProvider>
            <AppRoutesInner />
          </PreferencesProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
