"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  getOwnerPaymentForReceiptGeneration,
  getOwnerRequestedReceiptForGeneration,
} from "@/server/owner/receipts";
import {
  buildRentReceiptDataFromPayment,
  canGenerateRentReceiptFromPayment,
  getMonthlyReceiptPeriodFromDueDate,
  isFullRentPayment,
} from "@/server/receipts/receipt-data";
import { entityIdSchema, paymentIdSchema } from "@/server/validation";

function readPaymentId(formData: FormData) {
  const value = formData.get("paymentId");

  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "Payment id is required.");
  }

  return paymentIdSchema.parse(value);
}

function readReceiptId(formData: FormData) {
  const value = formData.get("receiptId");

  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "Receipt id is required.");
  }

  return entityIdSchema.parse(value);
}

export async function generateOwnerRentReceiptAction(formData: FormData) {
  const paymentId = readPaymentId(formData);
  const { user, payment } =
    await getOwnerPaymentForReceiptGeneration(paymentId);
  const contractTenant = payment.contractTenant;

  if (!contractTenant) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt requires a tenant attachment.",
    );
  }

  if (!canGenerateRentReceiptFromPayment(payment)) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt can only be generated from a succeeded rent payment.",
    );
  }

  if (
    !isFullRentPayment(
      payment.amountInCents,
      contractTenant.rentShareAmountInCents,
      contractTenant.chargesShareAmountInCents,
    )
  ) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt requires the full rent and charges to be paid.",
    );
  }

  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    payment.dueDate,
  );
  const now = new Date();
  const receiptData = buildRentReceiptDataFromPayment({
    propertyId: payment.propertyId,
    rentalContractId: payment.rentalContractId,
    contractTenantId: payment.contractTenantId,
    tenantProfileId: payment.tenantProfileId,
    ownerProfileId: payment.ownerProfileId,
    dueDate: payment.dueDate,
    rentAmountInCents: contractTenant.rentShareAmountInCents,
    chargesAmountInCents: contractTenant.chargesShareAmountInCents,
    currency: payment.currency,
    requestedAt: now,
    generatedAt: now,
  });

  await prisma.$transaction(async (tx) => {
    const existingReceipt = await tx.receipt.findFirst({
      where: {
        tenantProfileId: payment.tenantProfileId,
        rentalContractId: payment.rentalContractId,
        contractTenantId: payment.contractTenantId,
        periodStart,
        periodEnd,
        type: "RENT_RECEIPT",
        status: {
          not: "CANCELED",
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReceipt) {
      throw new AppError(
        "CONFLICT",
        "A rent receipt already exists for this tenant and period.",
      );
    }

    const receipt = await tx.receipt.create({
      data: receiptData,
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "receipt.generated",
        entityType: "Receipt",
        entityId: receipt.id,
        metadata: {
          source: "owner_generate_rent_receipt",
          paymentId: payment.id,
          rentalContractId: payment.rentalContractId,
          contractTenantId: payment.contractTenantId,
        },
      },
    });
  });

  redirect(
    `/owner/properties/${payment.propertyId}/contracts/${payment.rentalContractId}`,
  );
}

export async function generateOwnerRequestedRentReceiptAction(
  formData: FormData,
) {
  const receiptId = readReceiptId(formData);
  const { user, receipt } =
    await getOwnerRequestedReceiptForGeneration(receiptId);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const updatedReceipt = await tx.receipt.updateMany({
      where: {
        id: receipt.id,
        ownerProfileId: receipt.ownerProfileId,
        type: "RENT_RECEIPT",
        status: "REQUESTED",
      },
      data: {
        status: "GENERATED",
        generatedAt: now,
        sentAt: null,
        storageKey: null,
      },
    });

    if (updatedReceipt.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This rent receipt request can no longer be generated.",
      );
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "receipt.request_generated",
        entityType: "Receipt",
        entityId: receipt.id,
        metadata: {
          source: "owner_generate_requested_receipt",
          rentalContractId: receipt.rentalContractId,
          contractTenantId: receipt.contractTenantId,
        },
      },
    });
  });

  redirect(
    `/owner/properties/${receipt.propertyId}/contracts/${receipt.rentalContractId}`,
  );
}
