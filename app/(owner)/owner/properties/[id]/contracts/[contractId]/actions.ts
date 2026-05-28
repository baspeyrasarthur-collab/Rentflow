"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { entityIdSchema } from "@/server/validation/common";

const ownerConfirmContractTenantTerminationSchema = z
  .object({
    confirmTerminationRequest: z.literal("on"),
    contractTenantId: entityIdSchema,
  })
  .strict();

const ownerTerminateContractTenantSchema = z
  .object({
    confirmation: z.literal("TERMINER"),
    contractTenantId: entityIdSchema,
  })
  .strict();

function parseFormDataWithSchema<TSchema extends z.ZodType>(
  formData: FormData,
  schema: TSchema,
) {
  const input: Record<string, FormDataEntryValue> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$ACTION_")) {
      input[key] = value;
    }
  }

  return schema.parse(input) as z.infer<TSchema>;
}

async function getOwnerContractTenantForTermination(contractTenantId: string) {
  const { ownerProfile, user } = await requireOwnerAccess();
  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      id: contractTenantId,
      rentalContract: {
        ownerProfileId: ownerProfile.id,
      },
    },
    select: {
      id: true,
      rentalContractId: true,
      tenantProfileId: true,
      status: true,
      rentalContract: {
        select: {
          id: true,
          propertyId: true,
          ownerProfileId: true,
          status: true,
          property: {
            select: {
              name: true,
            },
          },
        },
      },
      tenantProfile: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No tenant attachment exists for this owner contract.",
    );
  }

  if (!contractTenant.tenantProfileId || !contractTenant.tenantProfile) {
    throw new AppError(
      "CONFLICT",
      "This tenant attachment is not linked to a tenant profile.",
    );
  }

  return { contractTenant, ownerProfile, user };
}

function buildContractDetailRedirect(contractTenant: {
  rentalContract: {
    id: string;
    propertyId: string;
  };
}) {
  return `/owner/properties/${contractTenant.rentalContract.propertyId}/contracts/${contractTenant.rentalContract.id}`;
}

function buildTenantNotificationBody(propertyName: string | null | undefined) {
  return propertyName
    ? `Votre proprietaire a mis fin au contrat pour ${propertyName}.`
    : "Votre proprietaire a mis fin au contrat.";
}

export async function confirmOwnerContractTenantTerminationAction(
  formData: FormData,
) {
  const input = parseFormDataWithSchema(
    formData,
    ownerConfirmContractTenantTerminationSchema,
  );
  const { contractTenant, user } = await getOwnerContractTenantForTermination(
    input.contractTenantId,
  );

  if (contractTenant.status !== "TERMINATION_REQUESTED") {
    throw new AppError(
      "CONFLICT",
      "Only a requested termination can be confirmed.",
    );
  }

  const now = new Date();
  const tenantProfileId = contractTenant.tenantProfileId;
  const tenantProfile = contractTenant.tenantProfile;

  if (!tenantProfileId || !tenantProfile) {
    throw new AppError(
      "CONFLICT",
      "This tenant attachment is not linked to a tenant profile.",
    );
  }

  const tenantUserId = tenantProfile.userId;

  await prisma.$transaction(async (tx) => {
    const updatedContractTenant = await tx.contractTenant.updateMany({
      where: {
        id: contractTenant.id,
        rentalContractId: contractTenant.rentalContractId,
        status: "TERMINATION_REQUESTED",
      },
      data: {
        status: "TERMINATED",
        endDate: now,
      },
    });

    if (updatedContractTenant.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This termination request can no longer be confirmed.",
      );
    }

    await tx.notification.create({
      data: {
        userId: tenantUserId,
        type: "RENTAL_TERMINATED",
        title: "Contrat termine",
        body: buildTenantNotificationBody(
          contractTenant.rentalContract.property.name,
        ),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "contract_tenant.termination_confirmed",
        entityType: "ContractTenant",
        entityId: contractTenant.id,
        metadata: {
          source: "owner_confirm_contract_tenant_termination",
          rentalContractId: contractTenant.rentalContractId,
          tenantProfileId,
        },
      },
    });
  });

  redirect(buildContractDetailRedirect(contractTenant));
}

export async function terminateOwnerContractTenantAction(formData: FormData) {
  const input = parseFormDataWithSchema(
    formData,
    ownerTerminateContractTenantSchema,
  );
  const { contractTenant, user } = await getOwnerContractTenantForTermination(
    input.contractTenantId,
  );

  if (contractTenant.status !== "ACTIVE") {
    throw new AppError(
      "CONFLICT",
      "Only an active tenant attachment can be terminated by the owner.",
    );
  }

  const now = new Date();
  const tenantProfileId = contractTenant.tenantProfileId;
  const tenantProfile = contractTenant.tenantProfile;

  if (!tenantProfileId || !tenantProfile) {
    throw new AppError(
      "CONFLICT",
      "This tenant attachment is not linked to a tenant profile.",
    );
  }

  const tenantUserId = tenantProfile.userId;

  await prisma.$transaction(async (tx) => {
    const updatedContractTenant = await tx.contractTenant.updateMany({
      where: {
        id: contractTenant.id,
        rentalContractId: contractTenant.rentalContractId,
        status: "ACTIVE",
      },
      data: {
        status: "TERMINATED",
        endDate: now,
      },
    });

    if (updatedContractTenant.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This tenant attachment can no longer be terminated.",
      );
    }

    await tx.notification.create({
      data: {
        userId: tenantUserId,
        type: "RENTAL_TERMINATED",
        title: "Contrat termine",
        body: buildTenantNotificationBody(
          contractTenant.rentalContract.property.name,
        ),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "contract_tenant.terminated_by_owner",
        entityType: "ContractTenant",
        entityId: contractTenant.id,
        metadata: {
          source: "owner_terminate_contract_tenant",
          rentalContractId: contractTenant.rentalContractId,
          tenantProfileId,
        },
      },
    });
  });

  redirect(buildContractDetailRedirect(contractTenant));
}
