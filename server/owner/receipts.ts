import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { entityIdSchema, paymentIdSchema } from "@/server/validation";

export function canGenerateRequestedRentReceipt(receipt: {
  type: string;
  status: string;
}) {
  return receipt.type === "RENT_RECEIPT" && receipt.status === "REQUESTED";
}

export async function getOwnerPaymentForReceiptGeneration(paymentId: string) {
  const parsedPaymentId = paymentIdSchema.parse(paymentId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const payment = await prisma.payment.findFirst({
    where: {
      id: parsedPaymentId,
      ownerProfileId: ownerProfile.id,
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
      "No payment exists for this owner profile.",
    );
  }

  if (!payment.contractTenantId || !payment.contractTenant) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt requires a tenant attachment.",
    );
  }

  return { user, ownerProfile, payment };
}

export async function getOwnerRequestedReceiptForGeneration(receiptId: string) {
  const parsedReceiptId = entityIdSchema.parse(receiptId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const receipt = await prisma.receipt.findFirst({
    where: {
      id: parsedReceiptId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      tenantProfileId: true,
      ownerProfileId: true,
      periodStart: true,
      periodEnd: true,
      rentAmountInCents: true,
      chargesAmountInCents: true,
      totalAmountInCents: true,
      currency: true,
      status: true,
      type: true,
    },
  });

  if (!receipt) {
    throw new AppError(
      "NOT_FOUND",
      "No receipt request exists for this owner profile.",
    );
  }

  if (!canGenerateRequestedRentReceipt(receipt)) {
    throw new AppError(
      "CONFLICT",
      "Only requested rent receipts can be generated from this action.",
    );
  }

  return { user, ownerProfile, receipt };
}
