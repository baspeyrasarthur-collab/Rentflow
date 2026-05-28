"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOwnerAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  ownerTenantRequestRefuseSchema,
  ownerTenantRequestResolveSchema,
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

async function getOpenOwnerTenantRequest(input: {
  ownerProfileId: string;
  tenantRequestId: string;
}) {
  const tenantRequest = await prisma.tenantRequest.findFirst({
    where: {
      id: input.tenantRequestId,
      ownerProfileId: input.ownerProfileId,
    },
    select: {
      id: true,
      status: true,
      tenantProfile: {
        select: {
          userId: true,
        },
      },
      property: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!tenantRequest) {
    throw new AppError("NOT_FOUND", "Tenant request not found.");
  }

  if (tenantRequest.status !== "OPEN") {
    throw new AppError(
      "CONFLICT",
      "Only an open tenant request can be handled.",
    );
  }

  return tenantRequest;
}

export async function resolveOwnerTenantRequestAction(formData: FormData) {
  const input = parseFormDataWithSchema(
    formData,
    ownerTenantRequestResolveSchema,
  );
  const { ownerProfile, user } = await requireOwnerAccess();
  const tenantRequest = await getOpenOwnerTenantRequest({
    ownerProfileId: ownerProfile.id,
    tenantRequestId: input.tenantRequestId,
  });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const updatedTenantRequest = await tx.tenantRequest.updateMany({
      where: {
        id: tenantRequest.id,
        ownerProfileId: ownerProfile.id,
        status: "OPEN",
      },
      data: {
        status: "RESOLVED_BY_OWNER",
        ownerResponse: input.ownerResponse,
        resolvedAt: now,
      },
    });

    if (updatedTenantRequest.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This tenant request can no longer be handled.",
      );
    }

    await tx.notification.create({
      data: {
        userId: tenantRequest.tenantProfile.userId,
        type: "SYSTEM_ALERT",
        title: "Votre demande a ete traitee",
        body: `Votre proprietaire indique avoir traite votre demande pour ${tenantRequest.property.name}.`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_request.resolved_by_owner",
        entityType: "TenantRequest",
        entityId: tenantRequest.id,
        metadata: {
          source: "owner_resolve_tenant_request",
          ownerProfileId: ownerProfile.id,
        },
      },
    });
  });

  redirect("/owner/tenants");
}

export async function refuseOwnerTenantRequestAction(formData: FormData) {
  const input = parseFormDataWithSchema(
    formData,
    ownerTenantRequestRefuseSchema,
  );
  const { ownerProfile, user } = await requireOwnerAccess();
  const tenantRequest = await getOpenOwnerTenantRequest({
    ownerProfileId: ownerProfile.id,
    tenantRequestId: input.tenantRequestId,
  });
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const updatedTenantRequest = await tx.tenantRequest.updateMany({
      where: {
        id: tenantRequest.id,
        ownerProfileId: ownerProfile.id,
        status: "OPEN",
      },
      data: {
        status: "REFUSED_BY_OWNER",
        ownerResponse: input.ownerResponse,
        refusedAt: now,
      },
    });

    if (updatedTenantRequest.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This tenant request can no longer be handled.",
      );
    }

    await tx.notification.create({
      data: {
        userId: tenantRequest.tenantProfile.userId,
        type: "SYSTEM_ALERT",
        title: "Votre demande a ete refusee",
        body: `Votre proprietaire a refuse votre demande pour ${tenantRequest.property.name}.`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_request.refused_by_owner",
        entityType: "TenantRequest",
        entityId: tenantRequest.id,
        metadata: {
          source: "owner_refuse_tenant_request",
          ownerProfileId: ownerProfile.id,
        },
      },
    });
  });

  redirect("/owner/tenants");
}
