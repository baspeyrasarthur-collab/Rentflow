import { describe, expect, it } from "vitest";

import {
  assertAuthenticated,
  assertCanAccessOwnerResource,
  assertCanAccessTenantResource,
  assertRole,
  type AuthenticatedPrincipal,
} from "@/server/security/access-control";

const owner: AuthenticatedPrincipal = {
  userId: "owner_1",
  role: "OWNER",
};

const tenant: AuthenticatedPrincipal = {
  userId: "tenant_1",
  role: "TENANT",
};

const admin: AuthenticatedPrincipal = {
  userId: "admin_1",
  role: "ADMIN",
};

describe("access control helpers", () => {
  it("requires authentication", () => {
    expect(() => assertAuthenticated(null)).toThrow(
      "Authentication is required.",
    );
  });

  it("allows admins to access owner and tenant scoped resources", () => {
    expect(() =>
      assertCanAccessOwnerResource(admin, { ownerUserId: "owner_1" }),
    ).not.toThrow();
    expect(() =>
      assertCanAccessTenantResource(admin, { tenantUserId: "tenant_1" }),
    ).not.toThrow();
  });

  it("denies cross-tenant resource access", () => {
    expect(() =>
      assertCanAccessTenantResource(tenant, { tenantUserId: "tenant_2" }),
    ).toThrow("Tenant resource access denied.");
  });

  it("checks allowed roles", () => {
    expect(() => assertRole(owner, ["OWNER"])).not.toThrow();
    expect(() => assertRole(owner, ["TENANT"])).toThrow(
      "This role cannot access this resource.",
    );
  });
});
