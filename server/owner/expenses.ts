import { DEFAULT_CURRENCY } from "@/server/config/app";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import {
  expenseIdSchema,
  propertyIdSchema,
  type ExpenseCategoryInput,
  type OwnerExpenseCreateInput,
  type OwnerExpenseUpdateInput,
} from "@/server/validation";

const EXPENSE_DEFAULT_LABELS: Record<ExpenseCategoryInput, string> = {
  LOAN_REPAYMENT: "Depense - Remboursement d'emprunt",
  INSURANCE: "Depense - Assurance",
  CONDO_FEES: "Depense - Charges de copropriete",
  PROPERTY_TAX: "Depense - Taxe fonciere",
  WORKS: "Depense - Travaux",
  OTHER: "Depense enregistree",
};

function getExpenseLabel(input: {
  category: ExpenseCategoryInput;
  label?: string;
}) {
  const label = input.label?.trim();

  return label || EXPENSE_DEFAULT_LABELS[input.category];
}

export function buildOwnerExpenseCreateData(
  input: OwnerExpenseCreateInput,
  propertyId: string,
  createdByUserId: string,
) {
  return {
    propertyId,
    createdByUserId,
    label: getExpenseLabel(input),
    amountInCents: input.amountInCents,
    currency: DEFAULT_CURRENCY,
    dueDate: input.dueDate,
    status: input.status,
    category: input.category,
  };
}

export function buildOwnerExpenseUpdateData(
  input: OwnerExpenseUpdateInput,
  propertyId: string,
) {
  return {
    propertyId,
    label: getExpenseLabel(input),
    amountInCents: input.amountInCents,
    dueDate: input.dueDate,
    status: input.status,
    category: input.category,
  };
}

export function buildOwnerExpenseCancelData() {
  return {
    status: "CANCELED" as const,
  };
}

export async function listOwnerPropertiesForExpenseCreation() {
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

export async function getOwnerExpenseForEdition(expenseId: string) {
  const parsedExpenseId = expenseIdSchema.parse(expenseId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const expense = await prisma.expense.findFirst({
    where: {
      id: parsedExpenseId,
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
      dueDate: true,
      status: true,
      category: true,
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

  if (!expense) {
    throw new AppError(
      "NOT_FOUND",
      "No expense exists for this owner profile.",
    );
  }

  return { user, ownerProfile, expense };
}

export async function getOwnerExpenseForCancellation(expenseId: string) {
  return getOwnerExpenseForEdition(expenseId);
}

export async function getOwnerExpenseAndPropertyForUpdate(
  expenseId: string,
  propertyId: string,
) {
  const parsedExpenseId = expenseIdSchema.parse(expenseId);
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const [expense, property] = await Promise.all([
    prisma.expense.findFirst({
      where: {
        id: parsedExpenseId,
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
        dueDate: true,
        status: true,
        category: true,
        property: {
          select: {
            id: true,
            ownerProfileId: true,
            name: true,
            city: true,
          },
        },
      },
    }),
    prisma.property.findFirst({
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
    }),
  ]);

  if (!expense) {
    throw new AppError(
      "NOT_FOUND",
      "No expense exists for this owner profile.",
    );
  }

  if (expense.status === "CANCELED") {
    throw new AppError("CONFLICT", "Canceled expenses cannot be edited.");
  }

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  return { user, ownerProfile, expense, property };
}

export async function getOwnerPropertyForExpenseCreation(propertyId: string) {
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
