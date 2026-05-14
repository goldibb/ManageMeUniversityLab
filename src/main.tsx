import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ThemeModeProvider } from './app/context/ThemeModeContext'
import { NotificationProvider } from './app/context/NotificationContext'
import { AuthProvider } from './app/context/AuthContext'
import './index.css'
import App from './App.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
console.log("[DEBUG] Frontend VITE_GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeModeProvider>
          <NotificationProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </NotificationProvider>
        </ThemeModeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
