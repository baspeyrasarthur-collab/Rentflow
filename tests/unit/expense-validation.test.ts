import { describe, expect, it } from "vitest";

import {
  ownerExpenseCreateSchema,
  ownerExpenseUpdateSchema,
  parseEuroAmountToCents,
} from "@/server/validation";

describe("expense validation schemas", () => {
  it("accepts a valid owner expense payload and converts euros to cents", () => {
    const parsed = ownerExpenseCreateSchema.parse({
      propertyId: "property_1",
      label: "Taxe fonciere",
      amountInEuros: "1234.56",
      dueDate: "2026-05",
      status: "PAID",
      category: "PROPERTY_TAX",
    });

    expect(parsed).toEqual({
      propertyId: "property_1",
      label: "Taxe fonciere",
      amountInCents: 123456,
      dueDate: expect.any(Date),
      status: "PAID",
      category: "PROPERTY_TAX",
    });
  });

  it("defaults missing expense category to OTHER", () => {
    const parsed = ownerExpenseCreateSchema.parse({
      propertyId: "property_1",
      label: "Frais divers",
      amountInEuros: "50",
      dueDate: "2026-05",
      status: "PENDING",
    });

    expect(parsed.category).toBe("OTHER");
  });

  it("accepts a missing label and converts the selected month to the first day", () => {
    const parsed = ownerExpenseCreateSchema.parse({
      propertyId: "property_1",
      amountInEuros: "50",
      dueDate: "2026-05",
      category: "INSURANCE",
    });

    expect(parsed.label).toBeUndefined();
    expect(parsed.status).toBe("PENDING");
    expect(parsed.dueDate).toEqual(new Date(2026, 4, 1));
  });

  it("accepts expected euro amount formats and converts to cents", () => {
    for (const [amountInEuros, amountInCents] of [
      ["10", 1000],
      ["10.5", 1050],
      ["10.50", 1050],
      ["10,50", 1050],
      [" 10,50 ", 1050],
    ] as const) {
      const parsed = ownerExpenseCreateSchema.parse({
        propertyId: "property_1",
        label: "Assurance",
        amountInEuros,
        dueDate: "2026-05",
        status: "PENDING",
      });

      expect(parsed.amountInCents).toBe(amountInCents);
    }

    expect(parseEuroAmountToCents("10,50")).toBe(1050);
  });

  it("rejects invalid amounts", () => {
    for (const amountInEuros of ["", "0", "0.00", "-10", "abc", "10.999"]) {
      expect(() =>
        ownerExpenseCreateSchema.parse({
          propertyId: "property_1",
          label: "Assurance",
          amountInEuros,
          dueDate: "2026-05",
          status: "PENDING",
        }),
      ).toThrow();
    }
  });

  it("rejects invalid expense status", () => {
    expect(() =>
      ownerExpenseCreateSchema.parse({
        propertyId: "property_1",
        label: "Travaux",
        amountInEuros: "99.99",
        dueDate: "2026-05",
        status: "CANCELED",
      }),
    ).toThrow();
  });

  it("rejects invalid expense category", () => {
    expect(() =>
      ownerExpenseCreateSchema.parse({
        propertyId: "property_1",
        label: "Frais RentFlow",
        amountInEuros: "99.99",
        dueDate: "2026-05",
        status: "PENDING",
        category: "RENTFLOW_FEES",
      }),
    ).toThrow();
  });

  it("rejects server-owned expense fields", () => {
    for (const field of [
      "createdByUserId",
      "rentalContractId",
      "contractTenantId",
      "tenantProfileId",
      "amountInCents",
      "currency",
    ]) {
      expect(() =>
        ownerExpenseCreateSchema.parse({
          propertyId: "property_1",
          label: "Frais divers",
          amountInEuros: "50",
          dueDate: "2026-05",
          status: "PENDING",
          [field]: "client_value",
        }),
      ).toThrow();
    }
  });

  it("accepts a valid owner expense update payload", () => {
    const parsed = ownerExpenseUpdateSchema.parse({
      expenseId: "expense_1",
      propertyId: "property_1",
      label: "Assurance PNO",
      amountInEuros: "42.75",
      dueDate: "2026-05",
      status: "PENDING",
      category: "INSURANCE",
    });

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

  it("rejects invalid owner expense update category and amount", () => {
    expect(() =>
      ownerExpenseUpdateSchema.parse({
        expenseId: "expense_1",
        propertyId: "property_1",
        label: "Assurance PNO",
        amountInEuros: "-42",
        dueDate: "2026-05",
        status: "PENDING",
        category: "INSURANCE",
      }),
    ).toThrow();

    expect(() =>
      ownerExpenseUpdateSchema.parse({
        expenseId: "expense_1",
        propertyId: "property_1",
        label: "Assurance PNO",
        amountInEuros: "42",
        dueDate: "2026-05",
        status: "PENDING",
        category: "RENTFLOW_FEES",
      }),
    ).toThrow();
  });

  it("rejects server-owned fields on expense update payload", () => {
    expect(() =>
      ownerExpenseUpdateSchema.parse({
        expenseId: "expense_1",
        propertyId: "property_1",
        label: "Assurance PNO",
        amountInEuros: "42",
        dueDate: "2026-05",
        status: "PENDING",
        category: "INSURANCE",
        createdByUserId: "user_from_client",
      }),
    ).toThrow();
  });
});
