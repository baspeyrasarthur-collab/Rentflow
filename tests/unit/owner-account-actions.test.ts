import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  redirect: vi.fn(),
  requireOwnerAccess: vi.fn(),
  tenantProfileFindUnique: vi.fn(),
  tenantProfileUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { createTenantProfileFromOwnerAccountAction } from "@/app/(owner)/owner/account/actions";

describe("owner account tenant profile creation action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        email: "owner@example.com",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
      },
    });
    mocks.tenantProfileFindUnique.mockResolvedValue(null);
    mocks.tenantProfileUpsert.mockResolvedValue({
      id: "tenant_profile_created",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        tenantProfile: {
          findUnique: mocks.tenantProfileFindUnique,
          upsert: mocks.tenantProfileUpsert,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates a TenantProfile from owner account and redirects to tenant space", async () => {
    await expect(
      createTenantProfileFromOwnerAccountAction(),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.requireOwnerAccess).toHaveBeenCalled();
    expect(mocks.tenantProfileFindUnique).toHaveBeenCalledWith({
      where: {
        userId: "user_owner",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.tenantProfileUpsert).toHaveBeenCalledWith({
      where: {
        userId: "user_owner",
      },
      update: {},
      create: {
        userId: "user_owner",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "tenant_profile.created_from_account",
        entityType: "TenantProfile",
        entityId: "tenant_profile_created",
        metadata: {
          source: "owner_account_create_tenant_profile",
          alreadyExisted: false,
        },
      }),
    });
  });

  it("does not create a duplicate TenantProfile when it already exists", async () => {
    mocks.tenantProfileFindUnique.mockResolvedValue({
      id: "tenant_profile_existing",
    });

    await expect(
      createTenantProfileFromOwnerAccountAction(),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    expect(mocks.tenantProfileUpsert).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "tenant_profile.created_from_account",
        entityType: "TenantProfile",
        entityId: "tenant_profile_existing",
        metadata: {
          source: "owner_account_create_tenant_profile",
          alreadyExisted: true,
        },
      }),
    });
  });

  it("keeps User.role and OwnerProfile unchanged by only writing TenantProfile and AuditLog", async () => {
    await expect(
      createTenantProfileFromOwnerAccountAction(),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant",
    });

    const transactionCallback = mocks.transaction.mock.calls[0]?.[0];

    expect(typeof transactionCallback).toBe("function");
    expect(mocks.tenantProfileUpsert).toHaveBeenCalledTimes(1);
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(1);
  });

  it("refuses ADMIN through requireOwnerAccess", async () => {
    mocks.requireOwnerAccess.mockRejectedValue(
      Object.assign(new Error("FORBIDDEN"), { code: "FORBIDDEN" }),
    );

    await expect(createTenantProfileFromOwnerAccountAction()).rejects.toThrow(
      "FORBIDDEN",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
