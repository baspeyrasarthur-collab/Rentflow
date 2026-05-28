import { z } from "zod";

import { entityIdSchema } from "@/server/validation/common";

export const expenseStatusCreateSchema = z.enum(["PENDING", "PAID"]);
export const expenseCategorySchema = z.enum([
  "LOAN_REPAYMENT",
  "INSURANCE",
  "CONDO_FEES",
  "PROPERTY_TAX",
  "WORKS",
  "OTHER",
]);
export const expenseIdSchema = entityIdSchema;

const euroAmountPattern = /^\d+(?:[,.]\d{1,2})?$/;
const monthPattern = /^\d{4}-\d{2}$/;

export function parseEuroAmountToCents(value: string) {
  const normalized = value.trim().replace(",", ".");
  const [euros, cents = ""] = normalized.split(".");

  return Number(euros) * 100 + Number(cents.padEnd(2, "0"));
}

export const euroAmountInCentsSchema = z
  .string()
  .trim()
  .refine((value) => euroAmountPattern.test(value), {
    message: "Amount must be a euro amount with at most two decimals.",
  })
  .transform(parseEuroAmountToCents)
  .pipe(
    z
      .number()
      .int()
      .safe()
      .refine((amountInCents) => amountInCents > 0, {
        message: "Amount must be strictly greater than 0 cents.",
      }),
  );

export const expenseMonthSchema = z
  .string()
  .trim()
  .refine((value) => monthPattern.test(value), {
    message: "Month must use YYYY-MM format.",
  })
  .transform((value) => {
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
      return new Date(Number.NaN);
    }

    return new Date(year, monthIndex, 1);
  })
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: "Month must be a valid month.",
  });

export const ownerExpenseCreateSchema = z
  .object({
    propertyId: entityIdSchema,
    label: z.string().trim().max(140).optional(),
    amountInEuros: euroAmountInCentsSchema,
    dueDate: expenseMonthSchema,
    status: expenseStatusCreateSchema.default("PENDING"),
    category: expenseCategorySchema.default("OTHER"),
  })
  .strict()
  .transform(({ amountInEuros, ...input }) => ({
    ...input,
    amountInCents: amountInEuros,
  }));

export const ownerExpenseUpdateSchema = z
  .object({
    expenseId: expenseIdSchema,
    propertyId: entityIdSchema,
    label: z.string().trim().max(140).optional(),
    amountInEuros: euroAmountInCentsSchema,
    dueDate: expenseMonthSchema,
    status: expenseStatusCreateSchema,
    category: expenseCategorySchema.default("OTHER"),
  })
  .strict()
  .transform(({ amountInEuros, ...input }) => ({
    ...input,
    amountInCents: amountInEuros,
  }));

export type ExpenseStatusCreateInput = z.infer<
  typeof expenseStatusCreateSchema
>;
export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
export type OwnerExpenseCreateInput = z.infer<typeof ownerExpenseCreateSchema>;
export type OwnerExpenseUpdateInput = z.infer<typeof ownerExpenseUpdateSchema>;
