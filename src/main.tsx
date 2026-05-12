import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeModeProvider } from './app/context/ThemeModeContext'
import { NotificationProvider } from './app/context/NotificationContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeModeProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </ThemeModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
