import { z } from "zod";

import { entityIdSchema } from "@/server/validation/common";

const emptyStringAsUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalEntityIdSchema = z.preprocess(
  emptyStringAsUndefined,
  entityIdSchema.optional(),
);

export const tenantRequestCategorySchema = z.enum([
  "GENERAL",
  "REPAIR",
  "DOCUMENT",
  "PAYMENT",
  "RECEIPT",
  "OTHER",
]);

export const tenantRequestCreateSchema = z
  .object({
    propertyId: optionalEntityIdSchema,
    rentalContractId: optionalEntityIdSchema,
    contractTenantId: entityIdSchema,
    category: tenantRequestCategorySchema.default("GENERAL"),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(5).max(1000),
  })
  .strict();

export const tenantRequestIdSchema = z
  .object({
    tenantRequestId: entityIdSchema,
  })
  .strict();

export const ownerTenantRequestResolveSchema = z
  .object({
    confirmResolved: z.literal("on"),
    ownerResponse: z
      .preprocess(emptyStringAsUndefined, z.string().trim().max(500).optional())
      .optional(),
    tenantRequestId: entityIdSchema,
  })
  .strict();

export const ownerTenantRequestRefuseSchema = z
  .object({
    confirmRefused: z.literal("on"),
    ownerResponse: z
      .preprocess(emptyStringAsUndefined, z.string().trim().max(500).optional())
      .optional(),
    tenantRequestId: entityIdSchema,
  })
  .strict();

export const tenantRequestAcknowledgeSchema = z
  .object({
    confirmAcknowledge: z.literal("on"),
    returnTo: z.enum(["/tenant", "/tenant/requests"]).optional(),
    tenantRequestId: entityIdSchema,
  })
  .strict();

export type TenantRequestCreateInput = z.infer<
  typeof tenantRequestCreateSchema
>;
