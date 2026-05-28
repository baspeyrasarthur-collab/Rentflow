import { DEFAULT_CURRENCY } from "@/server/config/app";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import {
  propertyIdSchema,
  recurringExpenseRuleIdSchema,
  type OwnerRecurringExpenseRuleCreateInput,
} from "@/server/validation";

export function buildOwnerRecurringExpenseRuleCreateData(
  input: OwnerRecurringExpenseRuleCreateInput,
  propertyId: string,
  createdByUserId: string,
) {
  return {
    propertyId,
    createdByUserId,
    label: input.label,
    amountInCents: input.amountInCents,
    currency: DEFAULT_CURRENCY,
    category: input.category,
    dayOfMonth: input.dayOfMonth,
    startMonth: input.startMonth,
    endMonth: input.endMonth ?? null,
    status: "ACTIVE" as const,
  };
}

export function buildOwnerRecurringExpenseRuleDisableData() {
  return {
    status: "DISABLED" as const,
  };
}

export function normalizeRecurringExpenseOccurrenceMonth(month: Date) {
  return new Date(month.getFullYear(), month.getMonth(), 1);
}

export function formatRecurringExpenseOccurrenceMonthParam(month: Date) {
  const normalizedMonth = normalizeRecurringExpenseOccurrenceMonth(month);

  return `${normalizedMonth.getFullYear()}-${String(
    normalizedMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
}

export function buildRecurringExpenseOccurrenceDueDate(
  occurrenceMonth: Date,
  dayOfMonth: number,
) {
  const normalizedMonth =
    normalizeRecurringExpenseOccurrenceMonth(occurrenceMonth);
  const lastDayOfMonth = new Date(
    normalizedMonth.getFullYear(),
    normalizedMonth.getMonth() + 1,
    0,
  ).getDate();
  const occurrenceDay = Math.min(dayOfMonth, lastDayOfMonth);

  return new Date(
    normalizedMonth.getFullYear(),
    normalizedMonth.getMonth(),
    occurrenceDay,
  );
}

function buildOwnerRecurringExpenseOccurrenceCreateData({
  createdByUserId,
  occurrenceMonth,
  rule,
}: {
  createdByUserId: string;
  occurrenceMonth: Date;
  rule: {
    id: string;
    propertyId: string;
    label: string;
    amountInCents: number;
    currency: string;
    category:
      | "LOAN_REPAYMENT"
      | "INSURANCE"
      | "CONDO_FEES"
      | "PROPERTY_TAX"
      | "WORKS"
      | "OTHER";
    dayOfMonth: number;
  };
}) {
  return {
    propertyId: rule.propertyId,
    recurringRuleId: rule.id,
    occurrenceMonth,
    createdByUserId,
    label: rule.label,
    amountInCents: rule.amountInCents,
    currency: rule.currency,
    category: rule.category,
    dueDate: buildRecurringExpenseOccurrenceDueDate(
      occurrenceMonth,
      rule.dayOfMonth,
    ),
    status: "PLANNED" as const,
  };
}

export async function listOwnerPropertiesForRecurringExpenseRuleCreation() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findMany({
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
      status: true,
    },
  });
}

export async function listOwnerRecurringExpenseRules() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.recurringExpenseRule.findMany({
    where: {
      property: {
        ownerProfileId: ownerProfile.id,
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
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
      status: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          name: true,
          city: true,
        },
      },
    },
  });
}

export async function generateOwnerRecurringExpensesForMonth(month: Date) {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const occurrenceMonth = normalizeRecurringExpenseOccurrenceMonth(month);

  return prisma.$transaction(async (tx) => {
    const rules = await tx.recurringExpenseRule.findMany({
      where: {
        status: "ACTIVE",
        startMonth: {
          lte: occurrenceMonth,
        },
        OR: [
          {
            endMonth: null,
          },
          {
            endMonth: {
              gte: occurrenceMonth,
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
      },
    });
    const existingOccurrences =
      rules.length === 0
        ? []
        : await tx.expense.findMany({
            where: {
              recurringRuleId: {
                in: rules.map((rule) => rule.id),
              },
              occurrenceMonth,
            },
            select: {
              recurringRuleId: true,
            },
          });
    const existingRuleIds = new Set(
      existingOccurrences.flatMap((occurrence) =>
        occurrence.recurringRuleId ? [occurrence.recurringRuleId] : [],
      ),
    );
    const occurrencesToCreate = rules
      .filter((rule) => !existingRuleIds.has(rule.id))
      .map((rule) =>
        buildOwnerRecurringExpenseOccurrenceCreateData({
          createdByUserId: user.id,
          occurrenceMonth,
          rule,
        }),
      );

    const createResult =
      occurrencesToCreate.length === 0
        ? { count: 0 }
        : await tx.expense.createMany({
            data: occurrencesToCreate,
            skipDuplicates: true,
          });
    const skippedCount = rules.length - createResult.count;

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "recurring_expense_occurrences.generated",
        entityType: "RecurringExpenseRule",
        entityId: null,
        metadata: {
          source: "owner_generate_recurring_expense_occurrences",
          occurrenceMonth: occurrenceMonth.toISOString(),
          createdCount: createResult.count,
          skippedCount,
          totalEligibleRules: rules.length,
        },
      },
    });

    return {
      createdCount: createResult.count,
      skippedCount,
      totalEligibleRules: rules.length,
      month: occurrenceMonth,
    };
  });
}

export async function getOwnerRecurringExpenseRuleForDisable(ruleId: string) {
  const parsedRuleId = recurringExpenseRuleIdSchema.parse(ruleId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const rule = await prisma.recurringExpenseRule.findFirst({
    where: {
      id: parsedRuleId,
      property: {
        ownerProfileId: ownerProfile.id,
      },
    },
    select: {
      id: true,
      propertyId: true,
      status: true,
      property: {
        select: {
          id: true,
          ownerProfileId: true,
          name: true,
          city: true,
        },
      },
    },
  });

  if (!rule) {
    throw new AppError(
      "NOT_FOUND",
      "No recurring expense rule exists for this owner profile.",
    );
  }

  return { user, ownerProfile, rule };
}

export async function getOwnerPropertyForRecurringExpenseRuleCreation(
  propertyId: string,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const property = await prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      ownerProfileId: true,
      name: true,
      city: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  return { user, ownerProfile, property };
}
