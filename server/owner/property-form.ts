import {
  propertyCreateSchema,
  type PropertyCreateInput,
  propertyUpdateSchema,
  type PropertyUpdateInput,
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

function readOptionalInteger(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);

  if (!value || value.trim() === "") {
    return undefined;
  }

  return Number(value);
}

function readPresentBoolean(formData: FormData, key: string) {
  if (!formData.has(`${key}Present`)) {
    return undefined;
  }

  return formData.has(key);
}

export function parseOwnerPropertyCreateFormData(
  formData: FormData,
): PropertyCreateInput {
  const input: Record<string, unknown> = {};

  writeDefined(input, "name", readOptionalString(formData, "name"));
  writeDefined(
    input,
    "addressLine1",
    readOptionalString(formData, "addressLine1"),
  );
  writeDefined(
    input,
    "addressLine2",
    readOptionalString(formData, "addressLine2"),
  );
  writeDefined(input, "postalCode", readOptionalString(formData, "postalCode"));
  writeDefined(input, "city", readOptionalString(formData, "city"));
  writeDefined(input, "country", readOptionalString(formData, "country"));
  writeDefined(
    input,
    "propertyType",
    readOptionalString(formData, "propertyType"),
  );
  writeDefined(
    input,
    "surfaceAreaSqm",
    readOptionalInteger(formData, "surfaceAreaSqm"),
  );
  writeDefined(input, "furnished", formData.has("furnished"));
  writeDefined(input, "isColocation", formData.has("isColocation"));

  return propertyCreateSchema.parse(input);
}

export function parseOwnerPropertyUpdateFormData(
  formData: FormData,
): PropertyUpdateInput {
  const input: Record<string, unknown> = {};

  writeDefined(input, "name", readOptionalString(formData, "name"));
  writeDefined(
    input,
    "addressLine1",
    readOptionalString(formData, "addressLine1"),
  );
  writeDefined(
    input,
    "addressLine2",
    readOptionalString(formData, "addressLine2"),
  );
  writeDefined(input, "postalCode", readOptionalString(formData, "postalCode"));
  writeDefined(input, "city", readOptionalString(formData, "city"));
  writeDefined(input, "country", readOptionalString(formData, "country"));
  writeDefined(
    input,
    "propertyType",
    readOptionalString(formData, "propertyType"),
  );
  writeDefined(
    input,
    "surfaceAreaSqm",
    readOptionalInteger(formData, "surfaceAreaSqm"),
  );
  writeDefined(input, "furnished", readPresentBoolean(formData, "furnished"));
  writeDefined(
    input,
    "isColocation",
    readPresentBoolean(formData, "isColocation"),
  );

  return propertyUpdateSchema.parse(input);
}
