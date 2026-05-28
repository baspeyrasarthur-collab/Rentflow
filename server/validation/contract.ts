import { z } from "zod";

import { DEFAULT_CURRENCY } from "@/server/config/app";
import {
  currencyCodeSchema,
  entityIdSchema,
  integerCentsSchema,
} from "@/server/validation/common";

const emptyStringAsUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const dateSchema = z.coerce.date();

const optionalDateSchema = z.preprocess(
  emptyStringAsUndefined,
  z.coerce.date().optional(),
);

const contractCurrencySchema = z.preprocess(
  emptyStringAsUndefined,
  currencyCodeSchema.default(DEFAULT_CURRENCY),
);

const optionalContractCurrencySchema = z.preprocess(
  emptyStringAsUndefined,
  currencyCodeSchema.optional(),
);

const paymentDayOfMonthSchema = z.number().int().min(1).max(28);

const positiveIntegerCentsSchema = integerCentsSchema.positive();

export const contractIdSchema = entityIdSchema;

const ownerIndividualContractCreateBaseSchema = z
  .object({
    startDate: dateSchema,
    endDate: optionalDateSchema,
    totalRentAmountInCents: positiveIntegerCentsSchema,
    totalChargesAmountInCents: integerCentsSchema,
    depositAmountInCents: integerCentsSchema,
    currency: contractCurrencySchema,
    paymentDayOfMonth: paymentDayOfMonthSchema,
  })
  .strict();

const ownerIndividualContractUpdateBaseSchema =
  ownerIndividualContractCreateBaseSchema.extend({
    currency: optionalContractCurrencySchema,
  });

export const ownerIndividualContractCreateSchema =
  ownerIndividualContractCreateBaseSchema.refine(
    (value) => !value.endDate || value.endDate >= value.startDate,
    {
      message: "Contract end date must be after or equal to start date.",
      path: ["endDate"],
    },
  );

export const ownerIndividualContractUpdateSchema =
  ownerIndividualContractUpdateBaseSchema
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
      message: "At least one contract field must be provided.",
    })
    .refine(
      (value) =>
        !value.startDate || !value.endDate || value.endDate >= value.startDate,
      {
        message: "Contract end date must be after or equal to start date.",
        path: ["endDate"],
      },
    );

export type OwnerIndividualContractCreateInput = z.infer<
  typeof ownerIndividualContractCreateSchema
>;
export type OwnerIndividualContractUpdateInput = z.infer<
  typeof ownerIndividualContractUpdateSchema
>;
