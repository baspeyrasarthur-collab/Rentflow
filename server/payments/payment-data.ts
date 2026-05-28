type PaymentProviderValue = "MOCK" | "STRIPE_CONNECT" | "GOCARDLESS" | null;

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

export type PaymentClassificationInput = {
  provider: PaymentProviderValue;
};

export type PlatformCommissionEligibilityInput = {
  provider: PaymentProviderValue;
  type: PaymentTypeValue;
  status: PaymentStatusValue;
};

export type ExpectedRentPaymentDataInput = {
  propertyId: string;
  rentalContractId: string;
  contractTenantId: string;
  tenantProfileId: string;
  ownerProfileId: string;
  rentAmountInCents: number;
  chargesAmountInCents: number;
  amountInCents?: number;
  currency: string;
  dueDate: Date;
};

export type ExternalPaymentReceiptEligibilityInput = {
  provider: PaymentProviderValue;
  providerPaymentId: string | null;
  status: PaymentStatusValue;
};

export type TenantMockPaymentEligibilityInput = {
  provider: PaymentProviderValue;
  providerPaymentId: string | null;
  type: PaymentTypeValue;
  status: PaymentStatusValue;
};

function assertIntegerCents(value: number, fieldName: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer in cents.`);
  }
}

export function isExternalPayment(payment: PaymentClassificationInput) {
  return payment.provider === null;
}

export function isRentFlowManagedPayment(payment: PaymentClassificationInput) {
  return payment.provider !== null;
}

export function shouldCreatePlatformCommission(
  payment: PlatformCommissionEligibilityInput,
) {
  return (
    payment.type === "RENT" &&
    payment.status === "SUCCEEDED" &&
    payment.provider === "MOCK"
  );
}

export function calculateRentWithChargesInCents(
  rentAmountInCents: number,
  chargesAmountInCents: number,
) {
  assertIntegerCents(rentAmountInCents, "rentAmountInCents");
  assertIntegerCents(chargesAmountInCents, "chargesAmountInCents");

  return rentAmountInCents + chargesAmountInCents;
}

export function isActiveContractTenantForExpectedPayment(contractTenant: {
  status: string;
  tenantProfileId: string | null;
}) {
  return contractTenant.status === "ACTIVE" && !!contractTenant.tenantProfileId;
}

export function canMarkExternalPaymentAsReceived(
  payment: ExternalPaymentReceiptEligibilityInput,
) {
  return (
    payment.provider === null &&
    payment.providerPaymentId === null &&
    (payment.status === "PLANNED" || payment.status === "PENDING")
  );
}

export function buildExternalPaymentReceivedData(paidAt: Date) {
  return {
    status: "SUCCEEDED" as const,
    paidAt,
    failedAt: null,
    failureReason: null,
  };
}

export function canTenantPayWithMockProvider(
  payment: TenantMockPaymentEligibilityInput,
) {
  const paymentCanBeProcessed =
    payment.status === "PLANNED" || payment.status === "PENDING";
  const providerCanBeMocked =
    (payment.provider === null && payment.providerPaymentId === null) ||
    payment.provider === "MOCK";

  return (
    payment.type === "RENT" && paymentCanBeProcessed && providerCanBeMocked
  );
}

export function buildMockPaymentSucceededData(
  providerPaymentId: string,
  paidAt: Date,
) {
  return {
    provider: "MOCK" as const,
    providerPaymentId,
    status: "SUCCEEDED" as const,
    paidAt,
    failedAt: null,
    failureReason: null,
  };
}

export function buildMockPaymentFailedData(
  providerPaymentId: string,
  failedAt: Date,
  failureReason: string,
) {
  return {
    provider: "MOCK" as const,
    providerPaymentId,
    status: "FAILED" as const,
    paidAt: null,
    failedAt,
    failureReason,
  };
}

export function buildExpectedRentPaymentData(
  input: ExpectedRentPaymentDataInput,
) {
  const amountInCents =
    input.amountInCents ??
    calculateRentWithChargesInCents(
      input.rentAmountInCents,
      input.chargesAmountInCents,
    );

  assertIntegerCents(amountInCents, "amountInCents");

  return {
    propertyId: input.propertyId,
    rentalContractId: input.rentalContractId,
    contractTenantId: input.contractTenantId,
    tenantProfileId: input.tenantProfileId,
    ownerProfileId: input.ownerProfileId,
    provider: null,
    providerPaymentId: null,
    type: "RENT" as const,
    status: "PLANNED" as const,
    amountInCents,
    currency: input.currency,
    dueDate: input.dueDate,
  };
}
