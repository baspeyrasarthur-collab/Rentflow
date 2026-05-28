"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getPaymentProvider } from "@/server/payments";
import {
  buildAcceptedMockMandateData,
  getTenantContractForMandate,
  parseContractTenantId,
} from "@/server/tenant/mandates";

export async function acceptMockMandateAction(formData: FormData) {
  const contractTenantId = parseContractTenantId(
    formData.get("contractTenantId"),
  );
  const { user, tenantProfile, contractTenant, existingMandate } =
    await getTenantContractForMandate(contractTenantId);

  if (existingMandate?.status === "ACCEPTED") {
    redirect("/tenant");
  }

  const paymentProvider = getPaymentProvider();
  const providerMandate =
    existingMandate?.status === "CREATED"
      ? await paymentProvider.acceptMandate(existingMandate.providerMandateId)
      : await paymentProvider
          .createMandate({
            tenantId: tenantProfile.id,
            rentalContractId: contractTenant.rentalContractId,
            contractTenantId: contractTenant.id,
          })
          .then((mandate) =>
            paymentProvider.acceptMandate(mandate.providerMandateId),
          );

  if (providerMandate.provider !== "MOCK") {
    throw new AppError(
      "CONFLICT",
      "Only the mock payment provider is enabled for this step.",
    );
  }

  const acceptedAt = new Date();

  await prisma.$transaction(async (tx) => {
    const activeMandate = await tx.paymentMandate.findFirst({
      where: {
        tenantProfileId: tenantProfile.id,
        contractTenantId: contractTenant.id,
        status: {
          in: ["CREATED", "ACCEPTED"],
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (activeMandate?.status === "ACCEPTED") {
      return;
    }

    const mandateData = buildAcceptedMockMandateData({
      tenantProfileId: tenantProfile.id,
      rentalContractId: contractTenant.rentalContractId,
      contractTenantId: contractTenant.id,
      providerMandateId: providerMandate.providerMandateId,
      acceptedAt,
    });

    const mandate = activeMandate
      ? await tx.paymentMandate.update({
          where: {
            id: activeMandate.id,
          },
          data: {
            provider: mandateData.provider,
            providerMandateId: mandateData.providerMandateId,
            status: mandateData.status,
            ibanLast4: mandateData.ibanLast4,
            acceptedAt: mandateData.acceptedAt,
          },
        })
      : await tx.paymentMandate.create({
          data: mandateData,
        });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "payment_mandate.accepted",
        entityType: "PaymentMandate",
        entityId: mandate.id,
        metadata: {
          source: "tenant_accept_mock_mandate",
          rentalContractId: contractTenant.rentalContractId,
          contractTenantId: contractTenant.id,
        },
      },
    });
  });

  redirect("/tenant");
}
