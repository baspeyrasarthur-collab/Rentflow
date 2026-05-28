import {
  ownerIndividualContractCreateSchema,
  ownerIndividualContractUpdateSchema,
  type OwnerIndividualContractCreateInput,
  type OwnerIndividualContractUpdateInput,
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

function readOptionalNumber(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);

  if (!value || value.trim() === "") {
    return undefined;
  }

  return Number(value);
}

export function parseEuroAmountToCents(value: string) {
  const normalized = value.trim().replace(",", ".");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return Number.NaN;
  }

  const [euros = "0", cents = ""] = normalized.split(".");
  const paddedCents = cents.padEnd(2, "0");

  return Number(euros) * 100 + Number(paddedCents);
}

export function formatCentsForEuroInput(amountInCents: number) {
  const euros = Math.trunc(amountInCents / 100);
  const cents = amountInCents % 100;

  return cents === 0
    ? String(euros)
    : `${euros}.${String(cents).padStart(2, "0")}`;
}

function readOptionalEuroAmountInCents(formData: FormData, key: string) {
  const value = readOptionalString(formData, key);

  if (!value || value.trim() === "") {
    return undefined;
  }

  return parseEuroAmountToCents(value);
}

export function parseOwnerIndividualContractCreateFormData(
  formData: FormData,
): OwnerIndividualContractCreateInput {
  const input: Record<string, unknown> = {};

  writeDefined(input, "startDate", readOptionalString(formData, "startDate"));
  writeDefined(input, "endDate", readOptionalString(formData, "endDate"));
  writeDefined(
    input,
    "totalRentAmountInCents",
    readOptionalEuroAmountInCents(formData, "totalRentAmountInEuros"),
  );
  writeDefined(
    input,
    "totalChargesAmountInCents",
    readOptionalEuroAmountInCents(formData, "totalChargesAmountInEuros"),
  );
  writeDefined(
    input,
    "depositAmountInCents",
    readOptionalEuroAmountInCents(formData, "depositAmountInEuros"),
  );
  writeDefined(input, "currency", readOptionalString(formData, "currency"));
  writeDefined(
    input,
    "paymentDayOfMonth",
    readOptionalNumber(formData, "paymentDayOfMonth"),
  );

  return ownerIndividualContractCreateSchema.parse(input);
}

export function parseOwnerIndividualContractUpdateFormData(
  formData: FormData,
): OwnerIndividualContractUpdateInput {
  const input: Record<string, unknown> = {};

  writeDefined(input, "startDate", readOptionalString(formData, "startDate"));
  writeDefined(input, "endDate", readOptionalString(formData, "endDate"));
  writeDefined(
    input,
    "totalRentAmountInCents",
    readOptionalEuroAmountInCents(formData, "totalRentAmountInEuros"),
  );
  writeDefined(
    input,
    "totalChargesAmountInCents",
    readOptionalEuroAmountInCents(formData, "totalChargesAmountInEuros"),
  );
  writeDefined(
    input,
    "depositAmountInCents",
    readOptionalEuroAmountInCents(formData, "depositAmountInEuros"),
  );
  writeDefined(input, "currency", readOptionalString(formData, "currency"));
  writeDefined(
    input,
    "paymentDayOfMonth",
    readOptionalNumber(formData, "paymentDayOfMonth"),
  );

  return ownerIndividualContractUpdateSchema.parse(input);
}
