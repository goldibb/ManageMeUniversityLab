import type { CurrentUserDto, Project } from '../types/project'
import type { CreateStoryInput, Story, UpdateStoryInput } from '../types/story'

const BASE = '/api'

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

async function ensureOk(res: Response): Promise<void> {
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`)
  const data = await parseJson<{ projects: Project[] }>(res)
  return data.projects
}

export async function fetchCurrentUser(): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/users/me`)
  return parseJson(res)
}

export async function patchActiveProject(projectId: number | null): Promise<CurrentUserDto> {
  const res = await fetch(`${BASE}/users/me/active-project`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  })
  return parseJson(res)
}

export async function fetchStories(projectId: number): Promise<Story[]> {
  const res = await fetch(
    `${BASE}/stories?projectId=${encodeURIComponent(String(projectId))}`,
  )
  const data = await parseJson<{ stories: Story[] }>(res)
  return data.stories
}

export async function fetchStory(id: number): Promise<Story> {
  const res = await fetch(`${BASE}/stories/${id}`)
  return parseJson(res)
}

export async function createStory(input: CreateStoryInput): Promise<Story> {
  const res = await fetch(`${BASE}/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJson(res)
}

export async function updateStory(id: number, patch: UpdateStoryInput): Promise<Story> {
  const res = await fetch(`${BASE}/stories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return parseJson(res)
}

export async function deleteStory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/stories/${id}`, { method: 'DELETE' })
  await ensureOk(res)
}
