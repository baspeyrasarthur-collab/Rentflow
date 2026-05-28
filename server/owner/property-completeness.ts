const REQUIRED_PROPERTY_FIELDS = [
  "name",
  "addressLine1",
  "postalCode",
  "city",
  "country",
  "propertyType",
] as const;

export type RequiredPropertyField = (typeof REQUIRED_PROPERTY_FIELDS)[number];

export type SecondaryPropertyField = "surfaceAreaSqm";

export type OwnerPropertyCompletionState = {
  missingRequiredFields: RequiredPropertyField[];
  missingSecondaryFields: SecondaryPropertyField[];
  isComplete: boolean;
};

function isFilledText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getMissingRequiredPropertyFields(property: {
  name: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  propertyType: string | null;
}) {
  return REQUIRED_PROPERTY_FIELDS.filter((field) => {
    const value = property[field];

    return !isFilledText(value);
  });
}

export function getMissingSecondaryPropertyFields(property: {
  surfaceAreaSqm: number | null;
}) {
  return property.surfaceAreaSqm === null
    ? (["surfaceAreaSqm"] satisfies SecondaryPropertyField[])
    : [];
}

export function getOwnerPropertyCompletionState(property: {
  name: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  propertyType: string | null;
  surfaceAreaSqm: number | null;
}): OwnerPropertyCompletionState {
  const missingRequiredFields = getMissingRequiredPropertyFields(property);
  const missingSecondaryFields = getMissingSecondaryPropertyFields(property);

  return {
    missingRequiredFields,
    missingSecondaryFields,
    isComplete:
      missingRequiredFields.length === 0 && missingSecondaryFields.length === 0,
  };
}
