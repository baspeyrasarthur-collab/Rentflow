import type { UserRole } from "@/features/auth/types";
import { AppError } from "@/server/errors";

export type AuthenticatedPrincipal = {
  userId: string;
  role: UserRole;
  disabledAt?: Date | null;
};

export type OwnerScopedResource = {
  ownerUserId: string;
};

export type TenantScopedResource = {
  tenantUserId: string;
};

export function assertAuthenticated(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  if (!principal) {
    throw new AppError("UNAUTHORIZED", "Authentication is required.");
  }

  return principal;
}

export function assertActivePrincipal(
  principal: AuthenticatedPrincipal,
): AuthenticatedPrincipal {
  if (principal.disabledAt) {
    throw new AppError("FORBIDDEN", "This account is disabled.");
  }

  return principal;
}

export function assertRole(
  principal: AuthenticatedPrincipal,
  allowedRoles: readonly UserRole[],
) {
  if (!allowedRoles.includes(principal.role)) {
    throw new AppError("FORBIDDEN", "This role cannot access this resource.");
  }
}

export function canAccessOwnerResource(
  principal: AuthenticatedPrincipal,
  resource: OwnerScopedResource,
) {
  return (
    principal.role === "ADMIN" || principal.userId === resource.ownerUserId
  );
}

export function canAccessTenantResource(
  principal: AuthenticatedPrincipal,
  resource: TenantScopedResource,
) {
  return (
    principal.role === "ADMIN" || principal.userId === resource.tenantUserId
  );
}

export function assertCanAccessOwnerResource(
  principal: AuthenticatedPrincipal,
  resource: OwnerScopedResource,
) {
  assertActivePrincipal(principal);

  if (!canAccessOwnerResource(principal, resource)) {
    throw new AppError("FORBIDDEN", "Owner resource access denied.");
  }
}

export function assertCanAccessTenantResource(
  principal: AuthenticatedPrincipal,
  resource: TenantScopedResource,
) {
  assertActivePrincipal(principal);

  if (!canAccessTenantResource(principal, resource)) {
    throw new AppError("FORBIDDEN", "Tenant resource access denied.");
  }
}
