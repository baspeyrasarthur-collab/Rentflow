import { z } from "zod";

import {
  entityIdSchema,
  nonEmptyStringSchema,
} from "@/server/validation/common";
import {
  euroAmountInCentsSchema,
  expenseCategorySchema,
} from "@/server/validation/expense";

export const recurringExpenseRuleIdSchema = entityIdSchema;

export const recurringExpenseRuleMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}$/, {
    message: "Month must use the YYYY-MM format.",
  })
  .transform((value, context) => {
    const [yearValue, monthValue] = value.split("-");
    const year = Number(yearValue);
    const monthIndex = Number(monthValue) - 1;

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(monthIndex) ||
      year < 1000 ||
      monthIndex < 0 ||
      monthIndex > 11
    ) {
      context.addIssue({
        code: "custom",
        message: "Month must be a valid calendar month.",
      });

      return z.NEVER;
    }

    return new Date(year, monthIndex, 1);
  });

export const ownerRecurringExpenseRuleCreateSchema = z
  .object({
    propertyId: entityIdSchema,
    label: nonEmptyStringSchema.max(140),
    amountInEuros: euroAmountInCentsSchema,
    category: expenseCategorySchema.default("OTHER"),
    dayOfMonth: z.coerce.number().int().min(1).max(31),
    startMonth: recurringExpenseRuleMonthSchema,
    endMonth: recurringExpenseRuleMonthSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.endMonth && input.endMonth < input.startMonth) {
      context.addIssue({
        code: "custom",
        message: "End month must be greater than or equal to start month.",
        path: ["endMonth"],
      });
    }
  })
  .transform(({ amountInEuros, ...input }) => ({
    ...input,
    amountInCents: amountInEuros,
  }));

export type OwnerRecurringExpenseRuleCreateInput = z.infer<
  typeof ownerRecurringExpenseRuleCreateSchema
>;
export type RecurringExpenseRuleMonthInput = z.infer<
  typeof recurringExpenseRuleMonthSchema
>;
