export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskState = 'todo' | 'doing' | 'done'

export interface Task {
  id: number
  name: string
  description: string
  priority: TaskPriority
  storyId: number
  estimatedTime: number
  state: TaskState
  createdAt: string
  startDate: string | null
  endDate: string | null
  assignedUserId: number | null
}

export interface CreateTaskInput {
  name: string
  description: string
  priority: TaskPriority
  storyId: number
  estimatedTime: number
  state?: TaskState
  assignedUserId?: number | null
}

export interface UpdateTaskInput {
  name?: string
  description?: string
  priority?: TaskPriority
  estimatedTime?: number
  state?: TaskState
  assignedUserId?: number | null
}
