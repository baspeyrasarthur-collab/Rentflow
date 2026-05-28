import {
  ownerRecurringExpenseRuleCreateSchema,
  type OwnerRecurringExpenseRuleCreateInput,
} from "@/server/validation";

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value;
}

export function parseOwnerRecurringExpenseRuleCreateFormData(
  formData: FormData,
): OwnerRecurringExpenseRuleCreateInput {
  return ownerRecurringExpenseRuleCreateSchema.parse({
    propertyId: readOptionalString(formData, "propertyId"),
    label: readOptionalString(formData, "label"),
    amountInEuros: readOptionalString(formData, "amountInEuros"),
    category: readOptionalString(formData, "category"),
    dayOfMonth: readOptionalString(formData, "dayOfMonth"),
    startMonth: readOptionalString(formData, "startMonth"),
    endMonth: readOptionalString(formData, "endMonth"),
  });
}
