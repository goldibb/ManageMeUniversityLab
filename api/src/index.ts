import cors from 'cors'
import express from 'express'
import * as store from './store'
import * as storiesStore from './storiesStore'
import type { StoryPriority, StoryState } from './types'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const PRIORITIES: StoryPriority[] = ['low', 'medium', 'high']
const STATES: StoryState[] = ['todo', 'doing', 'done']

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/projects', (_req, res) => {
  res.json({ projects: store.listProjects() })
})

app.get('/users/me', (_req, res) => {
  res.json(store.getCurrentUser())
})

app.patch('/users/me/active-project', (req, res) => {
  const raw = req.body?.projectId
  const projectId = raw === null || raw === undefined ? null : Number(raw)
  if (raw !== null && raw !== undefined && !Number.isFinite(projectId)) {
    res.status(400).json({ error: 'projectId musi być liczbą lub null' })
    return
  }
  try {
    const user = store.setActiveProjectId(projectId)
    res.json(user)
  } catch {
    res.status(400).json({ error: 'Nieprawidłowy projekt' })
  }
})

app.get('/stories', (req, res) => {
  const projectId = Number(req.query.projectId)
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: 'Wymagany query projectId' })
    return
  }
  res.json({ stories: storiesStore.listStoriesForProject(projectId) })
})

app.get('/stories/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Nieprawidłowe id' })
    return
  }
  const story = storiesStore.getStoryById(id)
  if (!story) {
    res.status(404).json({ error: 'Nie znaleziono historyjki' })
    return
  }
  res.json(story)
})

app.post('/stories', (req, res) => {
  const me = store.getCurrentUser()
  const name = typeof req.body?.name === 'string' ? req.body.name : ''
  const description = typeof req.body?.description === 'string' ? req.body.description : ''
  const priority = req.body?.priority as StoryPriority
  const projectId = Number(req.body?.projectId)
  const state = (req.body?.state as StoryState) ?? 'todo'
  const ownerId =
    req.body?.ownerId !== undefined && req.body?.ownerId !== null
      ? Number(req.body.ownerId)
      : me.id

  if (!name.trim()) {
    res.status(400).json({ error: 'Brak nazwy' })
    return
  }
  if (!PRIORITIES.includes(priority)) {
    res.status(400).json({ error: 'Nieprawidłowy priorytet' })
    return
  }
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: 'Nieprawidłowy projectId' })
    return
  }
  if (!STATES.includes(state)) {
    res.status(400).json({ error: 'Nieprawidłowy stan' })
    return
  }
  if (!Number.isFinite(ownerId)) {
    res.status(400).json({ error: 'Nieprawidłowy ownerId' })
    return
  }

  const created = storiesStore.createStory({
    name,
    description,
    priority,
    projectId,
    state,
    ownerId,
  })
  if (!created) {
    res.status(400).json({ error: 'Nieprawidłowy projekt' })
    return
  }
  res.status(201).json(created)
})

app.patch('/stories/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Nieprawidłowe id' })
    return
  }
  const patch: Parameters<typeof storiesStore.updateStory>[1] = {}
  if (req.body?.name !== undefined) {
    if (typeof req.body.name !== 'string') {
      res.status(400).json({ error: 'name musi być stringiem' })
      return
    }
    patch.name = req.body.name
  }
  if (req.body?.description !== undefined) {
    if (typeof req.body.description !== 'string') {
      res.status(400).json({ error: 'description musi być stringiem' })
      return
    }
    patch.description = req.body.description
  }
  if (req.body?.priority !== undefined) {
    if (!PRIORITIES.includes(req.body.priority)) {
      res.status(400).json({ error: 'Nieprawidłowy priorytet' })
      return
    }
    patch.priority = req.body.priority
  }
  if (req.body?.state !== undefined) {
    if (!STATES.includes(req.body.state)) {
      res.status(400).json({ error: 'Nieprawidłowy stan' })
      return
    }
    patch.state = req.body.state
  }
  if (req.body?.ownerId !== undefined) {
    const oid = Number(req.body.ownerId)
    if (!Number.isFinite(oid)) {
      res.status(400).json({ error: 'Nieprawidłowy ownerId' })
      return
    }
    patch.ownerId = oid
  }

  const updated = storiesStore.updateStory(id, patch)
  if (!updated) {
    res.status(404).json({ error: 'Nie znaleziono historyjki' })
    return
  }
  res.json(updated)
})

app.delete('/stories/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: 'Nieprawidłowe id' })
    return
  }
  const ok = storiesStore.deleteStory(id)
  if (!ok) {
    res.status(404).json({ error: 'Nie znaleziono historyjki' })
    return
  }
  res.status(204).send()
})

app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`)
})
