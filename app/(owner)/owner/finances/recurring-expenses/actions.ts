"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { parseOwnerRecurringExpenseRuleCreateFormData } from "@/server/owner/recurring-expense-form";
import {
  buildOwnerRecurringExpenseRuleCreateData,
  buildOwnerRecurringExpenseRuleDisableData,
  formatRecurringExpenseOccurrenceMonthParam,
  generateOwnerRecurringExpensesForMonth,
  getOwnerRecurringExpenseRuleForDisable,
  getOwnerPropertyForRecurringExpenseRuleCreation,
} from "@/server/owner/recurring-expenses";
import {
  recurringExpenseRuleIdSchema,
  recurringExpenseRuleMonthSchema,
} from "@/server/validation";

export async function createOwnerRecurringExpenseRuleAction(
  formData: FormData,
) {
  const input = parseOwnerRecurringExpenseRuleCreateFormData(formData);
  const { user, property } =
    await getOwnerPropertyForRecurringExpenseRuleCreation(input.propertyId);

  await prisma.$transaction(async (tx) => {
    const recurringExpenseRule = await tx.recurringExpenseRule.create({
      data: buildOwnerRecurringExpenseRuleCreateData(
        input,
        property.id,
        user.id,
      ),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "recurring_expense_rule.created",
        entityType: "RecurringExpenseRule",
        entityId: recurringExpenseRule.id,
        metadata: {
          source: "owner_create_recurring_expense_rule",
          propertyId: property.id,
        },
      },
    });
  });

  redirect("/owner/finances");
}

export async function disableOwnerRecurringExpenseRuleAction(
  formData: FormData,
) {
  const recurringExpenseRuleId = recurringExpenseRuleIdSchema.parse(
    formData.get("recurringExpenseRuleId"),
  );
  const { user, rule } = await getOwnerRecurringExpenseRuleForDisable(
    recurringExpenseRuleId,
  );

  await prisma.$transaction(async (tx) => {
    await tx.recurringExpenseRule.update({
      where: {
        id: rule.id,
      },
      data: buildOwnerRecurringExpenseRuleDisableData(),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "recurring_expense_rule.disabled",
        entityType: "RecurringExpenseRule",
        entityId: rule.id,
        metadata: {
          source: "owner_disable_recurring_expense_rule",
          propertyId: rule.propertyId,
        },
      },
    });
  });

  redirect("/owner/finances/recurring-expenses");
}

export async function generateOwnerRecurringExpenseOccurrencesAction(
  formData: FormData,
) {
  const occurrenceMonth = recurringExpenseRuleMonthSchema.parse(
    formData.get("month"),
  );
  const result = await generateOwnerRecurringExpensesForMonth(occurrenceMonth);
  const redirectParams = new URLSearchParams({
    month: formatRecurringExpenseOccurrenceMonthParam(occurrenceMonth),
    recurringCreated: String(result.createdCount),
    recurringSkipped: String(result.skippedCount),
    recurringEligible: String(result.totalEligibleRules),
  });

  redirect(`/owner/finances?${redirectParams.toString()}`);
}
