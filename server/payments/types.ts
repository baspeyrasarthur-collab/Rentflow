import type {
  MandateStatus as PrismaMandateStatus,
  PaymentProviderName as PrismaPaymentProviderName,
  PaymentStatus as PrismaPaymentStatus,
  PaymentType as PrismaPaymentType,
} from "@/lib/generated/prisma/enums";

export type PaymentProviderName = PrismaPaymentProviderName;

export type PaymentType = PrismaPaymentType;

export type ProviderMandateStatus = PrismaMandateStatus;

export type ProviderPaymentStatus = PrismaPaymentStatus;

export type CreateMandateInput = {
  tenantId: string;
  rentalContractId: string;
  contractTenantId?: string;
};

export type CreatePaymentInput = {
  tenantId: string;
  ownerId: string;
  rentalContractId: string;
  contractTenantId?: string;
  type: PaymentType;
  amountInCents: number;
  currency: string;
  dueDate: Date;
};

export type ProviderMandate = {
  provider: PaymentProviderName;
  providerMandateId: string;
  status: ProviderMandateStatus;
  ibanLast4?: string;
};

export type ProviderPayment = {
  provider: PaymentProviderName;
  providerPaymentId: string;
  status: ProviderPaymentStatus;
};

export type MarkPaymentFailedInput = {
  providerPaymentId: string;
  failureReason: string;
};

export type PaymentProvider = {
  createMandate(input: CreateMandateInput): Promise<ProviderMandate>;
  acceptMandate(providerMandateId: string): Promise<ProviderMandate>;
  createPayment(input: CreatePaymentInput): Promise<ProviderPayment>;
  markPaymentSucceeded(providerPaymentId: string): Promise<ProviderPayment>;
  markPaymentFailed(input: MarkPaymentFailedInput): Promise<ProviderPayment>;
};
