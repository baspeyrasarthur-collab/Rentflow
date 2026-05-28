"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  buildRequestedRentReceiptDataFromPayment,
  canRequestRentReceiptFromPayment,
  getMonthlyReceiptPeriodFromDueDate,
  isFullRentPayment,
} from "@/server/receipts/receipt-data";
import {
  getTenantPaymentForReceiptRequest,
  getTenantReceiptForSeenAction,
} from "@/server/tenant/receipts";
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

export async function requestTenantRentReceiptAction(formData: FormData) {
  const paymentId = readPaymentId(formData);
  const { user, payment } = await getTenantPaymentForReceiptRequest(paymentId);
  const contractTenant = payment.contractTenant;

  if (!contractTenant) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt request requires a tenant attachment.",
    );
  }

  if (!canRequestRentReceiptFromPayment(payment)) {
    throw new AppError(
      "CONFLICT",
      "A rent receipt request requires a succeeded rent payment.",
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
      "A rent receipt request requires the full rent and charges to be paid.",
    );
  }

  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    payment.dueDate,
  );
  const now = new Date();
  const receiptData = buildRequestedRentReceiptDataFromPayment({
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
          in: ["REQUESTED", "GENERATED", "SENT"],
        },
      },
      select: {
        id: true,
      },
    });

    if (existingReceipt) {
      throw new AppError(
        "CONFLICT",
        "A rent receipt request or receipt already exists for this period.",
      );
    }

    const receipt = await tx.receipt.create({
      data: receiptData,
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "receipt.requested",
        entityType: "Receipt",
        entityId: receipt.id,
        metadata: {
          source: "tenant_request_rent_receipt",
          paymentId: payment.id,
          rentalContractId: payment.rentalContractId,
          contractTenantId: payment.contractTenantId,
        },
      },
    });
  });

  redirect("/tenant");
}

export async function markTenantReceiptAsSeenAction(formData: FormData) {
  const receiptId = readReceiptId(formData);
  const { user, receipt } = await getTenantReceiptForSeenAction(receiptId);

  const existingSeenLog = await prisma.auditLog.findFirst({
    where: {
      userId: user.id,
      action: "receipt.seen_by_tenant",
      entityType: "Receipt",
      entityId: receipt.id,
    },
    select: {
      id: true,
    },
  });

  if (!existingSeenLog) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "receipt.seen_by_tenant",
        entityType: "Receipt",
        entityId: receipt.id,
        metadata: {
          source: "tenant_mark_receipt_seen",
          rentalContractId: receipt.rentalContractId,
          contractTenantId: receipt.contractTenantId,
          tenantProfileId: receipt.tenantProfileId,
        },
      },
    });
  }

  redirect("/tenant");
}
