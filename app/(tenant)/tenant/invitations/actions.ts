"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { entityIdSchema } from "@/server/validation/common";

const tenantDashboardInvitationAcceptSchema = z
  .object({
    confirmAccept: z.literal("on"),
    invitationId: entityIdSchema,
  })
  .strict();

function parseTenantDashboardInvitationAcceptFormData(formData: FormData) {
  const input: Record<string, FormDataEntryValue> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$ACTION_")) {
      input[key] = value;
    }
  }

  return tenantDashboardInvitationAcceptSchema.parse(input);
}

export async function acceptTenantDashboardInvitationAction(
  formData: FormData,
) {
  const input = parseTenantDashboardInvitationAcceptFormData(formData);
  const { user, tenantProfile } = await requireTenantAccess();
  const now = new Date();

  const invitation = await prisma.invitation.findFirst({
    where: {
      id: input.invitationId,
      tenantEmail: user.email,
      status: "SENT",
      expiresAt: {
        gte: now,
      },
    },
    select: {
      id: true,
      tenantEmail: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      contractTenant: {
        select: {
          id: true,
          status: true,
          tenantProfileId: true,
        },
      },
    },
  });

  if (!invitation) {
    throw new AppError("NOT_FOUND", "Invitation not found.");
  }

  if (!invitation.contractTenant) {
    throw new AppError(
      "CONFLICT",
      "This invitation is not linked to a tenant slot.",
    );
  }

  const contractTenant = invitation.contractTenant;
  const existingContractTenant = await prisma.contractTenant.findFirst({
    where: {
      rentalContractId: invitation.rentalContractId,
      tenantProfileId: tenantProfile.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (
    existingContractTenant &&
    existingContractTenant.status !== "TERMINATED"
  ) {
    throw new AppError(
      "CONFLICT",
      "Ce compte locataire est deja rattache a ce contrat.",
    );
  }

  const reusableContractTenant =
    existingContractTenant?.status === "TERMINATED"
      ? existingContractTenant
      : null;

  if (!reusableContractTenant) {
    const isCompatibleTenantProfile =
      contractTenant.tenantProfileId === null ||
      contractTenant.tenantProfileId === tenantProfile.id;

    if (contractTenant.status !== "INVITED" || !isCompatibleTenantProfile) {
      throw new AppError(
        "CONFLICT",
        "This tenant slot cannot be accepted anymore.",
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    const updatedInvitation = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        status: "SENT",
        expiresAt: {
          gte: now,
        },
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: now,
      },
    });

    if (updatedInvitation.count !== 1) {
      throw new AppError("CONFLICT", "This invitation cannot be accepted.");
    }

    const updatedContractTenant = reusableContractTenant
      ? await tx.contractTenant.updateMany({
          where: {
            id: reusableContractTenant.id,
            status: "TERMINATED",
            tenantProfileId: tenantProfile.id,
          },
          data: {
            status: "ACTIVE",
            startDate: now,
            endDate: null,
          },
        })
      : await tx.contractTenant.updateMany({
          where: {
            id: contractTenant.id,
            status: "INVITED",
            OR: [
              {
                tenantProfileId: null,
              },
              {
                tenantProfileId: tenantProfile.id,
              },
            ],
          },
          data: {
            tenantProfileId: tenantProfile.id,
            status: "ACTIVE",
          },
        });

    if (updatedContractTenant.count !== 1) {
      throw new AppError(
        "CONFLICT",
        "This tenant slot cannot be accepted anymore.",
      );
    }

    if (
      reusableContractTenant &&
      invitation.contractTenantId &&
      invitation.contractTenantId !== reusableContractTenant.id
    ) {
      await tx.contractTenant.updateMany({
        where: {
          id: invitation.contractTenantId,
          status: "INVITED",
          tenantProfileId: null,
        },
        data: {
          status: "TERMINATED",
          endDate: now,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_invitation.accepted",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: {
          source: "tenant_dashboard_accept_invitation",
          invitationId: invitation.id,
          rentalContractId: invitation.rentalContractId,
          contractTenantId: reusableContractTenant
            ? reusableContractTenant.id
            : invitation.contractTenantId,
          tenantProfileId: tenantProfile.id,
          reusedTerminatedContractTenant: reusableContractTenant !== null,
        },
      },
    });
  });

  redirect("/tenant");
}
