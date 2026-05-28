import { beforeEach, describe, expect, it, vi } from "vitest";

import { createOwnerCentralExpectedRentPaymentAction } from "@/app/(owner)/owner/payments/actions";
import { AppError } from "@/server/errors";

const mocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  getOwnerContractTenantForCentralExpectedPayment: vi.fn(),
  getOwnerExternalPaymentForReceipt: vi.fn(),
  paymentCreate: vi.fn(),
  platformCommissionCreate: vi.fn(),
  redirect: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/owner/payments", () => ({
  getOwnerContractTenantForCentralExpectedPayment:
    mocks.getOwnerContractTenantForCentralExpectedPayment,
  getOwnerExternalPaymentForReceipt: mocks.getOwnerExternalPaymentForReceipt,
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

function createValidCentralPaymentFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property_1");
  formData.set("rentalContractId", "contract_1");
  formData.set("contractTenantId", "contract_tenant_1");
  formData.set("amountInEuros", "1070,50");
  formData.set("dueDate", "2026-06-05");

  return formData;
}

describe("owner centralized expected rent payment action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOwnerContractTenantForCentralExpectedPayment.mockResolvedValue({
      user: {
        id: "user_owner",
      },
      ownerProfile: {
        id: "owner_profile_1",
      },
      contractTenant: {
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
      },
    });
    mocks.paymentCreate.mockResolvedValue({
      id: "payment_1",
    });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        auditLog: {
          create: mocks.auditLogCreate,
        },
        payment: {
          create: mocks.paymentCreate,
        },
        platformCommission: {
          create: mocks.platformCommissionCreate,
        },
      }),
    );
    mocks.redirect.mockImplementation((url: string) => {
      throw Object.assign(new Error("NEXT_REDIRECT"), { url });
    });
  });

  it("creates an external planned rent payment from the centralized form", async () => {
    await expect(
      createOwnerCentralExpectedRentPaymentAction(
        createValidCentralPaymentFormData(),
      ),
    ).rejects.toMatchObject({
      message: "NEXT_REDIRECT",
      url: "/owner/payments",
    });

    expect(
      mocks.getOwnerContractTenantForCentralExpectedPayment,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
        amountInCents: 107050,
        dueDate: expect.any(Date),
      }),
    );
    expect(mocks.paymentCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: "property_1",
        rentalContractId: "contract_1",
        contractTenantId: "contract_tenant_1",
        tenantProfileId: "tenant_profile_1",
        ownerProfileId: "owner_profile_1",
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: "PLANNED",
        amountInCents: 107050,
        currency: "EUR",
        dueDate: expect.any(Date),
      }),
    });
    expect(mocks.platformCommissionCreate).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user_owner",
        action: "payment.expected_created",
        entityType: "Payment",
        entityId: "payment_1",
        metadata: expect.objectContaining({
          source: "owner_central_create_expected_rent_payment",
          propertyId: "property_1",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
        }),
      }),
    });
  });

  it("rejects client-controlled server payment fields", async () => {
    const formData = createValidCentralPaymentFormData();

    formData.set("status", "SUCCEEDED");
    formData.set("provider", "MOCK");
    formData.set("type", "DEPOSIT");
    formData.set("ownerProfileId", "owner_profile_from_client");

    await expect(
      createOwnerCentralExpectedRentPaymentAction(formData),
    ).rejects.toThrow();

    expect(
      mocks.getOwnerContractTenantForCentralExpectedPayment,
    ).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid amounts before creating a payment", async () => {
    const formData = createValidCentralPaymentFormData();
    formData.set("amountInEuros", "-1");

    await expect(
      createOwnerCentralExpectedRentPaymentAction(formData),
    ).rejects.toThrow();

    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not create a payment when the owner scope helper rejects the request", async () => {
    const error = new AppError(
      "NOT_FOUND",
      "No active tenant attachment exists for this owner contract.",
    );
    mocks.getOwnerContractTenantForCentralExpectedPayment.mockRejectedValue(
      error,
    );

    await expect(
      createOwnerCentralExpectedRentPaymentAction(
        createValidCentralPaymentFormData(),
      ),
    ).rejects.toBe(error);

    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
