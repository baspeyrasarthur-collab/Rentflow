import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  getOwnerContractTenantForCentralExpectedPayment,
  getOwnerExternalPaymentForReceipt,
  getOwnerPaymentCreateOptions,
} from "@/server/owner/payments";

const mocks = vi.hoisted(() => ({
  getCurrentOwnerProfileForProperties: vi.fn(),
  contractTenantFindFirst: vi.fn(),
  contractTenantFindMany: vi.fn(),
  paymentFindFirst: vi.fn(),
  propertyFindMany: vi.fn(),
  rentalContractFindMany: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    contractTenant: {
      findFirst: mocks.contractTenantFindFirst,
      findMany: mocks.contractTenantFindMany,
    },
    payment: {
      findFirst: mocks.paymentFindFirst,
    },
    property: {
      findMany: mocks.propertyFindMany,
    },
    rentalContract: {
      findMany: mocks.rentalContractFindMany,
    },
  },
}));

describe("owner payment permissions", () => {
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
  });

  it("loads external payments with the connected owner profile filter", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "payment_1",
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      provider: null,
      providerPaymentId: null,
      status: "PLANNED",
    });

    await expect(
      getOwnerExternalPaymentForReceipt("payment_1"),
    ).resolves.toMatchObject({
      payment: {
        id: "payment_1",
        ownerProfileId: "owner_profile_1",
      },
    });

    expect(mocks.paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("rejects RentFlow managed payments", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "payment_1",
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      provider: "MOCK",
      providerPaymentId: "mock_payment_1",
      status: "PLANNED",
    });

    await expect(
      getOwnerExternalPaymentForReceipt("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects payments that are already received", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "payment_1",
      ownerProfileId: "owner_profile_1",
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      provider: null,
      providerPaymentId: null,
      status: "SUCCEEDED",
    });

    await expect(
      getOwnerExternalPaymentForReceipt("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("does not allow ADMIN to act as an owner for payment receipts", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "This role cannot access this resource.",
    );
    mocks.getCurrentOwnerProfileForProperties.mockRejectedValue(error);

    await expect(getOwnerExternalPaymentForReceipt("payment_1")).rejects.toBe(
      error,
    );

    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
  });

  it("loads centralized payment creation options with owner filters and excludes archived properties", async () => {
    mocks.propertyFindMany.mockResolvedValue([{ id: "property_1" }]);
    mocks.rentalContractFindMany.mockResolvedValue([{ id: "contract_1" }]);
    mocks.contractTenantFindMany.mockResolvedValue([
      { id: "contract_tenant_1" },
    ]);

    await expect(getOwnerPaymentCreateOptions()).resolves.toMatchObject({
      properties: [{ id: "property_1" }],
      contracts: [{ id: "contract_1" }],
      contractTenants: [{ id: "contract_tenant_1" }],
    });

    expect(mocks.propertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            not: "ARCHIVED",
          },
        },
      }),
    );
    expect(mocks.rentalContractFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          ownerProfileId: "owner_profile_1",
          status: {
            not: "ARCHIVED",
          },
        },
      }),
    );
    expect(mocks.contractTenantFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          tenantProfileId: {
            not: null,
          },
          rentalContract: expect.objectContaining({
            ownerProfileId: "owner_profile_1",
          }),
        }),
      }),
    );
  });

  it("loads a centralized payment tenant only when property, contract and tenant match the owner", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      rentalContractId: "contract_1",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      currency: "EUR",
      status: "ACTIVE",
      rentalContract: {
        id: "contract_1",
        propertyId: "property_1",
        ownerProfileId: "owner_profile_1",
        currency: "EUR",
        property: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      },
    });

    await expect(
      getOwnerContractTenantForCentralExpectedPayment({
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
      }),
    ).resolves.toMatchObject({
      ownerProfile: {
        id: "owner_profile_1",
      },
      contractTenant: {
        id: "contract_tenant_1",
        tenantProfileId: "tenant_profile_1",
      },
    });

    expect(mocks.contractTenantFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "contract_tenant_1",
          status: "ACTIVE",
          tenantProfileId: {
            not: null,
          },
          rentalContractId: "contract_1",
          rentalContract: expect.objectContaining({
            id: "contract_1",
            propertyId: "property_1",
            ownerProfileId: "owner_profile_1",
          }),
        }),
      }),
    );
  });

  it("rejects centralized payment creation when the tenant attachment is not active", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      rentalContractId: "contract_1",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      currency: "EUR",
      status: "INVITED",
      rentalContract: {
        id: "contract_1",
        propertyId: "property_1",
        ownerProfileId: "owner_profile_1",
        currency: "EUR",
        property: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      },
    });

    await expect(
      getOwnerContractTenantForCentralExpectedPayment({
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects centralized payment creation when the tenant profile is missing", async () => {
    mocks.contractTenantFindFirst.mockResolvedValue({
      id: "contract_tenant_1",
      tenantProfileId: null,
      rentalContractId: "contract_1",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      currency: "EUR",
      status: "ACTIVE",
      rentalContract: {
        id: "contract_1",
        propertyId: "property_1",
        ownerProfileId: "owner_profile_1",
        currency: "EUR",
        property: {
          id: "property_1",
          ownerProfileId: "owner_profile_1",
        },
      },
    });

    await expect(
      getOwnerContractTenantForCentralExpectedPayment({
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
