import { describe, expect, it } from "vitest";

import {
  parseOwnerExpenseCreateFormData,
  parseOwnerExpenseUpdateFormData,
} from "@/server/owner/expense-form";

function createValidExpenseFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property_1");
  formData.set("label", "Assurance PNO");
  formData.set("amountInEuros", "42.75");
  formData.set("dueDate", "2026-05");
  formData.set("status", "PENDING");
  formData.set("category", "INSURANCE");

  return formData;
}

describe("owner expense form parsing", () => {
  it("parses a valid owner expense form", () => {
    const parsed = parseOwnerExpenseCreateFormData(
      createValidExpenseFormData(),
    );

    expect(parsed.propertyId).toBe("property_1");
    expect(parsed.label).toBe("Assurance PNO");
    expect(parsed.amountInCents).toBe(4275);
    expect(parsed.dueDate).toBeInstanceOf(Date);
    expect(parsed.status).toBe("PENDING");
    expect(parsed.category).toBe("INSURANCE");
  });

  it("defaults missing category to OTHER", () => {
    const formData = createValidExpenseFormData();
    formData.delete("category");

    const parsed = parseOwnerExpenseCreateFormData(formData);

    expect(parsed.category).toBe("OTHER");
  });

  it("treats a blank label as missing form data", () => {
    const formData = createValidExpenseFormData();
    formData.set("label", "   ");

    const parsed = parseOwnerExpenseCreateFormData(formData);

    expect(parsed.label).toBeUndefined();
  });

  it("does not read server-owned fields from form data", () => {
    const formData = createValidExpenseFormData();

    formData.set("createdByUserId", "user_from_client");
    formData.set("tenantProfileId", "tenant_from_client");
    formData.set("rentalContractId", "contract_from_client");
    formData.set("contractTenantId", "contract_tenant_from_client");
    formData.set("amountInCents", "1");
    formData.set("currency", "USD");

    const parsed = parseOwnerExpenseCreateFormData(formData);

    expect(parsed).toEqual({
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInCents: 4275,
      dueDate: expect.any(Date),
      status: "PENDING",
      category: "INSURANCE",
    });
  });

  it("rejects invalid amounts and status", () => {
    const invalidAmount = createValidExpenseFormData();
    invalidAmount.set("amountInEuros", "10.999");

    expect(() => parseOwnerExpenseCreateFormData(invalidAmount)).toThrow();

    const invalidStatus = createValidExpenseFormData();
    invalidStatus.set("status", "CANCELED");

    expect(() => parseOwnerExpenseCreateFormData(invalidStatus)).toThrow();

    const invalidCategory = createValidExpenseFormData();
    invalidCategory.set("category", "RENTFLOW_FEES");

    expect(() => parseOwnerExpenseCreateFormData(invalidCategory)).toThrow();
  });

  it("parses a valid owner expense update form", () => {
    const formData = createValidExpenseFormData();
    formData.set("expenseId", "expense_1");
    formData.set("label", "Assurance mise a jour");
    formData.set("category", "WORKS");

    const parsed = parseOwnerExpenseUpdateFormData(formData);

    expect(parsed).toMatchObject({
      expenseId: "expense_1",
      propertyId: "property_1",
      label: "Assurance mise a jour",
      amountInCents: 4275,
      status: "PENDING",
      category: "WORKS",
    });
  });

  it("does not read server-owned fields from expense update form data", () => {
    const formData = createValidExpenseFormData();
    formData.set("expenseId", "expense_1");
    formData.set("createdByUserId", "user_from_client");
    formData.set("tenantProfileId", "tenant_from_client");
    formData.set("rentalContractId", "contract_from_client");
    formData.set("contractTenantId", "contract_tenant_from_client");
    formData.set("amountInCents", "1");
    formData.set("currency", "USD");

    const parsed = parseOwnerExpenseUpdateFormData(formData);

    expect(parsed).toEqual({
      expenseId: "expense_1",
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInCents: 4275,
      dueDate: expect.any(Date),
      status: "PENDING",
      category: "INSURANCE",
    });
  });

  it("rejects invalid owner expense update values", () => {
    const invalidAmount = createValidExpenseFormData();
    invalidAmount.set("expenseId", "expense_1");
    invalidAmount.set("amountInEuros", "0");

    expect(() => parseOwnerExpenseUpdateFormData(invalidAmount)).toThrow();

    const invalidCategory = createValidExpenseFormData();
    invalidCategory.set("expenseId", "expense_1");
    invalidCategory.set("category", "RENTFLOW_FEES");

    expect(() => parseOwnerExpenseUpdateFormData(invalidCategory)).toThrow();
  });
});
