"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { entityIdSchema } from "@/server/validation/common";

const tenantContractTerminationRequestSchema = z
  .object({
    confirmation: z.literal("DEMANDER LA FIN"),
    contractTenantId: entityIdSchema,
  })
  .strict();

function parseTenantContractTerminationRequestFormData(formData: FormData) {
  const input: Record<string, FormDataEntryValue> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$ACTION_")) {
      input[key] = value;
    }
  }

  return tenantContractTerminationRequestSchema.parse(input);
}

export async function requestTenantContractTerminationAction(
  formData: FormData,
) {
  const input = parseTenantContractTerminationRequestFormData(formData);
  const { user, tenantProfile } = await requireTenantAccess();

  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      id: input.contractTenantId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      rentalContractId: true,
      status: true,
      tenantProfileId: true,
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No tenant contract exists for this tenant profile.",
    );
  }

  if (contractTenant.status === "TERMINATION_REQUESTED") {
    throw new AppError(
      "CONFLICT",
      "A termination request already exists for this tenant contract.",
    );
  }

  if (contractTenant.status !== "ACTIVE") {
    throw new AppError(
      "CONFLICT",
      "Only an active tenant contract can receive a termination request.",
    );
  }

  await prisma.$transaction(async (tx) => {
    const updatedContractTenant = await tx.contractTenant.updateMany({
      where: {
        id: contractTenant.id,
        tenantProfileId: tenantProfile.id,
        status: "ACTIVE",
      },
      data: {
        status: "TERMINATION_REQUESTED",
      },
    });

    if (updatedContractTenant.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This tenant contract can no longer receive a termination request.",
      );
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "contract_tenant.termination_requested",
        entityType: "ContractTenant",
        entityId: contractTenant.id,
        metadata: {
          source: "tenant_request_contract_termination",
          rentalContractId: contractTenant.rentalContractId,
          tenantProfileId: tenantProfile.id,
        },
      },
    });
  });

  redirect("/tenant");
}
