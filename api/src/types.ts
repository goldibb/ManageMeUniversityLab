export interface Project {
  id: number
  name: string
}

export interface CurrentUser {
  id: number
  firstName: string
  lastName: string
  activeProjectId: number | null
}

export type StoryPriority = 'low' | 'medium' | 'high'

export type StoryState = 'todo' | 'doing' | 'done'

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
