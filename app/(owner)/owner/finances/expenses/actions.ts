"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import {
  parseOwnerExpenseCreateFormData,
  parseOwnerExpenseUpdateFormData,
} from "@/server/owner/expense-form";
import {
  buildOwnerExpenseCreateData,
  buildOwnerExpenseCancelData,
  buildOwnerExpenseUpdateData,
  getOwnerExpenseAndPropertyForUpdate,
  getOwnerExpenseForCancellation,
  getOwnerPropertyForExpenseCreation,
} from "@/server/owner/expenses";
import { expenseIdSchema } from "@/server/validation";

export async function createOwnerExpenseAction(formData: FormData) {
  const input = parseOwnerExpenseCreateFormData(formData);
  const { user, property } = await getOwnerPropertyForExpenseCreation(
    input.propertyId,
  );

  await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: buildOwnerExpenseCreateData(input, property.id, user.id),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "expense.created",
        entityType: "Expense",
        entityId: expense.id,
        metadata: {
          source: "owner_create_expense",
          propertyId: property.id,
        },
      },
    });
  });

  redirect("/owner/finances");
}

export async function updateOwnerExpenseAction(formData: FormData) {
  const input = parseOwnerExpenseUpdateFormData(formData);
  const { user, expense, property } = await getOwnerExpenseAndPropertyForUpdate(
    input.expenseId,
    input.propertyId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: {
        id: expense.id,
      },
      data: buildOwnerExpenseUpdateData(input, property.id),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "expense.updated",
        entityType: "Expense",
        entityId: expense.id,
        metadata: {
          source: "owner_update_expense",
          propertyId: property.id,
        },
      },
    });
  });

  redirect("/owner/finances");
}

export async function cancelOwnerExpenseAction(formData: FormData) {
  const expenseId = expenseIdSchema.parse(formData.get("expenseId"));
  const { user, expense } = await getOwnerExpenseForCancellation(expenseId);

  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: {
        id: expense.id,
      },
      data: buildOwnerExpenseCancelData(),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "expense.canceled",
        entityType: "Expense",
        entityId: expense.id,
        metadata: {
          source: "owner_cancel_expense",
          propertyId: expense.propertyId,
        },
      },
    });
  });

  redirect("/owner/finances");
}
