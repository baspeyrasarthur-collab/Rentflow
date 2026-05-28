import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { buildRecurringExpenseOccurrenceDueDate } from "@/server/owner/recurring-expenses";

type RentPaymentStatus =
  | "PLANNED"
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
  | "DISPUTED";

type ExpenseStatus = "PLANNED" | "PENDING" | "PAID" | "CANCELED";
type ExpenseCategory =
  | "LOAN_REPAYMENT"
  | "INSURANCE"
  | "CONDO_FEES"
  | "PROPERTY_TAX"
  | "WORKS"
  | "OTHER";

export const OWNER_FINANCE_REMAINING_PAYMENT_STATUSES = [
  "PLANNED",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "DISPUTED",
] as const;

const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  LOAN_REPAYMENT: "Remboursement d'emprunt",
  INSURANCE: "Assurance",
  CONDO_FEES: "Charges de copropriete",
  PROPERTY_TAX: "Taxe fonciere",
  WORKS: "Travaux",
  OTHER: "Autre",
};
const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  "LOAN_REPAYMENT",
  "INSURANCE",
  "CONDO_FEES",
  "PROPERTY_TAX",
  "WORKS",
  "OTHER",
];

type FinanceProperty = {
  id: string;
  name: string;
  city: string;
};

type FinanceRentPayment = {
  id: string;
  propertyId: string;
  status: RentPaymentStatus;
  amountInCents: number;
  currency: string;
  dueDate: Date;
  paidAt: Date | null;
  property: {
    name: string;
    city: string;
  };
};

type FinanceExpense = {
  id: string;
  propertyId: string;
  recurringRuleId?: string | null;
  occurrenceMonth?: Date | null;
  label: string;
  status: ExpenseStatus;
  category: ExpenseCategory;
  amountInCents: number;
  currency: string;
  dueDate: Date;
  property: {
    name: string;
    city: string;
  };
};

type FinanceRecurringRule = {
  id: string;
  propertyId: string;
  label: string;
  amountInCents: number;
  currency: string;
  category: ExpenseCategory;
  dayOfMonth: number;
  startMonth: Date;
  endMonth: Date | null;
  property: {
    name: string;
    city: string;
  };
};

type OwnerFinanceSnapshotInput = {
  now?: Date;
  periodEnd?: Date;
  periodStart?: Date;
  properties: FinanceProperty[];
  rentPayments: FinanceRentPayment[];
  recurringRules?: FinanceRecurringRule[];
  selectedMonth?: Date;
  expenses: FinanceExpense[];
};

export type OwnerFinancePeriodParams = {
  endMonth?: string | null;
  month?: string | null;
  startMonth?: string | null;
};

export function getOwnerFinanceMonthRange(selectedMonth = new Date()) {
  const start = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1,
  );
  const end = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    1,
  );

  return { start, end };
}

function isValidOwnerFinanceMonthParam(
  month: string | null | undefined,
): month is string {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return false;
  }

  const [yearValue, monthValue] = month.split("-");
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;

  return (
    Number.isInteger(year) &&
    Number.isInteger(monthIndex) &&
    year >= 1000 &&
    monthIndex >= 0 &&
    monthIndex <= 11
  );
}

export function parseOwnerFinanceMonthParam(
  month: string | null | undefined,
  now = new Date(),
) {
  if (!isValidOwnerFinanceMonthParam(month)) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [yearValue, monthValue] = month.split("-");

  return new Date(Number(yearValue), Number(monthValue) - 1, 1);
}

export function formatOwnerFinanceMonthParam(month: Date) {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export function addOwnerFinanceMonths(month: Date, monthOffset: number) {
  return new Date(month.getFullYear(), month.getMonth() + monthOffset, 1);
}

export function getOwnerFinancePeriodRange(
  params: OwnerFinancePeriodParams = {},
  now = new Date(),
) {
  const fallbackMonth = parseOwnerFinanceMonthParam(params.month, now);
  const hasPeriod = !!params.startMonth && !!params.endMonth;

  if (!hasPeriod) {
    return getOwnerFinanceMonthRange(fallbackMonth);
  }

  if (
    !isValidOwnerFinanceMonthParam(params.startMonth) ||
    !isValidOwnerFinanceMonthParam(params.endMonth)
  ) {
    return getOwnerFinanceMonthRange(fallbackMonth);
  }

  const start = parseOwnerFinanceMonthParam(params.startMonth, now);
  const endMonth = parseOwnerFinanceMonthParam(params.endMonth, now);

  if (start > endMonth) {
    return getOwnerFinanceMonthRange(fallbackMonth);
  }

  return {
    start,
    end: addOwnerFinanceMonths(endMonth, 1),
  };
}

function isWithinRange(date: Date | null, start: Date, end: Date) {
  return !!date && date >= start && date < end;
}

function isRemainingRentPaymentStatus(status: RentPaymentStatus) {
  return (
    OWNER_FINANCE_REMAINING_PAYMENT_STATUSES as readonly string[]
  ).includes(status);
}

function isSameMonth(first: Date | null | undefined, second: Date) {
  return (
    !!first &&
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth()
  );
}

function listMonthsInRange(start: Date, end: Date) {
  const months: Date[] = [];

  for (
    let month = new Date(start.getFullYear(), start.getMonth(), 1);
    month < end;
    month = addOwnerFinanceMonths(month, 1)
  ) {
    months.push(month);
  }

  return months;
}

function createEmptyPropertyFinance(property: FinanceProperty) {
  return {
    propertyId: property.id,
    propertyName: property.name,
    city: property.city,
    expectedRentInCents: 0,
    collectedRentInCents: 0,
    remainingRentInCents: 0,
    outgoingAmountInCents: 0,
    cashFlowInCents: 0,
  };
}

function createRecurringPlannedOutflows({
  expenses,
  periodEnd,
  periodStart,
  recurringRules,
}: {
  expenses: FinanceExpense[];
  periodEnd: Date;
  periodStart: Date;
  recurringRules: FinanceRecurringRule[];
}) {
  const months = listMonthsInRange(periodStart, periodEnd);

  return recurringRules.flatMap((rule) =>
    months.flatMap((occurrenceMonth) => {
      const isEligible =
        rule.startMonth <= occurrenceMonth &&
        (!rule.endMonth || rule.endMonth >= occurrenceMonth);
      const alreadyGenerated = expenses.some(
        (expense) =>
          expense.recurringRuleId === rule.id &&
          isSameMonth(expense.occurrenceMonth, occurrenceMonth),
      );

      if (!isEligible || alreadyGenerated) {
        return [];
      }

      return [
        {
          id: `${rule.id}-${formatOwnerFinanceMonthParam(occurrenceMonth)}`,
          ruleId: rule.id,
          propertyName: rule.property.name,
          city: rule.property.city,
          label: rule.label,
          category: rule.category,
          categoryLabel: EXPENSE_CATEGORY_LABELS[rule.category],
          amountInCents: rule.amountInCents,
          currency: rule.currency,
          dueDate: buildRecurringExpenseOccurrenceDueDate(
            occurrenceMonth,
            rule.dayOfMonth,
          ),
          occurrenceMonth,
        },
      ];
    }),
  );
}

export function buildOwnerFinanceSnapshot(input: OwnerFinanceSnapshotInput) {
  const now = input.now ?? new Date();
  const selectedMonth = input.selectedMonth ?? now;
  const monthRange = getOwnerFinanceMonthRange(selectedMonth);
  const start = input.periodStart ?? monthRange.start;
  const end = input.periodEnd ?? monthRange.end;
  const recurringRules = input.recurringRules ?? [];
  const propertyFinances = new Map(
    input.properties.map((property) => [
      property.id,
      createEmptyPropertyFinance(property),
    ]),
  );
  const ensurePropertyFinance = (property: FinanceProperty) => {
    const existing = propertyFinances.get(property.id);

    if (existing) {
      return existing;
    }

    const created = createEmptyPropertyFinance(property);
    propertyFinances.set(property.id, created);

    return created;
  };

  let expectedRentInCents = 0;
  let collectedRentInCents = 0;
  let remainingRentInCents = 0;
  let otherExpensesInCents = 0;
  const expenseCategoryTotals = new Map<ExpenseCategory, number>();

  const watchPayments = input.rentPayments
    .filter(
      (payment) =>
        isWithinRange(payment.dueDate, start, end) &&
        payment.dueDate < now &&
        isRemainingRentPaymentStatus(payment.status),
    )
    .map((payment) => ({
      id: payment.id,
      propertyName: payment.property.name,
      city: payment.property.city,
      dueDate: payment.dueDate,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      status: payment.status,
    }));

  for (const payment of input.rentPayments) {
    const propertyFinance = ensurePropertyFinance({
      id: payment.propertyId,
      name: payment.property.name,
      city: payment.property.city,
    });

    if (isWithinRange(payment.dueDate, start, end)) {
      expectedRentInCents += payment.amountInCents;
      propertyFinance.expectedRentInCents += payment.amountInCents;

      if (isRemainingRentPaymentStatus(payment.status)) {
        remainingRentInCents += payment.amountInCents;
        propertyFinance.remainingRentInCents += payment.amountInCents;
      }
    }

    if (
      payment.status === "SUCCEEDED" &&
      isWithinRange(payment.paidAt, start, end)
    ) {
      collectedRentInCents += payment.amountInCents;
      propertyFinance.collectedRentInCents += payment.amountInCents;
    }
  }

  const expenses = input.expenses.flatMap((expense) => {
    if (expense.status === "CANCELED") {
      return [];
    }

    otherExpensesInCents += expense.amountInCents;
    expenseCategoryTotals.set(
      expense.category,
      (expenseCategoryTotals.get(expense.category) ?? 0) +
        expense.amountInCents,
    );

    const propertyFinance = ensurePropertyFinance({
      id: expense.propertyId,
      name: expense.property.name,
      city: expense.property.city,
    });
    propertyFinance.outgoingAmountInCents += expense.amountInCents;

    return [
      {
        id: expense.id,
        propertyName: expense.property.name,
        city: expense.property.city,
        label: expense.label,
        status: expense.status,
        category: expense.category,
        categoryLabel: EXPENSE_CATEGORY_LABELS[expense.category],
        amountInCents: expense.amountInCents,
        currency: expense.currency,
        dueDate: expense.dueDate,
      },
    ];
  });

  const recurringPlanned = createRecurringPlannedOutflows({
    expenses: input.expenses,
    periodEnd: end,
    periodStart: start,
    recurringRules,
  });
  const recurringPlannedAmountInCents = recurringPlanned.reduce(
    (total, recurring) => total + recurring.amountInCents,
    0,
  );

  for (const recurring of recurringPlanned) {
    const property = recurringRules.find(
      (rule) => rule.id === recurring.ruleId,
    );
    if (!property) {
      continue;
    }

    const propertyFinance = ensurePropertyFinance({
      id: property.propertyId,
      name: property.property.name,
      city: property.property.city,
    });
    propertyFinance.outgoingAmountInCents += recurring.amountInCents;
  }

  for (const propertyFinance of propertyFinances.values()) {
    propertyFinance.cashFlowInCents =
      propertyFinance.collectedRentInCents -
      propertyFinance.outgoingAmountInCents;
  }

  const outgoingAmountInCents =
    otherExpensesInCents + recurringPlannedAmountInCents;

  return {
    periodStart: start,
    periodEnd: end,
    summary: {
      expectedRentInCents,
      collectedRentInCents,
      remainingRentInCents,
      outgoingAmountInCents,
      cashFlowInCents: collectedRentInCents - outgoingAmountInCents,
      otherExpensesInCents,
      recurringPlannedAmountInCents,
    },
    properties: Array.from(propertyFinances.values()),
    watchPayments,
    outflows: {
      otherExpensesInCents,
      recurringPlannedAmountInCents,
      expenseCategories: EXPENSE_CATEGORY_ORDER.flatMap((category) => {
        const amountInCents = expenseCategoryTotals.get(category) ?? 0;

        if (amountInCents === 0) {
          return [];
        }

        return [
          {
            category,
            label: EXPENSE_CATEGORY_LABELS[category],
            amountInCents,
          },
        ];
      }),
      expenses,
      recurringPlanned,
    },
  };
}

export async function getOwnerFinancesData(
  params?: string | null | OwnerFinancePeriodParams,
) {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const now = new Date();
  const periodParams =
    typeof params === "string" || params === null || params === undefined
      ? { month: params }
      : params;
  const selectedMonth = parseOwnerFinanceMonthParam(periodParams.month, now);
  const { start, end } = getOwnerFinancePeriodRange(periodParams, now);

  const [properties, rentPayments, expenses, recurringRules] =
    await Promise.all([
      prisma.property.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          city: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
          type: "RENT",
          OR: [
            {
              dueDate: {
                gte: start,
                lt: end,
              },
            },
            {
              status: "SUCCEEDED",
              paidAt: {
                gte: start,
                lt: end,
              },
            },
          ],
        },
        select: {
          id: true,
          propertyId: true,
          status: true,
          amountInCents: true,
          currency: true,
          dueDate: true,
          paidAt: true,
          property: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      }),
      prisma.expense.findMany({
        where: {
          dueDate: {
            gte: start,
            lt: end,
          },
          status: {
            not: "CANCELED",
          },
          property: {
            ownerProfileId: ownerProfile.id,
          },
        },
        orderBy: {
          dueDate: "desc",
        },
        select: {
          id: true,
          propertyId: true,
          recurringRuleId: true,
          occurrenceMonth: true,
          label: true,
          status: true,
          category: true,
          amountInCents: true,
          currency: true,
          dueDate: true,
          property: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      }),
      prisma.recurringExpenseRule.findMany({
        where: {
          status: "ACTIVE",
          startMonth: {
            lt: end,
          },
          OR: [
            {
              endMonth: null,
            },
            {
              endMonth: {
                gte: start,
              },
            },
          ],
          property: {
            ownerProfileId: ownerProfile.id,
          },
        },
        select: {
          id: true,
          propertyId: true,
          label: true,
          amountInCents: true,
          currency: true,
          category: true,
          dayOfMonth: true,
          startMonth: true,
          endMonth: true,
          property: {
            select: {
              name: true,
              city: true,
            },
          },
        },
      }),
    ]);

  return {
    user,
    ownerProfile,
    ...buildOwnerFinanceSnapshot({
      now,
      periodEnd: end,
      periodStart: start,
      properties,
      rentPayments,
      recurringRules,
      selectedMonth,
      expenses,
    }),
  };
}
