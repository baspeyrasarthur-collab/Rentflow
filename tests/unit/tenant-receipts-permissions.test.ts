import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireTenantAccess: vi.fn(),
  paymentFindFirst: vi.fn(),
}));

vi.mock("@/server/auth/access", () => ({
  requireTenantAccess: mocks.requireTenantAccess,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    payment: {
      findFirst: mocks.paymentFindFirst,
    },
  },
}));

import { getTenantPaymentForReceiptRequest } from "@/server/tenant/receipts";

function createTenantReceiptPayment() {
  return {
    id: "payment_1",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
    ownerProfileId: "owner_profile_1",
    type: "RENT",
    status: "SUCCEEDED",
    amountInCents: 107000,
    currency: "EUR",
    dueDate: new Date("2026-06-05T00:00:00.000Z"),
    contractTenant: {
      id: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 12000,
      currency: "EUR",
    },
  };
}

describe("tenant receipt request permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireTenantAccess.mockResolvedValue({
      user: {
        id: "user_tenant",
        role: "OWNER",
      },
      tenantProfile: {
        id: "tenant_profile_1",
        userId: "user_tenant",
      },
    });
  });

  it("loads a payment with the connected tenant profile filter", async () => {
    mocks.paymentFindFirst.mockResolvedValue(createTenantReceiptPayment());

    await expect(
      getTenantPaymentForReceiptRequest("payment_1"),
    ).resolves.toMatchObject({
      payment: {
        id: "payment_1",
        tenantProfileId: "tenant_profile_1",
      },
    });

    expect(mocks.requireTenantAccess).toHaveBeenCalledTimes(1);
    expect(mocks.paymentFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "payment_1",
          tenantProfileId: "tenant_profile_1",
        },
      }),
    );
  });

  it("rejects payments without tenant attachment data", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createTenantReceiptPayment(),
      contractTenantId: null,
      contractTenant: null,
    });

    await expect(
      getTenantPaymentForReceiptRequest("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects payments attached to another tenant profile", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      ...createTenantReceiptPayment(),
      contractTenant: {
        ...createTenantReceiptPayment().contractTenant,
        tenantProfileId: "tenant_profile_2",
      },
    });

    await expect(
      getTenantPaymentForReceiptRequest("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("rejects when the connected user has no tenant profile", async () => {
    mocks.requireTenantAccess.mockRejectedValue(
      Object.assign(
        new Error("A tenant profile is required to access tenant space."),
        {
          code: "FORBIDDEN",
        },
      ),
    );

    await expect(
      getTenantPaymentForReceiptRequest("payment_1"),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
  });
});
