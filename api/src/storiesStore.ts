import type { Story, StoryPriority, StoryState } from './types'
import { listProjects } from './store'

const stories: Story[] = []
let nextStoryId = 1

export function listStoriesForProject(projectId: number): Story[] {
  return stories
    .filter((s) => s.projectId === projectId)
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getStoryById(id: number): Story | undefined {
  const s = stories.find((x) => x.id === id)
  return s ? { ...s } : undefined
}

export function createStory(payload: {
  name: string
  description: string
  priority: StoryPriority
  projectId: number
  state: StoryState
  ownerId: number
}): Story | null {
  if (!listProjects().some((p) => p.id === payload.projectId)) return null
  const story: Story = {
    id: nextStoryId++,
    name: payload.name.trim(),
    description: payload.description.trim(),
    priority: payload.priority,
    projectId: payload.projectId,
    createdAt: new Date().toISOString(),
    state: payload.state,
    ownerId: payload.ownerId,
  }
  stories.push(story)
  return { ...story }
}

export function updateStory(
  id: number,
  patch: Partial<Pick<Story, 'name' | 'description' | 'priority' | 'state' | 'ownerId'>>,
): Story | null {
  const idx = stories.findIndex((x) => x.id === id)
  if (idx === -1) return null
  const cur = stories[idx]
  if (patch.name !== undefined) cur.name = patch.name.trim()
  if (patch.description !== undefined) cur.description = patch.description.trim()
  if (patch.priority !== undefined) cur.priority = patch.priority
  if (patch.state !== undefined) cur.state = patch.state
  if (patch.ownerId !== undefined) cur.ownerId = patch.ownerId
  return { ...cur }
}

export function deleteStory(id: number): boolean {
  const idx = stories.findIndex((x) => x.id === id)
  if (idx === -1) return false
  stories.splice(idx, 1)
  return true
}
