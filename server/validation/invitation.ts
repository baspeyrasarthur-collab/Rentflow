import { z } from "zod";

import { emailSchema, nonEmptyStringSchema } from "@/server/validation/common";

const invitationNameSchema = nonEmptyStringSchema.max(80);

export const ownerTenantInvitationCreateSchema = z
  .object({
    tenantEmail: emailSchema,
    tenantFirstName: invitationNameSchema,
    tenantLastName: invitationNameSchema,
  })
  .strict();

export const invitationTokenSchema = nonEmptyStringSchema.min(32).max(512);

export type OwnerTenantInvitationCreateInput = z.infer<
  typeof ownerTenantInvitationCreateSchema
>;
export type InvitationTokenInput = z.infer<typeof invitationTokenSchema>;
