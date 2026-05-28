import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownerProfileFindUnique: vi.fn(),
  requireCurrentUser: vi.fn(),
  tenantProfileFindUnique: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
    tenantProfile: {
      findUnique: mocks.tenantProfileFindUnique,
    },
  },
}));

import { requireOwnerAccess, requireTenantAccess } from "@/server/auth/access";

describe("profile based auth access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows owner access for a TENANT role user with an OwnerProfile", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_multi",
      email: "multi@example.com",
      role: "TENANT",
      disabledAt: null,
    });
    mocks.ownerProfileFindUnique.mockResolvedValue({
      id: "owner_profile_1",
      userId: "user_multi",
      plan: "FREE",
    });

    await expect(requireOwnerAccess()).resolves.toEqual({
      user: expect.objectContaining({
        id: "user_multi",
        role: "TENANT",
      }),
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_multi",
        plan: "FREE",
      },
    });
    expect(mocks.ownerProfileFindUnique).toHaveBeenCalledWith({
      where: {
        userId: "user_multi",
      },
      select: {
        id: true,
        plan: true,
        userId: true,
      },
    });
  });

  it("refuses owner access without an OwnerProfile", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_tenant",
      role: "TENANT",
      disabledAt: null,
    });
    mocks.ownerProfileFindUnique.mockResolvedValue(null);

    await expect(requireOwnerAccess()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("allows tenant access for an OWNER role user with a TenantProfile", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_multi",
      email: "multi@example.com",
      role: "OWNER",
      disabledAt: null,
    });
    mocks.tenantProfileFindUnique.mockResolvedValue({
      id: "tenant_profile_1",
      userId: "user_multi",
    });

    await expect(requireTenantAccess()).resolves.toEqual({
      user: expect.objectContaining({
        id: "user_multi",
        role: "OWNER",
      }),
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_multi",
      },
    });
    expect(mocks.tenantProfileFindUnique).toHaveBeenCalledWith({
      where: {
        userId: "user_multi",
      },
      select: {
        id: true,
        userId: true,
      },
    });
  });

  it("refuses tenant access without a TenantProfile", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_owner",
      role: "OWNER",
      disabledAt: null,
    });
    mocks.tenantProfileFindUnique.mockResolvedValue(null);

    await expect(requireTenantAccess()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps ADMIN out of owner and tenant profile spaces", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "user_admin",
      role: "ADMIN",
      disabledAt: null,
    });

    await expect(requireOwnerAccess()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(requireTenantAccess()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(mocks.ownerProfileFindUnique).not.toHaveBeenCalled();
    expect(mocks.tenantProfileFindUnique).not.toHaveBeenCalled();
  });
});
