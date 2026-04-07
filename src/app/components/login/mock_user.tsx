export interface User {
    id: number
    firstName: string
    lastName: string
  }


  export const MOCK_CURRENT_USER: User = {
    id: 1,
    firstName: 'Igor',
    lastName: 'Nejman',
  }
  export function getCurrentUser(): User {
    return MOCK_CURRENT_USER
  }