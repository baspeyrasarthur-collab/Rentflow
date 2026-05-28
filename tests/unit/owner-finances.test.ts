import { describe, expect, it, vi } from "vitest";

import {
  buildOwnerFinanceSnapshot,
  getOwnerFinanceMonthRange,
  getOwnerFinancePeriodRange,
  parseOwnerFinanceMonthParam,
} from "@/server/owner/finances";

vi.mock("@/server/db/prisma", () => ({
  prisma: {},
}));

vi.mock("@/server/owner/properties", () => ({
  getCurrentOwnerProfileForProperties: vi.fn(),
}));

describe("owner finance snapshot", () => {
  it("parses a selected month and falls back to the current month", () => {
    const now = new Date(2026, 4, 15);

    expect(parseOwnerFinanceMonthParam("2026-02", now)).toEqual(
      new Date(2026, 1, 1),
    );
    expect(parseOwnerFinanceMonthParam(undefined, now)).toEqual(
      new Date(2026, 4, 1),
    );
    expect(parseOwnerFinanceMonthParam("2026-13", now)).toEqual(
      new Date(2026, 4, 1),
    );
    expect(parseOwnerFinanceMonthParam("invalid", now)).toEqual(
      new Date(2026, 4, 1),
    );
  });

  it("builds the selected month range", () => {
    expect(getOwnerFinanceMonthRange(new Date(2026, 1, 1))).toEqual({
      start: new Date(2026, 1, 1),
      end: new Date(2026, 2, 1),
    });
  });

  it("builds an inclusive multi-month period and safely falls back when invalid", () => {
    const now = new Date(2026, 4, 15);

    expect(
      getOwnerFinancePeriodRange(
        {
          startMonth: "2026-03",
          endMonth: "2026-05",
        },
        now,
      ),
    ).toEqual({
      start: new Date(2026, 2, 1),
      end: new Date(2026, 5, 1),
    });

    expect(
      getOwnerFinancePeriodRange(
        {
          month: "2026-02",
          startMonth: "invalid",
          endMonth: "2026-05",
        },
        now,
      ),
    ).toEqual({
      start: new Date(2026, 1, 1),
      end: new Date(2026, 2, 1),
    });
  });

  it("calculates current month rent, outflows and cash-flow in integer cents", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 4, 15),
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
        },
      ],
      rentPayments: [
        {
          id: "payment_expected",
          propertyId: "property_1",
          status: "PLANNED",
          amountInCents: 95000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 5),
          paidAt: null,
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "payment_collected",
          propertyId: "property_1",
          status: "SUCCEEDED",
          amountInCents: 103000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 7),
          paidAt: new Date(2026, 4, 8),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "payment_previous_month",
          propertyId: "property_1",
          status: "SUCCEEDED",
          amountInCents: 100000,
          currency: "EUR",
          dueDate: new Date(2026, 3, 5),
          paidAt: new Date(2026, 3, 6),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
      expenses: [
        {
          id: "expense_1",
          propertyId: "property_1",
          label: "Travaux plomberie",
          status: "PAID",
          category: "WORKS",
          amountInCents: 30000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 12),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
    });

    expect(snapshot.summary).toEqual({
      expectedRentInCents: 198000,
      collectedRentInCents: 103000,
      remainingRentInCents: 95000,
      outgoingAmountInCents: 30000,
      cashFlowInCents: 73000,
      otherExpensesInCents: 30000,
      recurringPlannedAmountInCents: 0,
    });
    expect(snapshot.outflows).toMatchObject({
      otherExpensesInCents: 30000,
      expenseCategories: [
        {
          category: "WORKS",
          label: "Travaux",
          amountInCents: 30000,
        },
      ],
    });
    expect(snapshot.properties[0]).toMatchObject({
      propertyId: "property_1",
      expectedRentInCents: 198000,
      collectedRentInCents: 103000,
      remainingRentInCents: 95000,
      outgoingAmountInCents: 30000,
      cashFlowInCents: 73000,
    });
  });

  it("groups expenses by category without mixing RentFlow fees", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 4, 15),
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
        },
      ],
      rentPayments: [],
      expenses: [
        {
          id: "expense_loan",
          propertyId: "property_1",
          label: "Mensualite banque",
          status: "PAID",
          category: "LOAN_REPAYMENT",
          amountInCents: 70000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 5),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "expense_insurance",
          propertyId: "property_1",
          label: "Assurance PNO",
          status: "PENDING",
          category: "INSURANCE",
          amountInCents: 1200,
          currency: "EUR",
          dueDate: new Date(2026, 4, 6),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "expense_insurance_2",
          propertyId: "property_1",
          label: "Assurance emprunteur",
          status: "PLANNED",
          category: "INSURANCE",
          amountInCents: 3000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 8),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "expense_canceled",
          propertyId: "property_1",
          label: "Depense annulee",
          status: "CANCELED",
          category: "WORKS",
          amountInCents: 999999,
          currency: "EUR",
          dueDate: new Date(2026, 4, 9),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
    });

    expect(snapshot.outflows.otherExpensesInCents).toBe(74200);
    expect(snapshot.outflows.expenseCategories).toEqual([
      {
        category: "LOAN_REPAYMENT",
        label: "Remboursement d'emprunt",
        amountInCents: 70000,
      },
      {
        category: "INSURANCE",
        label: "Assurance",
        amountInCents: 4200,
      },
    ]);
    expect(snapshot.summary.outgoingAmountInCents).toBe(74200);
    expect(
      snapshot.outflows.expenses.map((expense) => expense.id),
    ).not.toContain("expense_canceled");
  });

  it("calculates rent and outflows from the selected month", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 6, 15),
      selectedMonth: new Date(2026, 4, 1),
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
        },
      ],
      rentPayments: [
        {
          id: "payment_may_expected",
          propertyId: "property_1",
          status: "PLANNED",
          amountInCents: 90000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 5),
          paidAt: null,
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
        {
          id: "payment_july_collected",
          propertyId: "property_1",
          status: "SUCCEEDED",
          amountInCents: 120000,
          currency: "EUR",
          dueDate: new Date(2026, 6, 5),
          paidAt: new Date(2026, 6, 6),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
      expenses: [
        {
          id: "expense_may",
          propertyId: "property_1",
          label: "Assurance",
          status: "PAID",
          category: "INSURANCE",
          amountInCents: 1500,
          currency: "EUR",
          dueDate: new Date(2026, 4, 12),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
    });

    expect(snapshot.periodStart).toEqual(new Date(2026, 4, 1));
    expect(snapshot.periodEnd).toEqual(new Date(2026, 5, 1));
    expect(snapshot.summary).toMatchObject({
      expectedRentInCents: 90000,
      collectedRentInCents: 0,
      remainingRentInCents: 90000,
      outgoingAmountInCents: 1500,
      cashFlowInCents: -1500,
    });
    expect(snapshot.watchPayments).toHaveLength(1);
  });

  it("does not watch future selected month payments before they are due", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 4, 15),
      selectedMonth: new Date(2026, 6, 1),
      properties: [],
      rentPayments: [
        {
          id: "payment_future_month",
          propertyId: "property_1",
          status: "PLANNED",
          amountInCents: 85000,
          currency: "EUR",
          dueDate: new Date(2026, 6, 1),
          paidAt: null,
          property: {
            name: "Maison Nord",
            city: "Lille",
          },
        },
      ],
      expenses: [],
    });

    expect(snapshot.watchPayments).toEqual([]);
  });

  it("lists overdue non-collected rent payments to watch", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 4, 15),
      properties: [],
      rentPayments: [
        {
          id: "payment_failed",
          propertyId: "property_1",
          status: "FAILED",
          amountInCents: 85000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 1),
          paidAt: null,
          property: {
            name: "Maison Nord",
            city: "Lille",
          },
        },
        {
          id: "payment_future",
          propertyId: "property_1",
          status: "PLANNED",
          amountInCents: 85000,
          currency: "EUR",
          dueDate: new Date(2026, 4, 20),
          paidAt: null,
          property: {
            name: "Maison Nord",
            city: "Lille",
          },
        },
      ],
      expenses: [],
    });

    expect(snapshot.watchPayments).toEqual([
      {
        id: "payment_failed",
        propertyName: "Maison Nord",
        city: "Lille",
        dueDate: new Date(2026, 4, 1),
        amountInCents: 85000,
        currency: "EUR",
        status: "FAILED",
      },
    ]);
  });

  it("shows active recurring rules as planned outflows without duplicating generated occurrences", () => {
    const snapshot = buildOwnerFinanceSnapshot({
      now: new Date(2026, 4, 15),
      periodStart: new Date(2026, 4, 1),
      periodEnd: new Date(2026, 6, 1),
      properties: [
        {
          id: "property_1",
          name: "Appartement Canal",
          city: "Paris",
        },
      ],
      rentPayments: [],
      expenses: [
        {
          id: "expense_generated",
          propertyId: "property_1",
          recurringRuleId: "rule_1",
          occurrenceMonth: new Date(2026, 4, 1),
          label: "Assurance recurrente",
          status: "PENDING",
          category: "INSURANCE",
          amountInCents: 4200,
          currency: "EUR",
          dueDate: new Date(2026, 4, 5),
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
      recurringRules: [
        {
          id: "rule_1",
          propertyId: "property_1",
          label: "Assurance recurrente",
          amountInCents: 4200,
          currency: "EUR",
          category: "INSURANCE",
          dayOfMonth: 5,
          startMonth: new Date(2026, 4, 1),
          endMonth: null,
          property: {
            name: "Appartement Canal",
            city: "Paris",
          },
        },
      ],
    });

    expect(snapshot.outflows.otherExpensesInCents).toBe(4200);
    expect(snapshot.outflows.recurringPlannedAmountInCents).toBe(4200);
    expect(snapshot.summary.outgoingAmountInCents).toBe(8400);
    expect(snapshot.outflows.recurringPlanned).toEqual([
      expect.objectContaining({
        id: "rule_1-2026-06",
        label: "Assurance recurrente",
        amountInCents: 4200,
        dueDate: new Date(2026, 5, 5),
      }),
    ]);
  });
});
