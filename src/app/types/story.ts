export type StoryPriority = 'low' | 'medium' | 'high'

export type StoryState = 'todo' | 'doing' | 'done'

/** Historyjka (funkcjonalność) — zgodnie z modelem z laboratorium */
export interface Story {
  id: number
  name: string
  description: string
  priority: StoryPriority
  projectId: number
  createdAt: string
  state: StoryState
  ownerId: number
}

export interface CreateStoryInput {
  projectId: number
  name: string
  description: string
  priority: StoryPriority
  state?: StoryState
  ownerId?: number
}

export interface UpdateStoryInput {
  name?: string
  description?: string
  priority?: StoryPriority
  state?: StoryState
  ownerId?: number
}
