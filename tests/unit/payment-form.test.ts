import { describe, expect, it } from "vitest";

import {
  parseOwnerCentralExpectedRentPaymentFormData,
  parseOwnerExpectedRentPaymentFormData,
} from "@/server/owner/payment-form";

function createValidPaymentFormData() {
  const formData = new FormData();

  formData.set("contractTenantId", "contract_tenant_1");
  formData.set("dueDate", "2026-06-05");
  formData.set("amountInCents", "107000");
  formData.set("currency", "eur");

  return formData;
}

describe("owner expected rent payment form parsing", () => {
  it("parses a valid expected rent payment form", () => {
    const parsed = parseOwnerExpectedRentPaymentFormData(
      createValidPaymentFormData(),
    );

    expect(parsed.contractTenantId).toBe("contract_tenant_1");
    expect(parsed.dueDate).toBeInstanceOf(Date);
    expect(parsed.amountInCents).toBe(107000);
    expect(parsed.currency).toBe("EUR");
  });

  it("allows an empty amount so the server can use rent plus charges", () => {
    const formData = createValidPaymentFormData();
    formData.set("amountInCents", "");

    const parsed = parseOwnerExpectedRentPaymentFormData(formData);

    expect(parsed.amountInCents).toBeUndefined();
  });

  it("does not read server-owned payment fields from form data", () => {
    const formData = createValidPaymentFormData();

    formData.set("ownerProfileId", "owner_profile_from_client");
    formData.set("tenantProfileId", "tenant_profile_from_client");
    formData.set("propertyId", "property_from_client");
    formData.set("rentalContractId", "contract_from_client");
    formData.set("provider", "MOCK");
    formData.set("providerPaymentId", "provider_payment_from_client");
    formData.set("type", "DEPOSIT");
    formData.set("status", "SUCCEEDED");
    formData.set("paidAt", "2026-06-05");

    const parsed = parseOwnerExpectedRentPaymentFormData(formData);

    expect(parsed).toEqual({
      contractTenantId: "contract_tenant_1",
      dueDate: expect.any(Date),
      amountInCents: 107000,
      currency: "EUR",
    });
  });

  it("rejects invalid amounts", () => {
    const negativeAmount = createValidPaymentFormData();
    negativeAmount.set("amountInCents", "-1");

    expect(() =>
      parseOwnerExpectedRentPaymentFormData(negativeAmount),
    ).toThrow();

    const decimalAmount = createValidPaymentFormData();
    decimalAmount.set("amountInCents", "10.5");

    expect(() =>
      parseOwnerExpectedRentPaymentFormData(decimalAmount),
    ).toThrow();
  });

  it("parses a centralized expected rent payment form in euros", () => {
    const formData = new FormData();

    formData.set("propertyId", "property_1");
    formData.set("rentalContractId", "contract_1");
    formData.set("contractTenantId", "contract_tenant_1");
    formData.set("amountInEuros", "1070,50");
    formData.set("dueDate", "2026-06-05");

    const parsed = parseOwnerCentralExpectedRentPaymentFormData(formData);

    expect(parsed).toMatchObject({
      propertyId: "property_1",
      rentalContractId: "contract_1",
      contractTenantId: "contract_tenant_1",
      amountInCents: 107050,
      dueDate: expect.any(Date),
    });
  });

  it("rejects server-owned fields in centralized payment form data", () => {
    const formData = new FormData();

    formData.set("propertyId", "property_1");
    formData.set("rentalContractId", "contract_1");
    formData.set("contractTenantId", "contract_tenant_1");
    formData.set("amountInEuros", "1070");
    formData.set("dueDate", "2026-06-05");
    formData.set("status", "SUCCEEDED");

    expect(() =>
      parseOwnerCentralExpectedRentPaymentFormData(formData),
    ).toThrow();
  });
});
