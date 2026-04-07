import { useCallback, useEffect, useState } from 'react'
import './board.css'
import * as api from '../../api/client'
import { useActiveProject } from '../../context/ActiveProjectContext'
import type { Story, StoryPriority, StoryState } from '../../types/story'

const columns: { key: StoryState; label: string }[] = [
  { key: 'todo', label: 'Czekające na wykonanie' },
  { key: 'doing', label: 'W trakcie (wykonywane)' },
  { key: 'done', label: 'Zamknięte' },
]

const PRIORITY_LABELS: Record<StoryPriority, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
}

export default function Board() {
  const { activeProjectId } = useActiveProject()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<StoryPriority>('medium')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<StoryPriority>('medium')

  const reload = useCallback(async () => {
    if (activeProjectId == null) {
      setStories([])
      return
    }
    setLoading(true)
    setListError(null)
    try {
      const list = await api.fetchStories(activeProjectId)
      setStories(list)
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Nie udało się pobrać historyjek')
      setStories([])
    } finally {
      setLoading(false)
    }
  }, [activeProjectId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (editingId == null) return
    const s = stories.find((x) => x.id === editingId)
    if (s) {
      setEditName(s.name)
      setEditDescription(s.description)
      setEditPriority(s.priority)
    }
  }, [editingId, stories])

  const noProject = activeProjectId == null

  const handleCreate = async () => {
    if (noProject || !newName.trim()) return
    setBusy(true)
    setActionError(null)
    try {
      await api.createStory({
        projectId: activeProjectId,
        name: newName.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        state: 'todo',
      })
      setNewName('')
      setNewDescription('')
      setNewPriority('medium')
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: number) => {
    setBusy(true)
    setActionError(null)
    try {
      await api.deleteStory(id)
      if (editingId === id) setEditingId(null)
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Błąd usuwania')
    } finally {
      setBusy(false)
    }
  }

  const handleMove = async (id: number, state: StoryState) => {
    setBusy(true)
    setActionError(null)
    try {
      await api.updateStory(id, { state })
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Błąd zmiany stanu')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveEdit = async () => {
    if (editingId == null || !editName.trim()) return
    setBusy(true)
    setActionError(null)
    try {
      await api.updateStory(editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
        priority: editPriority,
      })
      setEditingId(null)
      await reload()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Błąd zapisu')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="board-container">
      <h1 className="board-title">Historyjki projektu</h1>
      {noProject ? (
        <p className="board-hint">
          Wybierz aktywny projekt w nagłówku, aby zobaczyć i edytować historyjki.
        </p>
      ) : null}
      {listError ? <p className="board-error">{listError}</p> : null}
      {actionError ? <p className="board-error">{actionError}</p> : null}
      {loading && !noProject ? <p className="board-loading">Ładowanie…</p> : null}

      <div className="board-add-task">
        <input
          type="text"
          placeholder="Nazwa historyjki…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={noProject || busy}
        />
        <input
          type="text"
          placeholder="Opis…"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={noProject || busy}
        />
        <select
          className="board-add-task__select"
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as StoryPriority)}
          disabled={noProject || busy}
          aria-label="Priorytet"
        >
          <option value="low">{PRIORITY_LABELS.low}</option>
          <option value="medium">{PRIORITY_LABELS.medium}</option>
          <option value="high">{PRIORITY_LABELS.high}</option>
        </select>
        <button type="button" onClick={() => void handleCreate()} disabled={noProject || busy}>
          Dodaj
        </button>
      </div>

      <div className="board-columns">
        {columns.map((col) => (
          <div key={col.key} className={`board-column board-column--${col.key}`}>
            <h2 className="board-column__header">{col.label}</h2>
            <div className="board-column__tasks">
              {stories
                .filter((s) => s.state === col.key)
                .map((story) => (
                  <div key={story.id} className="board-task">
                    {editingId === story.id ? (
                      <div className="board-task__edit">
                        <input
                          className="board-task__edit-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={busy}
                        />
                        <textarea
                          className="board-task__edit-textarea"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          disabled={busy}
                          rows={2}
                        />
                        <select
                          value={editPriority}
                          onChange={(e) => setEditPriority(e.target.value as StoryPriority)}
                          disabled={busy}
                          aria-label="Priorytet"
                        >
                          <option value="low">{PRIORITY_LABELS.low}</option>
                          <option value="medium">{PRIORITY_LABELS.medium}</option>
                          <option value="high">{PRIORITY_LABELS.high}</option>
                        </select>
                        <div className="board-task__edit-actions">
                          <button type="button" onClick={() => void handleSaveEdit()} disabled={busy}>
                            Zapisz
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={busy}
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="board-task__body">
                          <span className="board-task__title">{story.name}</span>
                          {story.description ? (
                            <span className="board-task__description">{story.description}</span>
                          ) : null}
                          <span className={`board-task__priority board-task__priority--${story.priority}`}>
                            {PRIORITY_LABELS[story.priority]}
                          </span>
                          <span className="board-task__meta">
                            #{story.id} · właściciel {story.ownerId}
                          </span>
                        </div>
                        <div className="board-task__actions">
                          {col.key !== 'todo' && (
                            <button
                              type="button"
                              className="board-task__btn board-task__btn--left"
                              onClick={() =>
                                void handleMove(
                                  story.id,
                                  col.key === 'doing' ? 'todo' : 'doing',
                                )
                              }
                              title="Przenieś w lewo"
                              disabled={noProject || busy}
                            >
                              ←
                            </button>
                          )}
                          {col.key !== 'done' && (
                            <button
                              type="button"
                              className="board-task__btn board-task__btn--right"
                              onClick={() =>
                                void handleMove(
                                  story.id,
                                  col.key === 'todo' ? 'doing' : 'done',
                                )
                              }
                              title="Przenieś w prawo"
                              disabled={noProject || busy}
                            >
                              →
                            </button>
                          )}
                          <button
                            type="button"
                            className="board-task__btn board-task__btn--edit"
                            onClick={() => setEditingId(story.id)}
                            title="Edytuj"
                            disabled={noProject || busy}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="board-task__btn board-task__btn--delete"
                            onClick={() => void handleDelete(story.id)}
                            title="Usuń"
                            disabled={noProject || busy}
                          >
                            ✕
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              {!noProject && !loading && stories.filter((s) => s.state === col.key).length === 0 ? (
                <p className="board-column__empty">Brak historyjek</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
