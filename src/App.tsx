import Board from './app/components/board/board'
import { ActiveProjectProvider, useActiveProject } from './app/context/ActiveProjectContext'
import { getCurrentUser } from './app/components/login/mock_user'
import './App.css'

function AppHeader() {
  const user = getCurrentUser()
  const { projects, activeProjectId, setActiveProject, loading, error } = useActiveProject()

  return (
    <header className="app-header">
      <span className="app-header__user">
        Witaj, {user.firstName} {user.lastName}
      </span>
      <label className="app-header__project-label">
        Aktywny projekt
        <select
          value={activeProjectId ?? ''}
          onChange={(e) => {
            const v = e.target.value
            void setActiveProject(v === '' ? null : Number(v))
          }}
          disabled={loading}
        >
          <option value="">— wybierz —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <span className="app-header__error">{error}</span> : null}
    </header>
  )
}

function App() {
  return (
    <ActiveProjectProvider>
      <div className="app-shell">
        <AppHeader />
        <Board />
      </div>
    </ActiveProjectProvider>
  )
}

export default App
