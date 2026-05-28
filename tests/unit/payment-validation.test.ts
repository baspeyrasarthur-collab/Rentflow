import { describe, expect, it } from "vitest";

import {
  ownerCentralExpectedRentPaymentCreateSchema,
  ownerExpectedRentPaymentCreateSchema,
  tenantExternalPaymentDeclarationSchema,
  tenantMockPaymentActionSchema,
} from "@/server/validation";

describe("payment validation schemas", () => {
  it("accepts a valid expected rent payment payload", () => {
    const parsed = ownerExpectedRentPaymentCreateSchema.parse({
      contractTenantId: "contract_tenant_1",
      dueDate: "2026-06-05",
      amountInCents: 107000,
      currency: "eur",
    });

    expect(parsed.contractTenantId).toBe("contract_tenant_1");
    expect(parsed.dueDate).toBeInstanceOf(Date);
    expect(parsed.amountInCents).toBe(107000);
    expect(parsed.currency).toBe("EUR");
  });

  it("defaults expected rent payment currency to EUR", () => {
    const parsed = ownerExpectedRentPaymentCreateSchema.parse({
      contractTenantId: "contract_tenant_1",
      dueDate: "2026-06-05",
    });

    expect(parsed.currency).toBe("EUR");
    expect(parsed.amountInCents).toBeUndefined();
  });

  it("rejects negative or non-integer payment amounts", () => {
    expect(() =>
      ownerExpectedRentPaymentCreateSchema.parse({
        contractTenantId: "contract_tenant_1",
        dueDate: "2026-06-05",
        amountInCents: -1,
      }),
    ).toThrow();

    expect(() =>
      ownerExpectedRentPaymentCreateSchema.parse({
        contractTenantId: "contract_tenant_1",
        dueDate: "2026-06-05",
        amountInCents: 10.5,
      }),
    ).toThrow();
  });

  it("rejects server-owned payment fields in expected payment payloads", () => {
    for (const field of [
      "provider",
      "providerPaymentId",
      "status",
      "type",
      "tenantProfileId",
      "ownerProfileId",
      "propertyId",
      "rentalContractId",
    ]) {
      expect(() =>
        ownerExpectedRentPaymentCreateSchema.parse({
          contractTenantId: "contract_tenant_1",
          dueDate: "2026-06-05",
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });

  it("accepts a valid centralized expected rent payment payload", () => {
    const parsed = ownerCentralExpectedRentPaymentCreateSchema.parse({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      amountInEuros: "1070,50",
      dueDate: "2026-06-05",
    });

    expect(parsed).toMatchObject({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      amountInCents: 107050,
      dueDate: expect.any(Date),
    });
  });

  it("rejects server-owned payment fields in centralized payment payloads", () => {
    for (const field of [
      "provider",
      "providerPaymentId",
      "status",
      "type",
      "tenantProfileId",
      "ownerProfileId",
      "currency",
      "paidAt",
    ]) {
      expect(() =>
        ownerCentralExpectedRentPaymentCreateSchema.parse({
          propertyId: "property_1",
          rentalContractId: "contract_1",
          contractTenantId: "contract_tenant_1",
          amountInEuros: "1070",
          dueDate: "2026-06-05",
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });

  it("accepts a tenant mock payment action payload", () => {
    expect(
      tenantMockPaymentActionSchema.parse({ paymentId: "payment_1" }),
    ).toEqual({ paymentId: "payment_1" });
  });

  it("rejects extra fields in tenant mock payment action payloads", () => {
    expect(() =>
      tenantMockPaymentActionSchema.parse({
        paymentId: "payment_1",
        provider: "MOCK",
      }),
    ).toThrow();
  });

  it("accepts a tenant external payment declaration payload", () => {
    expect(
      tenantExternalPaymentDeclarationSchema.parse({
        paymentId: "payment_1",
        declarationType: "PAID_EXTERNALLY",
      }),
    ).toEqual({
      paymentId: "payment_1",
      declarationType: "PAID_EXTERNALLY",
    });

    expect(
      tenantExternalPaymentDeclarationSchema.parse({
        paymentId: "payment_1",
        declarationType: "NOT_PAID_YET",
      }),
    ).toEqual({
      paymentId: "payment_1",
      declarationType: "NOT_PAID_YET",
    });
  });

  it("rejects unknown tenant external payment declaration types", () => {
    expect(() =>
      tenantExternalPaymentDeclarationSchema.parse({
        paymentId: "payment_1",
        declarationType: "OTHER",
      }),
    ).toThrow();
  });

  it("rejects extra fields in tenant external payment declarations", () => {
    expect(() =>
      tenantExternalPaymentDeclarationSchema.parse({
        paymentId: "payment_1",
        declarationType: "PAID_EXTERNALLY",
        message: "paid",
      }),
    ).toThrow();
  });
});
