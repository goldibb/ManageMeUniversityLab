export type NotificationPriority = 'low' | 'medium' | 'high'

export interface Notification {
  id: number
  title: string
  created: string
  priority: NotificationPriority
  seen: boolean
  recipientId: number
}
