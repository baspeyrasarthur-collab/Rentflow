import {
  ownerTenantInvitationCreateSchema,
  type OwnerTenantInvitationCreateInput,
} from "@/server/validation";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function writeDefined(
  input: Record<string, unknown>,
  key: string,
  value: unknown,
) {
  if (value !== undefined) {
    input[key] = value;
  }
}

export function parseOwnerTenantInvitationCreateFormData(
  formData: FormData,
): OwnerTenantInvitationCreateInput {
  const input: Record<string, unknown> = {};

  writeDefined(
    input,
    "tenantEmail",
    readOptionalString(formData, "tenantEmail"),
  );
  writeDefined(
    input,
    "tenantFirstName",
    readOptionalString(formData, "tenantFirstName"),
  );
  writeDefined(
    input,
    "tenantLastName",
    readOptionalString(formData, "tenantLastName"),
  );

  return ownerTenantInvitationCreateSchema.parse(input);
}
