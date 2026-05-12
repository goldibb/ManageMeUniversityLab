import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

type Mode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: Mode
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'dark',
  toggleMode: () => {},
})

export const useThemeMode = () => useContext(ThemeModeContext)

const STORAGE_KEY = 'theme-mode'

function getInitialMode(): Mode {
  const stored = localStorage.getItem(STORAGE_KEY) as Mode | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(getInitialMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const toggleMode = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))

  const theme = createTheme({
    palette: {
      mode,
    },
  })

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
