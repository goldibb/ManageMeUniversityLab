import { useCallback, useEffect, useMemo, useState } from 'react'
import './task.css'
import * as api from '../../api/client'
import type { Task, TaskPriority, TaskState } from '../../types/task'
import type { User } from '../../types/project'

const columns: { key: TaskState; label: string }[] = [
  { key: 'todo', label: 'Czekające na wykonanie' },
  { key: 'doing', label: 'W trakcie (wykonywane)' },
  { key: 'done', label: 'Zamknięte' },
]

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pl-PL')
}

interface TaskModalProps {
  storyId: number
  storyName: string
  onClose: () => void
}

export default function TaskModal({ storyId, storyName, onClose }: TaskModalProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newEstimatedTime, setNewEstimatedTime] = useState<string>('1')
  const [newAssignedUserId, setNewAssignedUserId] = useState<string>('')

  const [detailTaskId, setDetailTaskId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [taskList, userList] = await Promise.all([
        api.fetchTasks(storyId),
        api.getUsers(),
      ])
      setTasks(taskList)
      setUsers(userList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nie udało się pobrać danych')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    void reload()
  }, [reload])

  const assignableUsers = useMemo(
    () => users.filter((u) => u.role === 'devops' || u.role === 'developer'),
    [users],
  )

  const userMap = useMemo(() => {
    const map = new Map<number, User>()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

  function userLabel(id: number | null): string {
    if (id == null) return 'nieprzypisany'
    const u = userMap.get(id)
    return u ? `${u.firstName} ${u.lastName} (${u.role})` : `użytkownik ${id}`
  }

  const handleCreate = async () => {
    const et = Number(newEstimatedTime)
    if (!newName.trim() || !Number.isFinite(et) || et <= 0) return
    setBusy(true)
    setError(null)
    try {
      await api.createTask({
        storyId,
        name: newName.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        estimatedTime: et,
        assignedUserId: newAssignedUserId === '' ? null : Number(newAssignedUserId),
      })
      setNewName('')
      setNewDescription('')
      setNewPriority('medium')
      setNewEstimatedTime('1')
      setNewAssignedUserId('')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Usunąć to zadanie?')) return
    setBusy(true)
    setError(null)
    try {
      await api.deleteTask(id)
      if (detailTaskId === id) setDetailTaskId(null)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd usuwania')
    } finally {
      setBusy(false)
    }
  }

  const handleMove = async (id: number, state: TaskState) => {
    setBusy(true)
    setError(null)
    try {
      await api.updateTask(id, { state })
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Błąd zmiany stanu')
    } finally {
      setBusy(false)
    }
  }

  const detailTask = useMemo(
    () => tasks.find((t) => t.id === detailTaskId) ?? null,
    [tasks, detailTaskId],
  )

  return (
    <div className="task-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="task-modal">
        <div className="task-modal__header">
          <h2 className="task-modal__title">Zadania historyjki: {storyName}</h2>
          <button className="task-modal__close" onClick={onClose} disabled={busy}>
            Zamknij
          </button>
        </div>

        <div className="task-modal__body">
          {error ? <p className="task-modal__error">{error}</p> : null}

          <div className="task-modal__add">
            <input
              type="text"
              placeholder="Nazwa zadania…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              disabled={busy}
            />
            <textarea
              placeholder="Opis…"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={1}
              disabled={busy}
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              disabled={busy}
              aria-label="Priorytet"
            >
              <option value="low">{PRIORITY_LABELS.low}</option>
              <option value="medium">{PRIORITY_LABELS.medium}</option>
              <option value="high">{PRIORITY_LABELS.high}</option>
            </select>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="Przewidywane roboczogodziny"
              value={newEstimatedTime}
              onChange={(e) => setNewEstimatedTime(e.target.value)}
              disabled={busy}
              style={{ width: '7rem' }}
            />
            <select
              value={newAssignedUserId}
              onChange={(e) => setNewAssignedUserId(e.target.value)}
              disabled={busy}
              aria-label="Przypisz do"
            >
              <option value="">— nieprzypisuj —</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role})
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void handleCreate()} disabled={busy || !newName.trim()}>
              Dodaj zadanie
            </button>
          </div>

          {loading ? <p className="board-loading">Ładowanie…</p> : null}

          <div className="task-columns">
            {columns.map((col) => (
              <div key={col.key} className={`task-column task-column--${col.key}`}>
                <h3 className="task-column__header">{col.label}</h3>
                <div className="task-column__tasks">
                  {tasks
                    .filter((t) => t.state === col.key)
                    .map((task) => (
                      <div key={task.id} className="task-card">
                        <div className="task-card__header">
                          <span className="task-card__title">{task.name}</span>
                          <span className={`task-card__priority task-card__priority--${task.priority}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </div>
                        <span className="task-card__meta">
                          #{task.id} · {task.estimatedTime}h {task.actualTime !== null ? `(${task.actualTime}h)` : ''} · {userLabel(task.assignedUserId)}
                        </span>
                        <select
                          className="task-card__assign-select"
                          value={task.assignedUserId !== null ? String(task.assignedUserId) : ''}
                          onChange={async (e) => {
                            const val = e.target.value
                            setBusy(true)
                            setError(null)
                            try {
                              await api.updateTask(task.id, {
                                assignedUserId: val === '' ? null : Number(val),
                              })
                              await reload()
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Błąd przypisania')
                            } finally {
                              setBusy(false)
                            }
                          }}
                          disabled={busy}
                          aria-label="Przypisz do"
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.2em 0.4em',
                            borderRadius: '6px',
                            border: '1px solid #444',
                            background: '#1a1a1a',
                            color: 'inherit',
                            marginTop: '0.2rem',
                          }}
                        >
                          <option value="">— nieprzypisany —</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName} ({u.role})
                            </option>
                          ))}
                        </select>
                        <div className="task-card__actions">
                          {col.key !== 'todo' && (
                            <button
                              className="task-card__btn task-card__btn--move"
                              onClick={() => void handleMove(task.id, col.key === 'doing' ? 'todo' : 'doing')}
                              disabled={busy}
                              title="Przenieś w lewo"
                            >
                              ←
                            </button>
                          )}
                          {col.key !== 'done' && (
                            <button
                              className="task-card__btn task-card__btn--move"
                              onClick={() => void handleMove(task.id, col.key === 'todo' ? 'doing' : 'done')}
                              disabled={busy}
                              title="Przenieś w prawo"
                            >
                              →
                            </button>
                          )}
                          <button
                            className="task-card__btn task-card__btn--detail"
                            onClick={() => setDetailTaskId(detailTaskId === task.id ? null : task.id)}
                            disabled={busy}
                            title="Szczegóły"
                          >
                            {detailTaskId === task.id ? '▲' : 'Szczegóły'}
                          </button>
                          <button
                            className="task-card__btn task-card__btn--delete"
                            onClick={() => void handleDelete(task.id)}
                            disabled={busy}
                            title="Usuń"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  {tasks.filter((t) => t.state === col.key).length === 0 ? (
                    <p className="task-column__empty">Brak zadań</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {detailTask ? (
            <TaskDetail
              key={detailTask.id}
              task={detailTask}
              storyName={storyName}
              assignableUsers={assignableUsers}
              onChange={async (patch) => {
                setBusy(true)
                setError(null)
                try {
                  await api.updateTask(detailTask.id, patch)
                  await reload()
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Błąd aktualizacji')
                } finally {
                  setBusy(false)
                }
              }}
              onDelete={async () => {
                await handleDelete(detailTask.id)
              }}
              onClose={() => setDetailTaskId(null)}
              busy={busy}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

interface TaskDetailProps {
  task: Task
  storyName: string
  assignableUsers: User[]
  onChange: (patch: { name?: string; description?: string; priority?: TaskPriority; estimatedTime?: number; actualTime?: number | null; assignedUserId?: number | null; state?: TaskState }) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
  busy: boolean
}

function TaskDetail({ task, storyName, assignableUsers, onChange, onDelete, onClose, busy }: TaskDetailProps) {
  const [name, setName] = useState(task.name)
  const [description, setDescription] = useState(task.description)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [estimatedTime, setEstimatedTime] = useState<string>(String(task.estimatedTime))
  const [actualTime, setActualTime] = useState<string>(
    task.actualTime !== null ? String(task.actualTime) : '',
  )
  const [assignedUserId, setAssignedUserId] = useState<string>(
    task.assignedUserId !== null ? String(task.assignedUserId) : '',
  )

  useEffect(() => {
    setName(task.name)
    setDescription(task.description)
    setPriority(task.priority)
    setEstimatedTime(String(task.estimatedTime))
    setActualTime(task.actualTime !== null ? String(task.actualTime) : '')
    setAssignedUserId(task.assignedUserId !== null ? String(task.assignedUserId) : '')
  }, [task])

  const handleSave = async () => {
    const et = Number(estimatedTime)
    if (!name.trim() || !Number.isFinite(et) || et <= 0) return
    const at = actualTime.trim() === '' ? null : Number(actualTime)
    if (at !== null && (!Number.isFinite(at) || at < 0)) return
    await onChange({
      name: name.trim(),
      description: description.trim(),
      priority,
      estimatedTime: et,
      actualTime: at,
      assignedUserId: assignedUserId === '' ? null : Number(assignedUserId),
    })
  }

  const handleMarkDone = async () => {
    await onChange({ state: 'done' })
  }

  return (
    <div className="task-detail">
      <h3 className="task-detail__title">Szczegóły zadania #{task.id}</h3>
      <div className="task-detail__grid">
        <div className="task-detail__field">
          <label>Nazwa</label>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </div>
        <div className="task-detail__field">
          <label>Priorytet</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} disabled={busy}>
            <option value="low">{PRIORITY_LABELS.low}</option>
            <option value="medium">{PRIORITY_LABELS.medium}</option>
            <option value="high">{PRIORITY_LABELS.high}</option>
          </select>
        </div>
        <div className="task-detail__field">
          <label>Przewidywany czas (h)</label>
          <input type="number" min={1} step={1} value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} disabled={busy} />
        </div>
        <div className="task-detail__field">
          <label>Zrealizowane roboczogodziny</label>
          <input type="number" min={0} step={0.5} value={actualTime} onChange={(e) => setActualTime(e.target.value)} disabled={busy} placeholder="—" />
        </div>
        <div className="task-detail__field">
          <label>Przypisana osoba</label>
          <select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} disabled={busy}>
            <option value="">— nieprzypisany —</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.role})
              </option>
            ))}
          </select>
        </div>
        <div className="task-detail__field">
          <label>Historyjka</label>
          <span className="task-detail__info">{storyName}</span>
        </div>
        <div className="task-detail__field">
          <label>Stan</label>
          <span className="task-detail__info">{task.state === 'todo' ? 'Czekające' : task.state === 'doing' ? 'W trakcie' : 'Zamknięte'}</span>
        </div>
        <div className="task-detail__field">
          <label>Data dodania</label>
          <span className="task-detail__info">{formatDate(task.createdAt)}</span>
        </div>
        <div className="task-detail__field">
          <label>Data startu</label>
          <span className="task-detail__info">{formatDate(task.startDate)}</span>
        </div>
        <div className="task-detail__field">
          <label>Data zakończenia</label>
          <span className="task-detail__info">{formatDate(task.endDate)}</span>
        </div>
        <div className="task-detail__field" style={{ gridColumn: '1 / -1' }}>
          <label>Opis</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} rows={3} />
        </div>
      </div>
      <div className="task-detail__actions">
        <button className="btn-primary" onClick={() => void handleSave()} disabled={busy || !name.trim()}>
          Zapisz zmiany
        </button>
        {task.state !== 'done' && (
          <button className="btn-success" onClick={() => void handleMarkDone()} disabled={busy}>
            Oznacz jako zakończone
          </button>
        )}
        <button className="btn-danger" onClick={() => void onDelete()} disabled={busy}>
          Usuń zadanie
        </button>
        <button className="btn-secondary" onClick={onClose} disabled={busy}>
          Zamknij szczegóły
        </button>
      </div>
    </div>
  )
}
