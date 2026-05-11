import type { UserRole } from "../../types/project";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export const MOCK_CURRENT_USER: User = {
  id: 1,
  firstName: "Igor",
  lastName: "Nejman",
  role: "admin",
};
export function getCurrentUser(): User {
  return MOCK_CURRENT_USER;
}
