export const USER_ROLES = ["OWNER", "TENANT", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_HOME_PATH: Record<UserRole, string> = {
  OWNER: "/owner",
  TENANT: "/tenant",
  ADMIN: "/admin",
};
