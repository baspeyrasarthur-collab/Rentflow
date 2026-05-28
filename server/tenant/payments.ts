import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { canTenantPayWithMockProvider } from "@/server/payments/payment-data";
import { paymentIdSchema } from "@/server/validation";

export function isActiveContractTenantForTenantPayment(contractTenant: {
  tenantProfileId: string | null;
  status: string;
}) {
  return (
    contractTenant.tenantProfileId !== null &&
    contractTenant.status === "ACTIVE"
  );
}

export function hasAcceptedMockMandateForTenantPayment(
  mandates: { provider: string; status: string }[],
) {
  return mandates.some(
    (mandate) => mandate.provider === "MOCK" && mandate.status === "ACCEPTED",
  );
}

export function canDeclareTenantExternalPayment(payment: {
  provider: string | null;
  providerPaymentId: string | null;
  type: string;
  status: string;
}) {
  return (
    payment.provider === null &&
    payment.providerPaymentId === null &&
    payment.type === "RENT" &&
    (payment.status === "PLANNED" || payment.status === "PENDING")
  );
}

export const canDeclareTenantExternalPaymentPaid =
  canDeclareTenantExternalPayment;

export async function getCurrentTenantProfileForPayments() {
  return requireTenantAccess();
}

export async function getTenantExternalPaymentForDeclaration(
  paymentId: string,
) {
  const parsedPaymentId = paymentIdSchema.parse(paymentId);
  const { user, tenantProfile } = await getCurrentTenantProfileForPayments();

  const payment = await prisma.payment.findFirst({
    where: {
      id: parsedPaymentId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      tenantProfileId: true,
      ownerProfileId: true,
      provider: true,
      providerPaymentId: true,
      type: true,
      status: true,
      ownerProfile: {
        select: {
          userId: true,
        },
      },
      property: {
        select: {
          name: true,
        },
      },
      contractTenant: {
        select: {
          id: true,
          tenantProfileId: true,
        },
      },
      declarations: {
        where: {
          tenantProfileId: tenantProfile.id,
        },
        orderBy: [
          {
            declaredAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        take: 1,
        select: {
          declarationType: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(
      "NOT_FOUND",
      "No payment exists for this tenant profile.",
    );
  }

  if (
    payment.contractTenantId &&
    (!payment.contractTenant ||
      payment.contractTenant.id !== payment.contractTenantId ||
      payment.contractTenant.tenantProfileId !== tenantProfile.id)
  ) {
    throw new AppError(
      "CONFLICT",
      "This external payment is not attached to the connected tenant.",
    );
  }

  if (!canDeclareTenantExternalPayment(payment)) {
    throw new AppError(
      "CONFLICT",
      "This payment cannot receive an external payment declaration.",
    );
  }

  if (payment.declarations?.[0]?.declarationType === "PAID_EXTERNALLY") {
    throw new AppError(
      "CONFLICT",
      "This payment has already been declared as paid externally.",
    );
  }

  return { user, tenantProfile, payment };
}

export async function getTenantPaymentForMockPayment(paymentId: string) {
  const parsedPaymentId = paymentIdSchema.parse(paymentId);
  const { user, tenantProfile } = await getCurrentTenantProfileForPayments();

  const payment = await prisma.payment.findFirst({
    where: {
      id: parsedPaymentId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      tenantProfileId: true,
      ownerProfileId: true,
      provider: true,
      providerPaymentId: true,
      type: true,
      status: true,
      amountInCents: true,
      currency: true,
      dueDate: true,
      contractTenant: {
        select: {
          id: true,
          tenantProfileId: true,
          status: true,
          paymentMandates: {
            where: {
              tenantProfileId: tenantProfile.id,
              provider: "MOCK",
              status: "ACCEPTED",
            },
            take: 1,
            select: {
              id: true,
              provider: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(
      "NOT_FOUND",
      "No payment exists for this tenant profile.",
    );
  }

  if (!payment.contractTenantId || !payment.contractTenant) {
    throw new AppError(
      "CONFLICT",
      "A mock payment requires a tenant attachment.",
    );
  }

  if (
    payment.contractTenant.tenantProfileId !== tenantProfile.id ||
    !isActiveContractTenantForTenantPayment(payment.contractTenant)
  ) {
    throw new AppError(
      "CONFLICT",
      "A mock payment requires an active tenant attachment.",
    );
  }

  if (!canTenantPayWithMockProvider(payment)) {
    throw new AppError(
      "CONFLICT",
      "This payment cannot be paid with the mock provider.",
    );
  }

  if (
    !hasAcceptedMockMandateForTenantPayment(
      payment.contractTenant.paymentMandates,
    )
  ) {
    throw new AppError(
      "CONFLICT",
      "An accepted mock mandate is required before paying with RentFlow.",
    );
  }

  return { user, tenantProfile, payment };
}
