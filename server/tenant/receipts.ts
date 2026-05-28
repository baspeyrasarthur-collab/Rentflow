import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { entityIdSchema, paymentIdSchema } from "@/server/validation";

export async function getCurrentTenantProfileForReceipts() {
  return requireTenantAccess();
}

export async function getTenantPaymentForReceiptRequest(paymentId: string) {
  const parsedPaymentId = paymentIdSchema.parse(paymentId);
  const { user, tenantProfile } = await getCurrentTenantProfileForReceipts();

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
      type: true,
      status: true,
      amountInCents: true,
      currency: true,
      dueDate: true,
      contractTenant: {
        select: {
          id: true,
          tenantProfileId: true,
          rentShareAmountInCents: true,
          chargesShareAmountInCents: true,
          currency: true,
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
      "A rent receipt request requires a tenant attachment.",
    );
  }

  if (payment.contractTenant.tenantProfileId !== tenantProfile.id) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt request requires a tenant attachment owned by this profile.",
    );
  }

  return { user, tenantProfile, payment };
}

export async function getTenantReceiptForSeenAction(receiptId: string) {
  const parsedReceiptId = entityIdSchema.parse(receiptId);
  const { user, tenantProfile } = await getCurrentTenantProfileForReceipts();

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: parsedReceiptId,
      tenantProfileId: tenantProfile.id,
      status: {
        in: ["GENERATED", "SENT"],
      },
    },
    select: {
      id: true,
      type: true,
      status: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      tenantProfileId: true,
    },
  });

  if (!receipt) {
    throw new AppError(
      "NOT_FOUND",
      "No available receipt exists for this tenant profile.",
    );
  }

  return { user, tenantProfile, receipt };
}
