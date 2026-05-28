"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  tenantRequestAcknowledgeSchema,
  tenantRequestCreateSchema,
} from "@/server/validation/tenant-request";

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

async function getTenantRequestTarget(input: {
  contractTenantId?: string;
  propertyId?: string;
  rentalContractId?: string;
  tenantProfileId: string;
}) {
  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      ...(input.contractTenantId ? { id: input.contractTenantId } : {}),
      tenantProfileId: input.tenantProfileId,
      status: {
        not: "TERMINATED",
      },
      rentalContract: {
        ...(input.rentalContractId ? { id: input.rentalContractId } : {}),
        ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      },
    },
    select: {
      id: true,
      rentalContractId: true,
      rentalContract: {
        select: {
          id: true,
          ownerProfileId: true,
          propertyId: true,
          property: {
            select: {
              name: true,
            },
          },
          ownerProfile: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No active tenant attachment exists for this request target.",
    );
  }

  return contractTenant;
}

export async function createTenantRequestAction(formData: FormData) {
  const input = parseFormDataWithSchema(formData, tenantRequestCreateSchema);
  const { tenantProfile, user } = await requireTenantAccess();
  const target = await getTenantRequestTarget({
    contractTenantId: input.contractTenantId,
    propertyId: input.propertyId,
    rentalContractId: input.rentalContractId,
    tenantProfileId: tenantProfile.id,
  });

  await prisma.$transaction(async (tx) => {
    const tenantRequest = await tx.tenantRequest.create({
      data: {
        propertyId: target.rentalContract.propertyId,
        rentalContractId: target.rentalContractId,
        contractTenantId: target.id,
        tenantProfileId: tenantProfile.id,
        ownerProfileId: target.rentalContract.ownerProfileId,
        category: input.category,
        title: input.title,
        description: input.description,
        status: "OPEN",
      },
      select: {
        id: true,
      },
    });

    await tx.notification.create({
      data: {
        userId: target.rentalContract.ownerProfile.userId,
        type: "SYSTEM_ALERT",
        title: "Nouvelle demande locataire",
        body: `Nouvelle demande de votre locataire pour ${target.rentalContract.property.name}.`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_request.created",
        entityType: "TenantRequest",
        entityId: tenantRequest.id,
        metadata: {
          source: "tenant_create_request",
          propertyId: target.rentalContract.propertyId,
          rentalContractId: target.rentalContractId,
          contractTenantId: target.id,
        },
      },
    });
  });

  redirect("/tenant/requests");
}

async function acknowledgeTenantRequest(
  formData: FormData,
  expectedStatus: "RESOLVED_BY_OWNER" | "REFUSED_BY_OWNER",
) {
  const input = parseFormDataWithSchema(
    formData,
    tenantRequestAcknowledgeSchema,
  );
  const { tenantProfile, user } = await requireTenantAccess();
  const now = new Date();

  const tenantRequest = await prisma.tenantRequest.findFirst({
    where: {
      id: input.tenantRequestId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!tenantRequest) {
    throw new AppError("NOT_FOUND", "Tenant request not found.");
  }

  if (tenantRequest.status !== expectedStatus) {
    throw new AppError("CONFLICT", "This request cannot be acknowledged.");
  }

  await prisma.$transaction(async (tx) => {
    const updatedTenantRequest = await tx.tenantRequest.updateMany({
      where: {
        id: tenantRequest.id,
        tenantProfileId: tenantProfile.id,
        status: expectedStatus,
      },
      data: {
        status: "ACKNOWLEDGED_BY_TENANT",
        acknowledgedAt: now,
      },
    });

    if (updatedTenantRequest.count !== 1) {
      throw new AppError("CONFLICT", "This request cannot be acknowledged.");
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_request.acknowledged_by_tenant",
        entityType: "TenantRequest",
        entityId: tenantRequest.id,
        metadata: {
          source: "tenant_acknowledge_request",
          expectedStatus,
          tenantProfileId: tenantProfile.id,
        },
      },
    });
  });

  redirect(input.returnTo ?? "/tenant");
}

export async function acknowledgeResolvedTenantRequestAction(
  formData: FormData,
) {
  await acknowledgeTenantRequest(formData, "RESOLVED_BY_OWNER");
}

export async function acknowledgeRefusedTenantRequestAction(
  formData: FormData,
) {
  await acknowledgeTenantRequest(formData, "REFUSED_BY_OWNER");
}
