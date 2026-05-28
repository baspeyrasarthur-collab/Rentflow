type PaymentTypeValue = "RENT" | "CHARGES" | "DEPOSIT" | "ONE_OFF_EXPENSE";

type PaymentStatusValue =
  | "PLANNED"
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "REFUNDED"
  | "DISPUTED";

export type RentReceiptPaymentEligibilityInput = {
  type: PaymentTypeValue;
  status: PaymentStatusValue;
};

export type ReceiptStatusValue =
  | "REQUESTED"
  | "GENERATED"
  | "SENT"
  | "CANCELED";

export type BuildRentReceiptDataInput = {
  propertyId: string;
  rentalContractId: string;
  contractTenantId: string | null;
  tenantProfileId: string;
  ownerProfileId: string;
  dueDate: Date;
  rentAmountInCents: number;
  chargesAmountInCents: number;
  currency: string;
  requestedAt: Date;
  generatedAt: Date;
};

export type BuildRequestedRentReceiptDataInput = Omit<
  BuildRentReceiptDataInput,
  "generatedAt"
>;

export type RentReceiptPeriodIdentity = {
  tenantProfileId: string;
  rentalContractId: string;
  contractTenantId: string | null;
  periodStart: Date;
  periodEnd: Date;
};

export type ExistingRentReceiptPeriodInput = RentReceiptPeriodIdentity & {
  type: "RECEIPT" | "RENT_RECEIPT";
  status: ReceiptStatusValue;
};

function isNonNegativeIntegerCents(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

function assertNonNegativeIntegerCents(value: number, fieldName: string) {
  if (!isNonNegativeIntegerCents(value)) {
    throw new Error(`${fieldName} must be a non-negative integer in cents.`);
  }
}

export function canGenerateRentReceiptFromPayment(
  payment: RentReceiptPaymentEligibilityInput,
) {
  return payment.type === "RENT" && payment.status === "SUCCEEDED";
}

export function canRequestRentReceiptFromPayment(
  payment: RentReceiptPaymentEligibilityInput,
) {
  return payment.type === "RENT" && payment.status === "SUCCEEDED";
}

export function isBlockingRentReceiptStatus(status: ReceiptStatusValue) {
  return status === "REQUESTED" || status === "GENERATED" || status === "SENT";
}

export function getExpectedRentReceiptTotalInCents(
  rentAmountInCents: number,
  chargesAmountInCents: number,
) {
  assertNonNegativeIntegerCents(rentAmountInCents, "rentAmountInCents");
  assertNonNegativeIntegerCents(chargesAmountInCents, "chargesAmountInCents");

  return rentAmountInCents + chargesAmountInCents;
}

export function isFullRentPayment(
  paymentAmountInCents: number,
  rentAmountInCents: number,
  chargesAmountInCents: number,
) {
  if (!isNonNegativeIntegerCents(paymentAmountInCents)) {
    return false;
  }

  return (
    paymentAmountInCents >=
    getExpectedRentReceiptTotalInCents(rentAmountInCents, chargesAmountInCents)
  );
}

export function getMonthlyReceiptPeriodFromDueDate(dueDate: Date) {
  const year = dueDate.getUTCFullYear();
  const month = dueDate.getUTCMonth();

  return {
    periodStart: new Date(Date.UTC(year, month, 1)),
    periodEnd: new Date(Date.UTC(year, month + 1, 0)),
  };
}

export function hasExistingRentReceiptForPeriod(
  receipts: ExistingRentReceiptPeriodInput[],
  identity: RentReceiptPeriodIdentity,
) {
  return receipts.some(
    (receipt) =>
      receipt.type === "RENT_RECEIPT" &&
      isBlockingRentReceiptStatus(receipt.status) &&
      receipt.tenantProfileId === identity.tenantProfileId &&
      receipt.rentalContractId === identity.rentalContractId &&
      receipt.contractTenantId === identity.contractTenantId &&
      receipt.periodStart.getTime() === identity.periodStart.getTime() &&
      receipt.periodEnd.getTime() === identity.periodEnd.getTime(),
  );
}

export function buildRequestedRentReceiptDataFromPayment(
  input: BuildRequestedRentReceiptDataInput,
) {
  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    input.dueDate,
  );
  const totalAmountInCents = getExpectedRentReceiptTotalInCents(
    input.rentAmountInCents,
    input.chargesAmountInCents,
  );

  return {
    propertyId: input.propertyId,
    rentalContractId: input.rentalContractId,
    contractTenantId: input.contractTenantId,
    tenantProfileId: input.tenantProfileId,
    ownerProfileId: input.ownerProfileId,
    type: "RENT_RECEIPT" as const,
    periodStart,
    periodEnd,
    rentAmountInCents: input.rentAmountInCents,
    chargesAmountInCents: input.chargesAmountInCents,
    totalAmountInCents,
    currency: input.currency,
    status: "REQUESTED" as const,
    requestedAt: input.requestedAt,
    generatedAt: null,
    sentAt: null,
    storageKey: null,
  };
}

export function buildRentReceiptDataFromPayment(
  input: BuildRentReceiptDataInput,
) {
  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    input.dueDate,
  );
  const totalAmountInCents = getExpectedRentReceiptTotalInCents(
    input.rentAmountInCents,
    input.chargesAmountInCents,
  );

  return {
    propertyId: input.propertyId,
    rentalContractId: input.rentalContractId,
    contractTenantId: input.contractTenantId,
    tenantProfileId: input.tenantProfileId,
    ownerProfileId: input.ownerProfileId,
    type: "RENT_RECEIPT" as const,
    periodStart,
    periodEnd,
    rentAmountInCents: input.rentAmountInCents,
    chargesAmountInCents: input.chargesAmountInCents,
    totalAmountInCents,
    currency: input.currency,
    status: "GENERATED" as const,
    requestedAt: input.requestedAt,
    generatedAt: input.generatedAt,
    sentAt: null,
    storageKey: null,
  };
}
