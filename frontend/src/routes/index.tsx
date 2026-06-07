import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'

import { ErrorBoundary } from '../components/ErrorBoundary'
import { AppProvider } from '../context/AppProvider'
import { ProfileProvider } from '../context/ProfileProvider'
import { AuthProvider } from '../context/AuthContext'
import { PreferencesProvider } from '../context/PreferencesContext'
import { ToastProvider } from '../context/ToastContext'

import { AboutPage } from '../pages/AboutPage'
import { AuthPage } from '../pages/AuthPage'

import { ChatPage } from '../pages/ChatPage'

import { SettingsPage } from '../pages/SettingsPage'

import { SplashPage } from '../pages/SplashPage'
import { HealthProfilePage } from '../pages/HealthProfilePage'
import { OnboardProfilePage } from '../pages/OnboardProfilePage'
import { ProfileReadyPage } from '../pages/ProfileReadyPage'

function AppProviderLayout() {
  const location = useLocation()
  return (
    <AppProvider>
      {/* pathname 作为 key，避免仅 URL 变化时 Outlet 子页面不卸载/不重渲染 */}
      <Outlet key={location.pathname} />
    </AppProvider>
  )
}

function ProfileProviderLayout() {
  const location = useLocation()
  return (
    <ProfileProvider>
      <Outlet key={location.pathname} />
    </ProfileProvider>
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
      <Route element={<ProfileProviderLayout />}>
        <Route path="onboard" element={<OnboardProfilePage />} />
        <Route path="onboard/profile" element={<HealthProfilePage />} />
        <Route path="ready" element={<ProfileReadyPage />} />
      </Route>
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
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <PreferencesProvider>
              <AppRoutesInner />
            </PreferencesProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
