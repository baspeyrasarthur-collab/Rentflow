"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { parseOwnerCentralExpectedRentPaymentFormData } from "@/server/owner/payment-form";
import {
  getOwnerContractTenantForCentralExpectedPayment,
  getOwnerExternalPaymentForReceipt,
} from "@/server/owner/payments";
import {
  buildExpectedRentPaymentData,
  buildExternalPaymentReceivedData,
} from "@/server/payments/payment-data";
import { paymentIdSchema } from "@/server/validation";

function readPaymentId(formData: FormData) {
  const value = formData.get("paymentId");

  if (typeof value !== "string") {
    throw new AppError("BAD_REQUEST", "Payment id is required.");
  }

  return paymentIdSchema.parse(value);
}

export async function markOwnerExternalPaymentReceivedAction(
  formData: FormData,
) {
  const paymentId = readPaymentId(formData);
  const { user, payment } = await getOwnerExternalPaymentForReceipt(paymentId);
  const paidAt = new Date();

  await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: {
        id: payment.id,
        ownerProfileId: payment.ownerProfileId,
        provider: null,
        providerPaymentId: null,
        status: {
          in: ["PLANNED", "PENDING"],
        },
      },
      data: buildExternalPaymentReceivedData(paidAt),
    });

    if (result.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This external payment can no longer be marked as received.",
      );
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "payment.external_received",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          source: "owner_mark_external_payment_received",
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

export async function createOwnerCentralExpectedRentPaymentAction(
  formData: FormData,
) {
  const input = parseOwnerCentralExpectedRentPaymentFormData(formData);
  const { user, ownerProfile, contractTenant } =
    await getOwnerContractTenantForCentralExpectedPayment(input);
  const tenantProfileId = contractTenant.tenantProfileId;

  if (!tenantProfileId) {
    throw new AppError(
      "CONFLICT",
      "An expected payment requires a linked tenant profile.",
    );
  }

  const paymentData = buildExpectedRentPaymentData({
    propertyId: input.propertyId,
    rentalContractId: input.rentalContractId,
    contractTenantId: contractTenant.id,
    tenantProfileId,
    ownerProfileId: ownerProfile.id,
    rentAmountInCents: contractTenant.rentShareAmountInCents,
    chargesAmountInCents: contractTenant.chargesShareAmountInCents,
    amountInCents: input.amountInCents,
    currency: contractTenant.rentalContract.currency ?? contractTenant.currency,
    dueDate: input.dueDate,
  });

  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: paymentData,
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "payment.expected_created",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          source: "owner_central_create_expected_rent_payment",
          propertyId: input.propertyId,
          rentalContractId: input.rentalContractId,
          contractTenantId: contractTenant.id,
        },
      },
    });
  });

  redirect("/owner/payments");
}
