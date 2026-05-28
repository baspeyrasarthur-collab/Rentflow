import { z } from "zod";

import { DEFAULT_CURRENCY } from "@/server/config/app";
import {
  currencyCodeSchema,
  entityIdSchema,
  integerCentsSchema,
} from "@/server/validation/common";
import { euroAmountInCentsSchema } from "@/server/validation/expense";

const emptyStringAsUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalCurrencySchema = z.preprocess(
  emptyStringAsUndefined,
  currencyCodeSchema.default(DEFAULT_CURRENCY),
);

const optionalAmountInCentsSchema = z.preprocess(
  emptyStringAsUndefined,
  integerCentsSchema.optional(),
);

export const paymentIdSchema = entityIdSchema;

export const ownerExpectedRentPaymentCreateSchema = z
  .object({
    contractTenantId: entityIdSchema,
    dueDate: z.coerce.date(),
    amountInCents: optionalAmountInCentsSchema,
    currency: optionalCurrencySchema,
  })
  .strict();

export const ownerCentralExpectedRentPaymentCreateSchema = z
  .object({
    propertyId: entityIdSchema,
    rentalContractId: entityIdSchema,
    contractTenantId: entityIdSchema,
    amountInEuros: euroAmountInCentsSchema,
    dueDate: z.coerce.date(),
  })
  .strict()
  .transform(({ amountInEuros, ...input }) => ({
    ...input,
    amountInCents: amountInEuros,
  }));

export const tenantMockPaymentActionSchema = z
  .object({
    paymentId: paymentIdSchema,
  })
  .strict();

export const paymentDeclarationTypeSchema = z.enum([
  "PAID_EXTERNALLY",
  "NOT_PAID_YET",
]);

export const tenantExternalPaymentDeclarationSchema = z
  .object({
    paymentId: paymentIdSchema,
    declarationType: paymentDeclarationTypeSchema,
  })
  .strict();

export type OwnerExpectedRentPaymentCreateInput = z.infer<
  typeof ownerExpectedRentPaymentCreateSchema
>;

export type OwnerCentralExpectedRentPaymentCreateInput = z.infer<
  typeof ownerCentralExpectedRentPaymentCreateSchema
>;

export type TenantMockPaymentActionInput = z.infer<
  typeof tenantMockPaymentActionSchema
>;

export type PaymentDeclarationTypeInput = z.infer<
  typeof paymentDeclarationTypeSchema
>;

export type TenantExternalPaymentDeclarationInput = z.infer<
  typeof tenantExternalPaymentDeclarationSchema
>;
