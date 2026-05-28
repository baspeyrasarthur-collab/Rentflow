import { describe, expect, it } from "vitest";

import {
  buildExternalPaymentReceivedData,
  buildExpectedRentPaymentData,
  buildMockPaymentFailedData,
  buildMockPaymentSucceededData,
  calculateRentWithChargesInCents,
  canMarkExternalPaymentAsReceived,
  canTenantPayWithMockProvider,
  isExternalPayment,
  isRentFlowManagedPayment,
  isActiveContractTenantForExpectedPayment,
  shouldCreatePlatformCommission,
} from "@/server/payments/payment-data";

describe("payment data helpers", () => {
  it("identifies external payments by null provider", () => {
    expect(isExternalPayment({ provider: null })).toBe(true);
    expect(isExternalPayment({ provider: "MOCK" })).toBe(false);
  });

  it("identifies RentFlow managed payments by provider", () => {
    expect(isRentFlowManagedPayment({ provider: "MOCK" })).toBe(true);
    expect(isRentFlowManagedPayment({ provider: null })).toBe(false);
  });

  it("creates platform commission only for successful RentFlow rent payments", () => {
    expect(
      shouldCreatePlatformCommission({
        provider: "MOCK",
        type: "RENT",
        status: "SUCCEEDED",
      }),
    ).toBe(true);
  });

  it("does not create platform commission for external payments", () => {
    expect(
      shouldCreatePlatformCommission({
        provider: null,
        type: "RENT",
        status: "SUCCEEDED",
      }),
    ).toBe(false);
  });

  it("does not create platform commission for failed payments", () => {
    expect(
      shouldCreatePlatformCommission({
        provider: "MOCK",
        type: "RENT",
        status: "FAILED",
      }),
    ).toBe(false);
  });

  it("does not create platform commission for non-rent payment types", () => {
    for (const type of ["CHARGES", "DEPOSIT", "ONE_OFF_EXPENSE"] as const) {
      expect(
        shouldCreatePlatformCommission({
          provider: "MOCK",
          type,
          status: "SUCCEEDED",
        }),
      ).toBe(false);
    }
  });

  it("calculates rent plus charges in integer cents", () => {
    expect(calculateRentWithChargesInCents(95000, 12000)).toBe(107000);
  });

  it("rejects negative or non-integer cents", () => {
    expect(() => calculateRentWithChargesInCents(-1, 12000)).toThrow();
    expect(() => calculateRentWithChargesInCents(95000, 12.5)).toThrow();
  });

  it("builds a planned external rent payment without provider or commission", () => {
    const dueDate = new Date("2026-06-05T00:00:00.000Z");
    const payment = buildExpectedRentPaymentData({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      currency: "EUR",
      dueDate,
    });

    expect(payment).toEqual({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      provider: null,
      providerPaymentId: null,
      type: "RENT",
      status: "PLANNED",
      amountInCents: 107000,
      currency: "EUR",
      dueDate,
    });
    expect(payment).not.toHaveProperty("platformCommission");
  });

  it("uses an explicit amount override when building an expected payment", () => {
    const payment = buildExpectedRentPaymentData({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      amountInCents: 100000,
      currency: "EUR",
      dueDate: new Date("2026-06-05T00:00:00.000Z"),
    });

    expect(payment.amountInCents).toBe(100000);
    expect(payment.provider).toBeNull();
    expect(payment.providerPaymentId).toBeNull();
    expect(payment.status).toBe("PLANNED");
    expect(payment.type).toBe("RENT");
  });

  it("allows expected payments only for active linked tenant attachments", () => {
    expect(
      isActiveContractTenantForExpectedPayment({
        status: "ACTIVE",
        tenantProfileId: "tenant_profile_1",
      }),
    ).toBe(true);
    expect(
      isActiveContractTenantForExpectedPayment({
        status: "INVITED",
        tenantProfileId: "tenant_profile_1",
      }),
    ).toBe(false);
    expect(
      isActiveContractTenantForExpectedPayment({
        status: "ACTIVE",
        tenantProfileId: null,
      }),
    ).toBe(false);
  });

  it("allows only planned or pending external payments to be marked as received", () => {
    expect(
      canMarkExternalPaymentAsReceived({
        provider: null,
        providerPaymentId: null,
        status: "PLANNED",
      }),
    ).toBe(true);
    expect(
      canMarkExternalPaymentAsReceived({
        provider: null,
        providerPaymentId: null,
        status: "PENDING",
      }),
    ).toBe(true);
  });

  it("rejects managed or already completed payments for external receipt marking", () => {
    expect(
      canMarkExternalPaymentAsReceived({
        provider: "MOCK",
        providerPaymentId: "mock_payment_1",
        status: "PLANNED",
      }),
    ).toBe(false);
    expect(
      canMarkExternalPaymentAsReceived({
        provider: null,
        providerPaymentId: null,
        status: "SUCCEEDED",
      }),
    ).toBe(false);
    expect(
      canMarkExternalPaymentAsReceived({
        provider: null,
        providerPaymentId: "provider_payment_1",
        status: "PLANNED",
      }),
    ).toBe(false);
  });

  it("builds external payment received update data without commission fields", () => {
    const paidAt = new Date("2026-06-07T10:00:00.000Z");

    expect(buildExternalPaymentReceivedData(paidAt)).toEqual({
      status: "SUCCEEDED",
      paidAt,
      failedAt: null,
      failureReason: null,
    });
    expect(buildExternalPaymentReceivedData(paidAt)).not.toHaveProperty(
      "platformCommission",
    );
  });

  it("allows tenant mock payment only for rent payments that are not completed", () => {
    expect(
      canTenantPayWithMockProvider({
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: "PLANNED",
      }),
    ).toBe(true);
    expect(
      canTenantPayWithMockProvider({
        provider: "MOCK",
        providerPaymentId: "mock_payment_1",
        type: "RENT",
        status: "PENDING",
      }),
    ).toBe(true);
    expect(
      canTenantPayWithMockProvider({
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: "SUCCEEDED",
      }),
    ).toBe(false);
  });

  it("rejects tenant mock payment for external provider ids or non-rent types", () => {
    expect(
      canTenantPayWithMockProvider({
        provider: null,
        providerPaymentId: "external_id",
        type: "RENT",
        status: "PLANNED",
      }),
    ).toBe(false);
    expect(
      canTenantPayWithMockProvider({
        provider: null,
        providerPaymentId: null,
        type: "CHARGES",
        status: "PLANNED",
      }),
    ).toBe(false);
  });

  it("builds mock payment success and failure update data", () => {
    const paidAt = new Date("2026-06-07T10:00:00.000Z");
    const failedAt = new Date("2026-06-07T11:00:00.000Z");

    expect(buildMockPaymentSucceededData("mock_payment_1", paidAt)).toEqual({
      provider: "MOCK",
      providerPaymentId: "mock_payment_1",
      status: "SUCCEEDED",
      paidAt,
      failedAt: null,
      failureReason: null,
    });

    expect(
      buildMockPaymentFailedData("mock_payment_1", failedAt, "Mock failure"),
    ).toEqual({
      provider: "MOCK",
      providerPaymentId: "mock_payment_1",
      status: "FAILED",
      paidAt: null,
      failedAt,
      failureReason: "Mock failure",
    });
  });
});
