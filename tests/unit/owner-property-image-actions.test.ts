import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  getCurrentOwnerProfileForProperties: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyUpdate: vi.fn(),
  redirect: vi.fn(),
  removeLocalPropertyImageByUrl: vi.fn(),
  transaction: vi.fn(),
  uploadLocalPropertyImage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    property: {
      findFirst: mocks.propertyFindFirst,
    },
  },
}));

vi.mock("@/server/owner/properties", () => ({
  deleteOwnerPropertyPermanently: vi.fn(),
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/storage/property-images", () => ({
  removeLocalPropertyImageByUrl: mocks.removeLocalPropertyImageByUrl,
  uploadLocalPropertyImage: mocks.uploadLocalPropertyImage,
}));

import {
  removeOwnerPropertyImageAction,
  updateOwnerPropertyImageAction,
} from "@/app/(owner)/owner/properties/[id]/actions";

function createImageFormData(propertyId = "property_1") {
  const formData = new FormData();

  formData.set("propertyId", propertyId);
  formData.set(
    "image",
    new File([new Uint8Array([1, 2, 3])], "salon.jpg", {
      type: "image/jpeg",
    }),
  );

  return formData;
}

function createRemoveFormData(propertyId = "property_1") {
  const formData = new FormData();

  formData.set("propertyId", propertyId);
  formData.set("confirmRemoveImage", "on");

  return formData;
}

describe("owner property image actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      user: {
        id: "user_owner",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      imageUrl: "/uploads/properties/old-photo.jpg",
      imageStorageKey: "old-photo.jpg",
    });
    mocks.uploadLocalPropertyImage.mockResolvedValue({
      key: "property_1-new-photo.jpg",
      url: "/uploads/properties/property_1-new-photo.jpg",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        property: {
          update: mocks.propertyUpdate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("updates the image only for a property owned by the current owner", async () => {
    await expect(
      updateOwnerPropertyImageAction(createImageFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1",
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith({
      where: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
      },
      select: {
        id: true,
        imageUrl: true,
      },
    });
    expect(mocks.uploadLocalPropertyImage).toHaveBeenCalledWith({
      file: expect.any(File),
      propertyId: "property_1",
    });
    expect(mocks.propertyUpdate).toHaveBeenCalledWith({
      where: {
        id: "property_1",
      },
      data: {
        imageStorageKey: "property_1-new-photo.jpg",
        imageUrl: "/uploads/properties/property_1-new-photo.jpg",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "property.image_updated",
        entityId: "property_1",
        entityType: "Property",
        userId: "user_owner",
        metadata: expect.objectContaining({
          source: "owner_update_property_image",
        }),
      }),
    });
    expect(mocks.removeLocalPropertyImageByUrl).toHaveBeenCalledWith(
      "/uploads/properties/old-photo.jpg",
    );
  });

  it("refuses to update an image for a property outside the owner scope", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      updateOwnerPropertyImageAction(createImageFormData("property_other")),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.uploadLocalPropertyImage).not.toHaveBeenCalled();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
  });

  it("removes the image reference with confirmation and audit log", async () => {
    await expect(
      removeOwnerPropertyImageAction(createRemoveFormData()),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/properties/property_1",
    });

    expect(mocks.propertyUpdate).toHaveBeenCalledWith({
      where: {
        id: "property_1",
      },
      data: {
        imageStorageKey: null,
        imageUrl: null,
      },
      select: {
        id: true,
      },
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "property.image_removed",
        entityId: "property_1",
        entityType: "Property",
        metadata: expect.objectContaining({
          previousImageStorageKey: "old-photo.jpg",
          source: "owner_remove_property_image",
        }),
      }),
    });
    expect(mocks.removeLocalPropertyImageByUrl).toHaveBeenCalledWith(
      "/uploads/properties/old-photo.jpg",
    );
  });

  it("refuses image removal without explicit confirmation", async () => {
    const formData = new FormData();
    formData.set("propertyId", "property_1");

    await expect(
      removeOwnerPropertyImageAction(formData),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
    expect(mocks.propertyUpdate).not.toHaveBeenCalled();
  });
});
