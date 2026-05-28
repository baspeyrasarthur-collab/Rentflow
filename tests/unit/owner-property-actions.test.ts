import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerPropertyAction } from "@/app/(owner)/owner/properties/new/actions";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  ownerProfileFindUnique: vi.fn(),
  propertyCount: vi.fn(),
  propertyCreate: vi.fn(),
  redirect: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireRole: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/auth/current-user", () => ({
  requireRole: mocks.requireRole,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
  },
}));

function createValidPropertyFormData() {
  const formData = new FormData();

  formData.set("name", "Appartement Test");
  formData.set("addressLine1", "1 rue du Test");
  formData.set("postalCode", "75001");
  formData.set("city", "Paris");
  formData.set("country", "FR");
  formData.set("propertyType", "APARTMENT");
  formData.set("surfaceAreaSqm", "42");
  formData.set("furnished", "on");

  return formData;
}

describe("owner property creation action plan gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireRole.mockResolvedValue({
      id: "user_owner",
      role: "OWNER",
    });
    mocks.ownerProfileFindUnique.mockResolvedValue({
      id: "owner_profile_1",
      userId: "user_owner",
      plan: "FREE",
    });
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "TENANT",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "FREE",
      },
    });
    mocks.propertyCount.mockResolvedValue(0);
    mocks.propertyCreate.mockResolvedValue({
      id: "property_1",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        property: {
          count: mocks.propertyCount,
          create: mocks.propertyCreate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("allows FREE owners with zero properties to create a property", async () => {
    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties",
    });

    expect(mocks.propertyCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
      },
    });
    expect(mocks.propertyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerProfileId: "owner_profile_1",
          status: "DRAFT",
        }),
      }),
    );
  });

  it("blocks FREE owners that already have one property", async () => {
    mocks.propertyCount.mockResolvedValue(1);

    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Your current plan does not allow adding another property.",
    });

    expect(mocks.propertyCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("allows PRO owners below fifteen properties to create a property", async () => {
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "PRO",
      },
    });
    mocks.propertyCount.mockResolvedValue(14);

    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties",
    });

    expect(mocks.propertyCreate).toHaveBeenCalled();
  });

  it("blocks PRO owners that already have fifteen properties", async () => {
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "PRO",
      },
    });
    mocks.propertyCount.mockResolvedValue(15);

    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toBeInstanceOf(AppError);

    expect(mocks.propertyCreate).not.toHaveBeenCalled();
  });

  it("allows SCALE owners beyond fifteen properties", async () => {
    mocks.requireOwnerAccess.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
        plan: "SCALE",
      },
    });
    mocks.propertyCount.mockResolvedValue(25);

    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties",
    });

    expect(mocks.propertyCreate).toHaveBeenCalled();
  });

  it("counts only properties for the connected owner profile", async () => {
    await expect(
      createOwnerPropertyAction(createValidPropertyFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
    });

    expect(mocks.propertyCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
      },
    });
  });
});
