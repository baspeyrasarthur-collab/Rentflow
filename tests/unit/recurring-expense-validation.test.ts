import { describe, expect, it } from "vitest";

import {
  ownerRecurringExpenseRuleCreateSchema,
  recurringExpenseRuleIdSchema,
  recurringExpenseRuleMonthSchema,
} from "@/server/validation";

describe("recurring expense rule validation schema", () => {
  it("validates recurring expense rule ids", () => {
    expect(recurringExpenseRuleIdSchema.parse("rule_1")).toBe("rule_1");

    for (const recurringExpenseRuleId of ["", " ".repeat(2), "a".repeat(192)]) {
      expect(() =>
        recurringExpenseRuleIdSchema.parse(recurringExpenseRuleId),
      ).toThrow();
    }
  });

  it("validates and normalizes generation months without fallback", () => {
    expect(recurringExpenseRuleMonthSchema.parse("2026-05")).toEqual(
      new Date(2026, 4, 1),
    );

    for (const month of ["", "2026-13", "invalid", "2026-05-10"]) {
      expect(() => recurringExpenseRuleMonthSchema.parse(month)).toThrow();
    }
  });

  it("accepts a valid owner recurring expense rule payload and converts euros to cents", () => {
    const parsed = ownerRecurringExpenseRuleCreateSchema.parse({
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInEuros: "42.75",
      category: "INSURANCE",
      dayOfMonth: "15",
      startMonth: "2026-05",
      endMonth: "2026-12",
    });

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

  it("defaults missing category to OTHER and accepts no end month", () => {
    const parsed = ownerRecurringExpenseRuleCreateSchema.parse({
      propertyId: "property_1",
      label: "Frais divers",
      amountInEuros: "50",
      dayOfMonth: "1",
      startMonth: "2026-05",
    });

    expect(parsed.category).toBe("OTHER");
    expect(parsed.endMonth).toBeUndefined();
  });

  it("rejects invalid recurring expense categories", () => {
    expect(() =>
      ownerRecurringExpenseRuleCreateSchema.parse({
        propertyId: "property_1",
        label: "Frais RentFlow",
        amountInEuros: "50",
        category: "RENTFLOW_FEES",
        dayOfMonth: "1",
        startMonth: "2026-05",
      }),
    ).toThrow();
  });

  it("rejects invalid day of month values", () => {
    for (const dayOfMonth of ["0", "32", "1.5", "abc"]) {
      expect(() =>
        ownerRecurringExpenseRuleCreateSchema.parse({
          propertyId: "property_1",
          label: "Assurance",
          amountInEuros: "50",
          category: "INSURANCE",
          dayOfMonth,
          startMonth: "2026-05",
        }),
      ).toThrow();
    }
  });

  it("rejects end month before start month", () => {
    expect(() =>
      ownerRecurringExpenseRuleCreateSchema.parse({
        propertyId: "property_1",
        label: "Assurance",
        amountInEuros: "50",
        category: "INSURANCE",
        dayOfMonth: "10",
        startMonth: "2026-05",
        endMonth: "2026-04",
      }),
    ).toThrow();
  });

  it("rejects server-owned fields", () => {
    for (const field of [
      "createdByUserId",
      "status",
      "amountInCents",
      "currency",
    ]) {
      expect(() =>
        ownerRecurringExpenseRuleCreateSchema.parse({
          propertyId: "property_1",
          label: "Assurance",
          amountInEuros: "50",
          category: "INSURANCE",
          dayOfMonth: "10",
          startMonth: "2026-05",
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });
});
