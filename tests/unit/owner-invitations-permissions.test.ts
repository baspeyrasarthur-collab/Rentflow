import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  canInviteTenantToContract,
  getOwnerContractForInvitation,
} from "@/server/owner/invitations";

const mocks = vi.hoisted(() => ({
  getCurrentOwnerProfileForProperties: vi.fn(),
  propertyFindFirst: vi.fn(),
  rentalContractFindFirst: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    property: {
      findFirst: mocks.propertyFindFirst,
    },
    rentalContract: {
      findFirst: mocks.rentalContractFindFirst,
    },
  },
}));

describe("owner invitation helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentOwnerProfileForProperties.mockResolvedValue({
      user: {
        id: "user_owner",
        role: "OWNER",
      },
      ownerProfile: {
        id: "owner_profile_1",
        userId: "user_owner",
      },
    });
    mocks.propertyFindFirst.mockResolvedValue({
      id: "property_1",
      ownerProfileId: "owner_profile_1",
    });
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
      propertyId: "property_1",
      ownerProfileId: "owner_profile_1",
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      status: "DRAFT",
    });
  });

  it("allows invitations only for draft contracts", () => {
    expect(canInviteTenantToContract("DRAFT")).toBe(true);
    expect(canInviteTenantToContract("ACTIVE")).toBe(false);
    expect(canInviteTenantToContract("SUSPENDED")).toBe(false);
    expect(canInviteTenantToContract("TERMINATED")).toBe(false);
    expect(canInviteTenantToContract("ARCHIVED")).toBe(false);
  });

  it("loads an individual contract after verifying property ownership", async () => {
    await expect(
      getOwnerContractForInvitation("property_1", "contract_1"),
    ).resolves.toMatchObject({
      property: {
        id: "property_1",
      },
      contract: {
        id: "contract_1",
      },
    });

    expect(mocks.propertyFindFirst).toHaveBeenCalledWith({
      where: {
        id: "property_1",
        ownerProfileId: "owner_profile_1",
      },
      select: {
        id: true,
        ownerProfileId: true,
      },
    });
    expect(mocks.rentalContractFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "contract_1",
          propertyId: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("does not query contracts when the property does not belong to the owner", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      getOwnerContractForInvitation("property_2", "contract_1"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.rentalContractFindFirst).not.toHaveBeenCalled();
  });

  it("does not allow ADMIN to act as an owner in this scope", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "This role cannot access this resource.",
    );
    mocks.getCurrentOwnerProfileForProperties.mockRejectedValue(error);

    await expect(
      getOwnerContractForInvitation("property_1", "contract_1"),
    ).rejects.toBe(error);

    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
    expect(mocks.rentalContractFindFirst).not.toHaveBeenCalled();
  });

  it("rejects non-individual or colocation contracts", async () => {
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
      propertyId: "property_1",
      ownerProfileId: "owner_profile_1",
      contractType: "COLOCATION",
      colocationMode: "LINKED_LEASES",
      status: "DRAFT",
    });

    await expect(
      getOwnerContractForInvitation("property_1", "contract_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects contracts that are not draft", async () => {
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
      propertyId: "property_1",
      ownerProfileId: "owner_profile_1",
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      status: "ACTIVE",
    });

    await expect(
      getOwnerContractForInvitation("property_1", "contract_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
