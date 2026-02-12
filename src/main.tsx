import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import './board.css'; // Ensure base board styles are loaded
import './themes.css'; // Theme overrides
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import Layout from './components/Layout.tsx'
import Login from './pages/Login.tsx'
import GamePage from './pages/GamePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import { AuthGuard } from './auth/AuthGuard.tsx'

import { AppearanceProvider } from './hooks/useAppearance'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AppearanceProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/game" element={<GamePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Redirect root to game (public now) */}
            <Route path="/" element={<Navigate to="/game" replace />} />

            {/* Protected Routes */}
            <Route element={<AuthGuard />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AppearanceProvider>
  </ErrorBoundary>
)
