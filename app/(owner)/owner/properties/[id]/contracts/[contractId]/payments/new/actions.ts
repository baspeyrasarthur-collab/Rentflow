"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { parseOwnerExpectedRentPaymentFormData } from "@/server/owner/payment-form";
import { getOwnerContractTenantForExpectedPayment } from "@/server/owner/payments";
import { buildExpectedRentPaymentData } from "@/server/payments/payment-data";
import { contractIdSchema, propertyIdSchema } from "@/server/validation";

export async function createOwnerExpectedRentPaymentAction(
  propertyId: string,
  contractId: string,
  formData: FormData,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const parsedContractId = contractIdSchema.parse(contractId);
  const input = parseOwnerExpectedRentPaymentFormData(formData);
  const { user, ownerProfile, contractTenant } =
    await getOwnerContractTenantForExpectedPayment(input.contractTenantId);

  if (
    contractTenant.rentalContractId !== parsedContractId ||
    contractTenant.rentalContract.propertyId !== parsedPropertyId ||
    contractTenant.rentalContract.ownerProfileId !== ownerProfile.id ||
    contractTenant.rentalContract.property.ownerProfileId !== ownerProfile.id
  ) {
    throw new AppError(
      "NOT_FOUND",
      "No tenant attachment exists for this owner contract.",
    );
  }

  const tenantProfileId = contractTenant.tenantProfileId;

  if (!tenantProfileId) {
    throw new AppError(
      "CONFLICT",
      "An expected payment requires a linked tenant profile.",
    );
  }

  const paymentData = buildExpectedRentPaymentData({
    propertyId: parsedPropertyId,
    rentalContractId: parsedContractId,
    contractTenantId: contractTenant.id,
    tenantProfileId,
    ownerProfileId: ownerProfile.id,
    rentAmountInCents: contractTenant.rentShareAmountInCents,
    chargesAmountInCents: contractTenant.chargesShareAmountInCents,
    amountInCents: input.amountInCents,
    currency: input.currency ?? contractTenant.currency,
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
          source: "owner_create_expected_rent_payment",
          rentalContractId: parsedContractId,
          contractTenantId: contractTenant.id,
        },
      },
    });
  });

  redirect(
    `/owner/properties/${parsedPropertyId}/contracts/${parsedContractId}`,
  );
}
