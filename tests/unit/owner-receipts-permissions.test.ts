import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";
import {
  canGenerateRequestedRentReceipt,
  getOwnerPaymentForReceiptGeneration,
  getOwnerRequestedReceiptForGeneration,
} from "@/server/owner/receipts";

const mocks = vi.hoisted(() => ({
  getCurrentOwnerProfileForProperties: vi.fn(),
  paymentFindFirst: vi.fn(),
  receiptFindFirst: vi.fn(),
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties:
    mocks.getCurrentOwnerProfileForProperties,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    payment: {
      findFirst: mocks.paymentFindFirst,
    },
    receipt: {
      findFirst: mocks.receiptFindFirst,
    },
  },
}));

function createRequestedReceipt() {
  return {
    id: "receipt_1",
    propertyId: "property_1",
    rentalContractId: "contract_1",
    contractTenantId: "contract_tenant_1",
    tenantProfileId: "tenant_profile_1",
    ownerProfileId: "owner_profile_1",
    periodStart: new Date("2026-05-01T00:00:00.000Z"),
    periodEnd: new Date("2026-05-31T00:00:00.000Z"),
    rentAmountInCents: 95000,
    chargesAmountInCents: 12000,
    totalAmountInCents: 107000,
    currency: "EUR",
    status: "REQUESTED",
    type: "RENT_RECEIPT",
  };
}

describe("owner receipt permissions", () => {
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

  it("loads a payment with the connected owner profile filter", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "payment_1",
      ownerProfileId: "owner_profile_1",
      contractTenantId: "contract_tenant_1",
      contractTenant: {
        id: "contract_tenant_1",
      },
    });

    await expect(
      getOwnerPaymentForReceiptGeneration("payment_1"),
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

  it("rejects payments without tenant attachment data", async () => {
    mocks.paymentFindFirst.mockResolvedValue({
      id: "payment_1",
      ownerProfileId: "owner_profile_1",
      contractTenantId: null,
      contractTenant: null,
    });

    await expect(
      getOwnerPaymentForReceiptGeneration("payment_1"),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("does not allow ADMIN to act as an owner for receipt generation", async () => {
    const error = new AppError(
      "FORBIDDEN",
      "This role cannot access this resource.",
    );
    mocks.getCurrentOwnerProfileForProperties.mockRejectedValue(error);

    await expect(getOwnerPaymentForReceiptGeneration("payment_1")).rejects.toBe(
      error,
    );

    expect(mocks.paymentFindFirst).not.toHaveBeenCalled();
  });

  it("allows only requested rent receipts to be generated from a request", () => {
    expect(
      canGenerateRequestedRentReceipt({
        type: "RENT_RECEIPT",
        status: "REQUESTED",
      }),
    ).toBe(true);

    for (const status of ["GENERATED", "SENT", "CANCELED"] as const) {
      expect(
        canGenerateRequestedRentReceipt({
          type: "RENT_RECEIPT",
          status,
        }),
      ).toBe(false);
    }

    expect(
      canGenerateRequestedRentReceipt({
        type: "RECEIPT",
        status: "REQUESTED",
      }),
    ).toBe(false);
  });

  it("loads a requested receipt with the connected owner profile filter", async () => {
    mocks.receiptFindFirst.mockResolvedValue(createRequestedReceipt());

    await expect(
      getOwnerRequestedReceiptForGeneration("receipt_1"),
    ).resolves.toMatchObject({
      receipt: {
        id: "receipt_1",
        ownerProfileId: "owner_profile_1",
        status: "REQUESTED",
      },
    });

    expect(mocks.receiptFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "receipt_1",
          ownerProfileId: "owner_profile_1",
        },
      }),
    );
  });

  it("rejects non-requested receipt statuses for owner generation", async () => {
    for (const status of ["GENERATED", "SENT", "CANCELED"] as const) {
      mocks.receiptFindFirst.mockResolvedValue({
        ...createRequestedReceipt(),
        status,
      });

      await expect(
        getOwnerRequestedReceiptForGeneration("receipt_1"),
      ).rejects.toMatchObject({
        code: "CONFLICT",
      });
    }
  });
});
