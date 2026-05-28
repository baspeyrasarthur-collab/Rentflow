import { describe, expect, it } from "vitest";

import { parseOwnerRecurringExpenseRuleCreateFormData } from "@/server/owner/recurring-expense-form";

function createValidRecurringExpenseRuleFormData() {
  const formData = new FormData();

  formData.set("propertyId", "property_1");
  formData.set("label", "Assurance PNO");
  formData.set("amountInEuros", "42.75");
  formData.set("category", "INSURANCE");
  formData.set("dayOfMonth", "15");
  formData.set("startMonth", "2026-05");
  formData.set("endMonth", "2026-12");

  return formData;
}

describe("owner recurring expense rule form parsing", () => {
  it("parses a valid owner recurring expense rule form", () => {
    const parsed = parseOwnerRecurringExpenseRuleCreateFormData(
      createValidRecurringExpenseRuleFormData(),
    );

    expect(parsed).toEqual({
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInCents: 4275,
      category: "INSURANCE",
      dayOfMonth: 15,
      startMonth: new Date(2026, 4, 1),
      endMonth: new Date(2026, 11, 1),
    });
  });

  it("allows an empty optional end month", () => {
    const formData = createValidRecurringExpenseRuleFormData();
    formData.set("endMonth", "");

    const parsed = parseOwnerRecurringExpenseRuleCreateFormData(formData);

    expect(parsed.endMonth).toBeUndefined();
  });

  it("does not read server-owned fields from form data", () => {
    const formData = createValidRecurringExpenseRuleFormData();

    formData.set("createdByUserId", "user_from_client");
    formData.set("status", "DISABLED");
    formData.set("amountInCents", "1");
    formData.set("currency", "USD");

    const parsed = parseOwnerRecurringExpenseRuleCreateFormData(formData);

    expect(parsed).toEqual({
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInCents: 4275,
      category: "INSURANCE",
      dayOfMonth: 15,
      startMonth: new Date(2026, 4, 1),
      endMonth: new Date(2026, 11, 1),
    });
  });

  it("rejects invalid day of month and month ordering", () => {
    const invalidDay = createValidRecurringExpenseRuleFormData();
    invalidDay.set("dayOfMonth", "32");

    expect(() =>
      parseOwnerRecurringExpenseRuleCreateFormData(invalidDay),
    ).toThrow();

    const invalidEndMonth = createValidRecurringExpenseRuleFormData();
    invalidEndMonth.set("endMonth", "2026-04");

    expect(() =>
      parseOwnerRecurringExpenseRuleCreateFormData(invalidEndMonth),
    ).toThrow();
  });
});
