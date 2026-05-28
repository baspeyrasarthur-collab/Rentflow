"use server";

import { redirect } from "next/navigation";

import { env } from "@/server/config/env";
import { prisma } from "@/server/db/prisma";
import { getEmailProvider } from "@/server/email";
import { AppError } from "@/server/errors";
import {
  buildInvitedContractTenantData,
  buildSentInvitationData,
  buildTenantInvitationEmail,
} from "@/server/owner/invitation-data";
import { parseOwnerTenantInvitationCreateFormData } from "@/server/owner/invitation-form";
import {
  generateInvitationToken,
  getDefaultInvitationExpiresAt,
  hashInvitationToken,
} from "@/server/owner/invitation-token";
import { getOwnerContractForInvitation } from "@/server/owner/invitations";

export async function createOwnerTenantInvitationAction(
  propertyId: string,
  contractId: string,
  formData: FormData,
) {
  const { user, ownerProfile, property, contract } =
    await getOwnerContractForInvitation(propertyId, contractId);
  const input = parseOwnerTenantInvitationCreateFormData(formData);
  const now = new Date();

  const activeInvitation = await prisma.invitation.findFirst({
    where: {
      rentalContractId: contract.id,
      status: "SENT",
      expiresAt: {
        gte: now,
      },
    },
    select: {
      id: true,
    },
  });

  if (activeInvitation) {
    throw new AppError(
      "CONFLICT",
      "An active invitation already exists for this individual contract.",
    );
  }

  const invitedUser = await prisma.user.findUnique({
    where: {
      email: input.tenantEmail,
    },
    select: {
      tenantProfile: {
        select: {
          id: true,
        },
      },
    },
  });
  const existingContractTenant = invitedUser?.tenantProfile
    ? await prisma.contractTenant.findFirst({
        where: {
          rentalContractId: contract.id,
          tenantProfileId: invitedUser.tenantProfile.id,
        },
        select: {
          id: true,
          status: true,
        },
      })
    : null;

  if (
    existingContractTenant &&
    existingContractTenant.status !== "TERMINATED"
  ) {
    throw new AppError(
      "CONFLICT",
      "Ce locataire est deja rattache a ce contrat.",
    );
  }

  const rawToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(rawToken);
  const expiresAt = getDefaultInvitationExpiresAt(now);
  const acceptUrl = new URL("/invitations/accept", env.NEXT_PUBLIC_APP_URL);
  acceptUrl.searchParams.set("token", rawToken);

  const emailInput = await prisma.$transaction(async (tx) => {
    const contractTenantId =
      existingContractTenant?.status === "TERMINATED"
        ? existingContractTenant.id
        : (
            await tx.contractTenant.create({
              data: buildInvitedContractTenantData(input, contract),
              select: {
                id: true,
              },
            })
          ).id;

    const invitation = await tx.invitation.create({
      data: buildSentInvitationData(input, {
        ownerProfileId: ownerProfile.id,
        propertyId: property.id,
        rentalContractId: contract.id,
        contractTenantId,
        tokenHash,
        expiresAt,
      }),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_invitation.created",
        entityType: "Invitation",
        entityId: invitation.id,
        metadata: {
          source: "owner_create_tenant_invitation",
          propertyId: property.id,
          rentalContractId: contract.id,
          contractTenantId,
          reusedTerminatedContractTenant:
            existingContractTenant?.status === "TERMINATED",
        },
      },
    });

    return buildTenantInvitationEmail({
      tenantEmail: input.tenantEmail,
      tenantFirstName: input.tenantFirstName,
      acceptUrl: acceptUrl.toString(),
    });
  });

  await getEmailProvider().sendEmail(emailInput);

  redirect(`/owner/properties/${property.id}/contracts/${contract.id}`);
}
