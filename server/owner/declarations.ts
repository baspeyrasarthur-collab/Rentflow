import { getMissingImportantPersonalInfo } from "@/server/account/personal-info";
import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

type DeclarationPaymentStatus =
  | "PLANNED"
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
  | "DISPUTED";

type DeclarationExpenseCategory =
  | "LOAN_REPAYMENT"
  | "INSURANCE"
  | "CONDO_FEES"
  | "PROPERTY_TAX"
  | "WORKS"
  | "OTHER";

type DeclarationExpenseStatus = "PLANNED" | "PENDING" | "PAID" | "CANCELED";

type DeclarationProperty = {
  id: string;
  name: string;
  city: string;
  furnished: boolean;
  status: string;
};

type DeclarationRentPayment = {
  id: string;
  propertyId: string;
  status: DeclarationPaymentStatus;
  amountInCents: number;
  paidAt: Date | null;
  dueDate: Date;
};

type DeclarationExpense = {
  id: string;
  propertyId: string;
  status: DeclarationExpenseStatus;
  category: DeclarationExpenseCategory;
  amountInCents: number;
  dueDate: Date;
};

type OwnerDeclarationsOverviewInput = {
  expenses: DeclarationExpense[];
  now?: Date;
  payments: DeclarationRentPayment[];
  properties: DeclarationProperty[];
  year?: number | null;
};

const EXPENSE_CATEGORY_LABELS: Record<DeclarationExpenseCategory, string> = {
  LOAN_REPAYMENT: "Remboursement d'emprunt",
  INSURANCE: "Assurance",
  CONDO_FEES: "Charges de copropriete",
  PROPERTY_TAX: "Taxe fonciere",
  WORKS: "Travaux",
  OTHER: "Autre",
};

const EXPENSE_CATEGORY_ORDER: DeclarationExpenseCategory[] = [
  "LOAN_REPAYMENT",
  "INSURANCE",
  "CONDO_FEES",
  "PROPERTY_TAX",
  "WORKS",
  "OTHER",
];

const NOT_CONFIRMED_RENT_STATUSES: DeclarationPaymentStatus[] = [
  "PLANNED",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "DISPUTED",
];

export function getDefaultOwnerDeclarationsYear(now = new Date()) {
  return now.getFullYear() - 1;
}

export function parseOwnerDeclarationsYearParam(
  year: number | string | null | undefined,
  now = new Date(),
) {
  const fallbackYear = getDefaultOwnerDeclarationsYear(now);
  const parsedYear =
    typeof year === "number"
      ? year
      : typeof year === "string" && /^\d{4}$/.test(year)
        ? Number(year)
        : Number.NaN;

  if (
    !Number.isInteger(parsedYear) ||
    parsedYear < 2000 ||
    parsedYear > now.getFullYear() + 1
  ) {
    return fallbackYear;
  }

  return parsedYear;
}

export function getOwnerDeclarationsYearRange(year: number) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year + 1, 0, 1),
  };
}

function isWithinYearRange(date: Date | null, start: Date, end: Date) {
  return !!date && date >= start && date < end;
}

function getFiscalStatusMessage(property: DeclarationProperty) {
  return property.furnished
    ? "Meuble dans RentFlow - fiscalite a confirmer"
    : "Non meuble dans RentFlow - fiscalite a confirmer";
}

export function buildOwnerDeclarationsOverview(
  input: OwnerDeclarationsOverviewInput,
) {
  const now = input.now ?? new Date();
  const selectedYear = parseOwnerDeclarationsYearParam(input.year, now);
  const { start, end } = getOwnerDeclarationsYearRange(selectedYear);
  const propertyTotals = new Map(
    input.properties.map((property) => [
      property.id,
      {
        propertyId: property.id,
        propertyName: property.name,
        city: property.city,
        furnished: property.furnished,
        status: property.status,
        incomeInCents: 0,
        expensesInCents: 0,
        paymentsIncludedCount: 0,
        fiscalStatusMessage: getFiscalStatusMessage(property),
      },
    ]),
  );
  const expenseCategoryTotals = new Map<DeclarationExpenseCategory, number>();

  let preparedRentalIncomeInCents = 0;
  let paymentsIncludedCount = 0;
  let paymentsNotConfirmedCount = 0;
  let expensesToReviewInCents = 0;

  for (const payment of input.payments) {
    const isIncludedIncome =
      payment.status === "SUCCEEDED" &&
      isWithinYearRange(payment.paidAt, start, end);
    const isNotConfirmed =
      NOT_CONFIRMED_RENT_STATUSES.includes(payment.status) &&
      isWithinYearRange(payment.dueDate, start, end);

    if (isIncludedIncome) {
      preparedRentalIncomeInCents += payment.amountInCents;
      paymentsIncludedCount += 1;
      const propertyTotal = propertyTotals.get(payment.propertyId);

      if (propertyTotal) {
        propertyTotal.incomeInCents += payment.amountInCents;
        propertyTotal.paymentsIncludedCount += 1;
      }
    }

    if (isNotConfirmed) {
      paymentsNotConfirmedCount += 1;
    }
  }

  for (const expense of input.expenses) {
    if (
      expense.status === "CANCELED" ||
      !isWithinYearRange(expense.dueDate, start, end)
    ) {
      continue;
    }

    expensesToReviewInCents += expense.amountInCents;
    expenseCategoryTotals.set(
      expense.category,
      (expenseCategoryTotals.get(expense.category) ?? 0) +
        expense.amountInCents,
    );

    const propertyTotal = propertyTotals.get(expense.propertyId);

    if (propertyTotal) {
      propertyTotal.expensesInCents += expense.amountInCents;
    }
  }

  const propertyBreakdown = Array.from(propertyTotals.values());

  return {
    selectedYear,
    periodStart: start,
    periodEnd: end,
    summary: {
      preparedRentalIncomeInCents,
      expensesToReviewInCents,
      propertiesCount: input.properties.length,
      propertiesWithIncome: propertyBreakdown.filter(
        (property) => property.incomeInCents > 0,
      ).length,
      paymentsIncludedCount,
      paymentsNotConfirmedCount,
    },
    propertyBreakdown,
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
    signals: {
      hasFurnishedProperties: input.properties.some(
        (property) => property.furnished,
      ),
      hasMultipleProperties: input.properties.length > 1,
      hasHighExpenseRatio:
        preparedRentalIncomeInCents > 0 &&
        expensesToReviewInCents > preparedRentalIncomeInCents * 0.3,
    },
  };
}

export async function getOwnerDeclarationsOverview(year?: number | null) {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const selectedYear = parseOwnerDeclarationsYearParam(year);
  const { start, end } = getOwnerDeclarationsYearRange(selectedYear);

  const [properties, payments, expenses] = await Promise.all([
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
        furnished: true,
        status: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        type: "RENT",
        OR: [
          {
            status: "SUCCEEDED",
            paidAt: {
              gte: start,
              lt: end,
            },
          },
          {
            dueDate: {
              gte: start,
              lt: end,
            },
            status: {
              in: NOT_CONFIRMED_RENT_STATUSES,
            },
          },
        ],
      },
      select: {
        id: true,
        propertyId: true,
        status: true,
        amountInCents: true,
        paidAt: true,
        dueDate: true,
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
      select: {
        id: true,
        propertyId: true,
        status: true,
        category: true,
        amountInCents: true,
        dueDate: true,
      },
    }),
  ]);

  return {
    user,
    ownerProfile,
    personalInfoMissingFields: getMissingImportantPersonalInfo(user),
    ...buildOwnerDeclarationsOverview({
      expenses,
      payments,
      properties,
      year: selectedYear,
    }),
  };
}
