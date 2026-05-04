import { z } from "zod";

import { DEFAULT_COUNTRY } from "@/server/config/app";
import {
  entityIdSchema,
  nonEmptyStringSchema,
} from "@/server/validation/common";

const emptyStringAsUndefined = (value: unknown) =>
  value === "" ? undefined : value;

export const propertyIdSchema = entityIdSchema;

export const propertyTypeSchema = z.enum([
  "APARTMENT",
  "HOUSE",
  "ROOM",
  "OTHER",
]);

const countryCodeSchema = z.preprocess(
  emptyStringAsUndefined,
  z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .default(DEFAULT_COUNTRY),
);

const optionalCountryCodeSchema = z.preprocess(
  emptyStringAsUndefined,
  z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .optional(),
);

const optionalAddressLineSchema = z.preprocess(
  emptyStringAsUndefined,
  z.string().trim().max(191).optional(),
);

const optionalSurfaceAreaSchema = z.preprocess(
  emptyStringAsUndefined,
  z.number().int().positive().optional(),
);

export const propertyCreateSchema = z
  .object({
    name: nonEmptyStringSchema.max(120),
    addressLine1: nonEmptyStringSchema.max(191),
    addressLine2: optionalAddressLineSchema,
    postalCode: nonEmptyStringSchema.max(32),
    city: nonEmptyStringSchema.max(120),
    country: countryCodeSchema,
    propertyType: propertyTypeSchema,
    surfaceAreaSqm: optionalSurfaceAreaSchema,
    furnished: z.boolean().default(false),
    isColocation: z.boolean().default(false),
  })
  .strict();

export const propertyUpdateSchema = propertyCreateSchema
  .extend({
    country: optionalCountryCodeSchema,
    furnished: z.boolean().optional(),
    isColocation: z.boolean().optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one property field must be provided.",
  });

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
export type PropertyTypeInput = z.infer<typeof propertyTypeSchema>;
