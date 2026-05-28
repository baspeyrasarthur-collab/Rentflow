import {
  ownerCentralExpectedRentPaymentCreateSchema,
  ownerExpectedRentPaymentCreateSchema,
  type OwnerCentralExpectedRentPaymentCreateInput,
  type OwnerExpectedRentPaymentCreateInput,
} from "@/server/validation";

function readOptionalInteger(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return Number(value);
}

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value;
}

const forbiddenCentralPaymentFields = [
  "tenantProfileId",
  "ownerProfileId",
  "provider",
  "providerPaymentId",
  "status",
  "type",
  "currency",
  "paidAt",
];

function assertNoForbiddenCentralPaymentFields(formData: FormData) {
  const forbiddenField = forbiddenCentralPaymentFields.find((field) =>
    formData.has(field),
  );

  if (forbiddenField) {
    throw new Error(
      `Field ${forbiddenField} is controlled by the server and cannot be submitted.`,
    );
  }
}

export function parseOwnerExpectedRentPaymentFormData(
  formData: FormData,
): OwnerExpectedRentPaymentCreateInput {
  return ownerExpectedRentPaymentCreateSchema.parse({
    contractTenantId: readOptionalString(formData, "contractTenantId"),
    dueDate: readOptionalString(formData, "dueDate"),
    amountInCents: readOptionalInteger(formData, "amountInCents"),
    currency: readOptionalString(formData, "currency"),
  });
}

export function parseOwnerCentralExpectedRentPaymentFormData(
  formData: FormData,
): OwnerCentralExpectedRentPaymentCreateInput {
  assertNoForbiddenCentralPaymentFields(formData);

  return ownerCentralExpectedRentPaymentCreateSchema.parse({
    propertyId: readOptionalString(formData, "propertyId"),
    rentalContractId: readOptionalString(formData, "rentalContractId"),
    contractTenantId: readOptionalString(formData, "contractTenantId"),
    amountInEuros: readOptionalString(formData, "amountInEuros"),
    dueDate: readOptionalString(formData, "dueDate"),
  });
}
