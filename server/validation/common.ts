import { z } from "zod";

export const nonEmptyStringSchema = z.string().trim().min(1);

export const entityIdSchema = nonEmptyStringSchema.max(191);

export const emailSchema = z.string().trim().email().toLowerCase();

export const integerCentsSchema = z
  .number()
  .int()
  .safe()
  .nonnegative()
  .describe("Money amount stored as integer cents.");

export const currencyCodeSchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase());

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const dateStringSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));
