import {
  ownerExpenseCreateSchema,
  ownerExpenseUpdateSchema,
  type OwnerExpenseCreateInput,
  type OwnerExpenseUpdateInput,
} from "@/server/validation";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value;
}

export function parseOwnerExpenseCreateFormData(
  formData: FormData,
): OwnerExpenseCreateInput {
  return ownerExpenseCreateSchema.parse({
    propertyId: readOptionalString(formData, "propertyId"),
    label: readOptionalString(formData, "label"),
    amountInEuros: readOptionalString(formData, "amountInEuros"),
    dueDate: readOptionalString(formData, "dueDate"),
    status: readOptionalString(formData, "status"),
    category: readOptionalString(formData, "category"),
  });
}

export function parseOwnerExpenseUpdateFormData(
  formData: FormData,
): OwnerExpenseUpdateInput {
  return ownerExpenseUpdateSchema.parse({
    expenseId: readOptionalString(formData, "expenseId"),
    propertyId: readOptionalString(formData, "propertyId"),
    label: readOptionalString(formData, "label"),
    amountInEuros: readOptionalString(formData, "amountInEuros"),
    dueDate: readOptionalString(formData, "dueDate"),
    status: readOptionalString(formData, "status"),
    category: readOptionalString(formData, "category"),
  });
}
