import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import Layout from './components/Layout.tsx'
import Login from './pages/Login.tsx'
import GamePage from './pages/GamePage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import { AuthGuard } from './auth/AuthGuard.tsx'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<AuthGuard />}>
            <Route path="/game" element={<GamePage />} />
            <Route path="/" element={<Navigate to="/game" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
)
