import { ROLE_HOME_PATH, type UserRole } from "@/features/auth/types";

export function getHomePathForRole(role: UserRole) {
  return ROLE_HOME_PATH[role];
}

export function isAdminRole(role: UserRole) {
  return role === "ADMIN";
}
