import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as api from '../api/client'
import type { Project } from '../types/project'

export interface ActiveProjectContextValue {
  loading: boolean
  error: string | null
  projects: Project[]
  activeProjectId: number | null
  refresh: () => Promise<void>
  setActiveProject: (projectId: number | null) => Promise<void>
}

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(null)

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectIdState] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectList, me] = await Promise.all([
        api.fetchProjects(),
        api.fetchCurrentUser(),
      ])
      setProjects(projectList)
      setActiveProjectIdState(me.activeProjectId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd ładowania')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setActiveProject = useCallback(async (projectId: number | null) => {
    setError(null)
    try {
      const me = await api.patchActiveProject(projectId)
      setActiveProjectIdState(me.activeProjectId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się zapisać projektu')
    }
  }, [])

  const value = useMemo(
    () => ({
      loading,
      error,
      projects,
      activeProjectId,
      refresh,
      setActiveProject,
    }),
    [loading, error, projects, activeProjectId, refresh, setActiveProject],
  )

  return (
    <ActiveProjectContext.Provider value={value}>{children}</ActiveProjectContext.Provider>
  )
}

export function useActiveProject(): ActiveProjectContextValue {
  const ctx = useContext(ActiveProjectContext)
  if (!ctx) {
    throw new Error('useActiveProject musi być użyte wewnątrz ActiveProjectProvider')
  }
  return ctx
}
