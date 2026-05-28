import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  redirect: vi.fn(),
  removeLocalProfileImageByUrl: vi.fn(),
  requireOwnerAccess: vi.fn(),
  requireTenantAccess: vi.fn(),
  transaction: vi.fn(),
  uploadLocalProfileImage: vi.fn(),
  userFindUnique: vi.fn(),
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
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock("@/server/storage/profile-images", () => ({
  removeLocalProfileImageByUrl: mocks.removeLocalProfileImageByUrl,
  uploadLocalProfileImage: mocks.uploadLocalProfileImage,
}));

import {
  removeOwnerAccountProfileImageAction,
  updateOwnerAccountProfileImageAction,
} from "@/app/(owner)/owner/account/actions";
import { removeTenantAccountProfileImageAction } from "@/app/(tenant)/tenant/account/actions";

function createImageFormData() {
  const formData = new FormData();

  formData.set(
    "image",
    new File([new Uint8Array([1, 2, 3])], "avatar.webp", {
      type: "image/webp",
    }),
  );

  return formData;
}

function createRemoveFormData() {
  const formData = new FormData();

  formData.set("confirmRemoveProfileImage", "on");

  return formData;
}

describe("profile image account actions", () => {
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
    mocks.userFindUnique.mockResolvedValue({
      id: "user_owner",
      profileImageUrl: "/uploads/profiles/old-profile.jpg",
      profileImageStorageKey: "old-profile.jpg",
    });
    mocks.uploadLocalProfileImage.mockResolvedValue({
      key: "user_owner-new-profile.webp",
      url: "/uploads/profiles/user_owner-new-profile.webp",
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

  it("updates only the connected owner user profile image", async () => {
    await expect(
      updateOwnerAccountProfileImageAction(createImageFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/account",
    });

    expect(mocks.requireOwnerAccess).toHaveBeenCalled();
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: {
        id: "user_owner",
      },
      select: {
        id: true,
        profileImageUrl: true,
      },
    });
    expect(mocks.uploadLocalProfileImage).toHaveBeenCalledWith({
      file: expect.any(File),
      userId: "user_owner",
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: {
        id: "user_owner",
      },
      data: {
        profileImageStorageKey: "user_owner-new-profile.webp",
        profileImageUrl: "/uploads/profiles/user_owner-new-profile.webp",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.profile_image_updated",
        entityId: "user_owner",
        entityType: "User",
        userId: "user_owner",
        metadata: expect.objectContaining({
          source: "owner_account_update_profile_image",
        }),
      }),
    });
    expect(mocks.removeLocalProfileImageByUrl).toHaveBeenCalledWith(
      "/uploads/profiles/old-profile.jpg",
    );
  });

  it("removes only the connected tenant user profile image", async () => {
    mocks.userFindUnique.mockResolvedValue({
      id: "user_tenant",
      profileImageUrl: "/uploads/profiles/tenant-profile.jpg",
      profileImageStorageKey: "tenant-profile.jpg",
    });

    await expect(
      removeTenantAccountProfileImageAction(createRemoveFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/tenant/account",
    });

    expect(mocks.requireTenantAccess).toHaveBeenCalled();
    expect(mocks.userFindUnique).toHaveBeenCalledWith({
      where: {
        id: "user_tenant",
      },
      select: {
        id: true,
        profileImageStorageKey: true,
        profileImageUrl: true,
      },
    });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: {
        id: "user_tenant",
      },
      data: {
        profileImageStorageKey: null,
        profileImageUrl: null,
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.profile_image_removed",
        entityId: "user_tenant",
        entityType: "User",
        userId: "user_tenant",
        metadata: expect.objectContaining({
          previousProfileImageStorageKey: "tenant-profile.jpg",
          source: "tenant_account_remove_profile_image",
        }),
      }),
    });
    expect(mocks.removeLocalProfileImageByUrl).toHaveBeenCalledWith(
      "/uploads/profiles/tenant-profile.jpg",
    );
  });

  it("refuses removal without explicit confirmation", async () => {
    await expect(
      removeOwnerAccountProfileImageAction(new FormData()),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.userFindUnique).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("does not modify User.role or profiles", async () => {
    await expect(
      updateOwnerAccountProfileImageAction(createImageFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
    });

    expect(mocks.userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          profileImageStorageKey: "user_owner-new-profile.webp",
          profileImageUrl: "/uploads/profiles/user_owner-new-profile.webp",
        },
      }),
    );
  });
});
