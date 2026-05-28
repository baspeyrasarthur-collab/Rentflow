import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  getOwnerPropertyContractById,
  listOwnerPropertyContracts,
} from "@/server/owner/contracts";

const mocks = vi.hoisted(() => ({
  getCurrentOwnerProfileForProperties: vi.fn(),
  propertyFindFirst: vi.fn(),
  rentalContractFindFirst: vi.fn(),
  rentalContractFindMany: vi.fn(),
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
      findMany: mocks.rentalContractFindMany,
    },
  },
}));

describe("owner contract read permissions", () => {
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
  });

  it("lists contracts only after verifying property ownership", async () => {
    mocks.rentalContractFindMany.mockResolvedValue([]);

    await expect(listOwnerPropertyContracts("property_1")).resolves.toEqual([]);

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
    expect(mocks.rentalContractFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          propertyId: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("loads one contract with propertyId, contractId, and ownerProfileId filters", async () => {
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
    });

    await expect(
      getOwnerPropertyContractById("property_1", "contract_1"),
    ).resolves.toEqual({
      id: "contract_1",
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

  it("loads only the latest declaration for contract payments regardless of type", async () => {
    mocks.rentalContractFindFirst.mockResolvedValue({
      id: "contract_1",
      payments: [
        {
          id: "payment_1",
          declarations: [
            {
              id: "payment_declaration_latest",
              declarationType: "NOT_PAID_YET",
              declaredAt: new Date("2026-05-11T10:00:00.000Z"),
              tenantProfileId: "tenant_profile_1",
            },
          ],
        },
      ],
    });

    await expect(
      getOwnerPropertyContractById("property_1", "contract_1"),
    ).resolves.toMatchObject({
      id: "contract_1",
      payments: [
        {
          id: "payment_1",
          declarations: [
            {
              id: "payment_declaration_latest",
              declarationType: "NOT_PAID_YET",
            },
          ],
        },
      ],
    });

    expect(mocks.rentalContractFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "contract_1",
          propertyId: "property_1",
          ownerProfileId: "owner_profile_1",
        },
        select: expect.objectContaining({
          payments: expect.objectContaining({
            select: expect.objectContaining({
              declarations: {
                orderBy: [
                  {
                    declaredAt: "desc",
                  },
                  {
                    createdAt: "desc",
                  },
                ],
                take: 1,
                select: {
                  id: true,
                  declarationType: true,
                  declaredAt: true,
                  tenantProfileId: true,
                  tenantProfile: {
                    select: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          email: true,
                        },
                      },
                    },
                  },
                },
              },
            }),
          }),
        }),
      }),
    );
  });

  it("does not query contracts when the property does not belong to the owner", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);

    await expect(
      listOwnerPropertyContracts("property_2"),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    expect(mocks.rentalContractFindMany).not.toHaveBeenCalled();
  });

  it("does not allow ADMIN to act as an owner in this scope", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "This role cannot access this resource.",
    );
    mocks.getCurrentOwnerProfileForProperties.mockRejectedValue(error);

    await expect(listOwnerPropertyContracts("property_1")).rejects.toBe(error);

    expect(mocks.propertyFindFirst).not.toHaveBeenCalled();
    expect(mocks.rentalContractFindMany).not.toHaveBeenCalled();
  });
});
