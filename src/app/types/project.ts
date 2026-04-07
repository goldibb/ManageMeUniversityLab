export interface Project {
  id: number
  name: string
}

export interface CurrentUserDto {
  id: number
  firstName: string
  lastName: string
  activeProjectId: number | null
}
