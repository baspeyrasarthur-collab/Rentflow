import { describe, expect, it } from "vitest";

import {
  buildRentReceiptDataFromPayment,
  buildRequestedRentReceiptDataFromPayment,
  canGenerateRentReceiptFromPayment,
  canRequestRentReceiptFromPayment,
  getExpectedRentReceiptTotalInCents,
  getMonthlyReceiptPeriodFromDueDate,
  hasExistingRentReceiptForPeriod,
  isBlockingRentReceiptStatus,
  isFullRentPayment,
} from "@/server/receipts/receipt-data";

describe("receipt data helpers", () => {
  it("allows rent receipt generation only for succeeded rent payments", () => {
    expect(
      canGenerateRentReceiptFromPayment({
        type: "RENT",
        status: "SUCCEEDED",
      }),
    ).toBe(true);
  });

  it("rejects planned or failed rent payments", () => {
    expect(
      canGenerateRentReceiptFromPayment({
        type: "RENT",
        status: "PLANNED",
      }),
    ).toBe(false);
    expect(
      canGenerateRentReceiptFromPayment({
        type: "RENT",
        status: "FAILED",
      }),
    ).toBe(false);
  });

  it("rejects non-rent payment types", () => {
    for (const type of ["CHARGES", "DEPOSIT", "ONE_OFF_EXPENSE"] as const) {
      expect(
        canGenerateRentReceiptFromPayment({
          type,
          status: "SUCCEEDED",
        }),
      ).toBe(false);
    }
  });

  it("allows rent receipt requests only for succeeded rent payments", () => {
    expect(
      canRequestRentReceiptFromPayment({
        type: "RENT",
        status: "SUCCEEDED",
      }),
    ).toBe(true);
    expect(
      canRequestRentReceiptFromPayment({
        type: "RENT",
        status: "PLANNED",
      }),
    ).toBe(false);
    expect(
      canRequestRentReceiptFromPayment({
        type: "RENT",
        status: "FAILED",
      }),
    ).toBe(false);
    expect(
      canRequestRentReceiptFromPayment({
        type: "CHARGES",
        status: "SUCCEEDED",
      }),
    ).toBe(false);
    expect(
      canRequestRentReceiptFromPayment({
        type: "DEPOSIT",
        status: "SUCCEEDED",
      }),
    ).toBe(false);
  });

  it("calculates the expected rent receipt total in cents", () => {
    expect(getExpectedRentReceiptTotalInCents(95000, 12000)).toBe(107000);
  });

  it("accepts full rent payments that match or exceed rent plus charges", () => {
    expect(isFullRentPayment(107000, 95000, 12000)).toBe(true);
    expect(isFullRentPayment(110000, 95000, 12000)).toBe(true);
  });

  it("rejects partial rent payments", () => {
    expect(isFullRentPayment(106999, 95000, 12000)).toBe(false);
  });

  it("calculates the monthly receipt period from the payment due date", () => {
    const period = getMonthlyReceiptPeriodFromDueDate(
      new Date("2026-02-15T12:00:00.000Z"),
    );

    expect(period.periodStart).toEqual(new Date("2026-02-01T00:00:00.000Z"));
    expect(period.periodEnd).toEqual(new Date("2026-02-28T00:00:00.000Z"));
  });

  it("builds generated rent receipt data without paymentId or storage", () => {
    const requestedAt = new Date("2026-02-20T08:00:00.000Z");
    const generatedAt = new Date("2026-02-20T08:01:00.000Z");

    const receipt = buildRentReceiptDataFromPayment({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      dueDate: new Date("2026-02-15T12:00:00.000Z"),
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      currency: "EUR",
      requestedAt,
      generatedAt,
    });

    expect(receipt).toEqual({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      type: "RENT_RECEIPT",
      periodStart: new Date("2026-02-01T00:00:00.000Z"),
      periodEnd: new Date("2026-02-28T00:00:00.000Z"),
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      totalAmountInCents: 107000,
      currency: "EUR",
      status: "GENERATED",
      requestedAt,
      generatedAt,
      sentAt: null,
      storageKey: null,
    });
    expect(receipt).not.toHaveProperty("paymentId");
  });

  it("builds requested rent receipt data without PDF fields", () => {
    const requestedAt = new Date("2026-02-20T08:00:00.000Z");

    const receipt = buildRequestedRentReceiptDataFromPayment({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      dueDate: new Date("2026-02-15T12:00:00.000Z"),
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      currency: "EUR",
      requestedAt,
    });

    expect(receipt).toEqual({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      tenantProfileId: "tenant_profile_1",
      ownerProfileId: "owner_profile_1",
      type: "RENT_RECEIPT",
      periodStart: new Date("2026-02-01T00:00:00.000Z"),
      periodEnd: new Date("2026-02-28T00:00:00.000Z"),
      rentAmountInCents: 95000,
      chargesAmountInCents: 12000,
      totalAmountInCents: 107000,
      currency: "EUR",
      status: "REQUESTED",
      requestedAt,
      generatedAt: null,
      sentAt: null,
      storageKey: null,
    });
    expect(receipt).not.toHaveProperty("paymentId");
  });

  it("blocks duplicate rent receipt requests for active receipt statuses", () => {
    expect(isBlockingRentReceiptStatus("REQUESTED")).toBe(true);
    expect(isBlockingRentReceiptStatus("GENERATED")).toBe(true);
    expect(isBlockingRentReceiptStatus("SENT")).toBe(true);
    expect(isBlockingRentReceiptStatus("CANCELED")).toBe(false);
  });

  it("detects existing non-canceled rent receipts for the same logical period", () => {
    const periodStart = new Date("2026-02-01T00:00:00.000Z");
    const periodEnd = new Date("2026-02-28T00:00:00.000Z");

    expect(
      hasExistingRentReceiptForPeriod(
        [
          {
            type: "RENT_RECEIPT",
            status: "REQUESTED",
            tenantProfileId: "tenant_profile_2",
            rentalContractId: "contract_1",
            contractTenantId: "contract_tenant_1",
            periodStart,
            periodEnd,
          },
          {
            type: "RENT_RECEIPT",
            status: "GENERATED",
            tenantProfileId: "tenant_profile_1",
            rentalContractId: "contract_1",
            contractTenantId: "contract_tenant_1",
            periodStart,
            periodEnd,
          },
        ],
        {
          tenantProfileId: "tenant_profile_1",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
          periodStart,
          periodEnd,
        },
      ),
    ).toBe(true);
  });

  it("detects requested or sent rent receipts as duplicate blockers", () => {
    const periodStart = new Date("2026-02-01T00:00:00.000Z");
    const periodEnd = new Date("2026-02-28T00:00:00.000Z");
    const identity = {
      tenantProfileId: "tenant_profile_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      periodStart,
      periodEnd,
    };

    for (const status of ["REQUESTED", "SENT"] as const) {
      expect(
        hasExistingRentReceiptForPeriod(
          [
            {
              type: "RENT_RECEIPT",
              status,
              ...identity,
            },
          ],
          identity,
        ),
      ).toBe(true);
    }
  });

  it("ignores canceled rent receipts when detecting duplicates", () => {
    const periodStart = new Date("2026-02-01T00:00:00.000Z");
    const periodEnd = new Date("2026-02-28T00:00:00.000Z");

    expect(
      hasExistingRentReceiptForPeriod(
        [
          {
            type: "RENT_RECEIPT",
            status: "CANCELED",
            tenantProfileId: "tenant_profile_1",
            rentalContractId: "contract_1",
            contractTenantId: "contract_tenant_1",
            periodStart,
            periodEnd,
          },
        ],
        {
          tenantProfileId: "tenant_profile_1",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
          periodStart,
          periodEnd,
        },
      ),
    ).toBe(false);
  });
});
