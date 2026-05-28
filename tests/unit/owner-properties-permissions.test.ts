import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  getCurrentOwnerProfileForProperties,
  getOwnerPropertyById,
  getOwnerPropertyCreationAvailability,
  listOwnerProperties,
} from "@/server/owner/properties";

const mocks = vi.hoisted(() => ({
  requireOwnerAccess: vi.fn(),
  ownerProfileFindUnique: vi.fn(),
  propertyCount: vi.fn(),
  propertyFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireOwnerAccess: mocks.requireOwnerAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    ownerProfile: {
      findUnique: mocks.ownerProfileFindUnique,
    },
    property: {
      count: mocks.propertyCount,
      findFirst: mocks.propertyFindFirst,
      findMany: mocks.propertyFindMany,
    },
  },
}));

describe("owner property permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("requires owner profile access before resolving owner properties", async () => {
    await expect(getCurrentOwnerProfileForProperties()).resolves.toEqual({
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

    expect(mocks.requireOwnerAccess).toHaveBeenCalledTimes(1);
  });

  it("does not resolve owner properties when owner profile access is denied", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "An owner profile is required to access owner space.",
    );
    mocks.requireOwnerAccess.mockRejectedValue(error);

    await expect(getCurrentOwnerProfileForProperties()).rejects.toBe(error);

    expect(mocks.ownerProfileFindUnique).not.toHaveBeenCalled();
  });

  it("lists properties with a strict ownerProfileId filter", async () => {
    mocks.propertyFindMany.mockResolvedValue([]);

    await expect(listOwnerProperties()).resolves.toEqual([]);

    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("loads property creation availability from the owner plan and property count", async () => {
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

    await expect(getOwnerPropertyCreationAvailability()).resolves.toEqual({
      plan: "PRO",
      currentPropertyCount: 14,
      maxProperties: 15,
      canCreateProperty: true,
    });

    expect(mocks.propertyCount).toHaveBeenCalledWith({
      where: {
        ownerProfileId: "owner_profile_1",
      },
    });
  });

  it("loads one property with id and ownerProfileId filters", async () => {
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
    });

    await expect(getOwnerPropertyById("property_1")).resolves.toEqual({
      id: "property_1",
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });
});
