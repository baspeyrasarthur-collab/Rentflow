import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  redirect: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireTenantAccess: vi.fn(),
  transaction: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { updateOwnerAccountPersonalInfoAction } from "@/app/(owner)/owner/account/actions";
import { updateTenantAccountPersonalInfoAction } from "@/app/(tenant)/tenant/account/actions";

function buildFormData(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

describe("account personal info actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
    });
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        role: "TENANT",
      },
      tenantProfile: {
        id: "tenant_profile_1",
      },
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        user: {
          update: mocks.userUpdate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("updates only the connected owner User personal fields", async () => {
    await expect(
      updateOwnerAccountPersonalInfoAction(
        buildFormData({
          firstName: "  Arthur ",
          lastName: "",
          phone: " 0600000000 ",
          addressLine1: "  12 rue des Lilas ",
          addressLine2: "",
          postalCode: " 75010 ",
          city: " Paris ",
          country: " France ",
          taxResidenceCountry: " France ",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/account?focus=personal-info",
    });

    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: {
        id: "user_owner",
      },
      data: {
        firstName: "Arthur",
        lastName: null,
        phone: "0600000000",
        addressLine1: "12 rue des Lilas",
        addressLine2: null,
        postalCode: "75010",
        city: "Paris",
        country: "France",
        taxResidenceCountry: "France",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        userId: "user_owner",
        action: "user.personal_info_updated",
        entityType: "User",
        entityId: "user_owner",
        metadata: {
          source: "owner_account_update_personal_info",
        },
      },
    });
  });

  it("updates tenant account personal info with the same shared helper", async () => {
    await expect(
      updateTenantAccountPersonalInfoAction(
        buildFormData({
          firstName: "Lea",
          lastName: "Martin",
        }),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant/account",
    });

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "user_tenant",
        },
        data: expect.objectContaining({
          firstName: "Lea",
          lastName: "Martin",
        }),
      }),
    );
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_tenant",
        action: "user.personal_info_updated",
        entityType: "User",
        entityId: "user_tenant",
        metadata: {
          source: "tenant_account_update_personal_info",
        },
      }),
    });
  });

  it("refuses overly long personal information before writing", async () => {
    await expect(
      updateOwnerAccountPersonalInfoAction(
        buildFormData({
          firstName: "a".repeat(121),
        }),
      ),
    ).rejects.toThrow();

    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
