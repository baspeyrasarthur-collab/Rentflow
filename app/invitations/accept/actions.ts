"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  canAcceptContractTenant,
  canAcceptInvitation,
  canUserAcceptTenantInvitation,
  doesConnectedEmailMatchInvitationEmail,
  getInvitationByRawToken,
} from "@/server/invitations/acceptance";
import { invitationTokenSchema } from "@/server/validation";

const tenantInvitationAcceptSchema = z
  .object({
    confirmAccept: z.literal("on"),
    token: invitationTokenSchema,
  })
  .strict();

function parseTenantInvitationAcceptFormData(formData: FormData) {
  const input: Record<string, FormDataEntryValue> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("$ACTION_")) {
      input[key] = value;
    }
  }

  return tenantInvitationAcceptSchema.parse(input);
}

export async function acceptTenantInvitationAction(formData: FormData) {
  const input = parseTenantInvitationAcceptFormData(formData);

  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication is required.");
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      disabledAt: true,
      ownerProfile: {
        select: {
          id: true,
        },
      },
      tenantProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "No RentFlow user exists for this session.",
    );
  }

  if (user.disabledAt) {
    throw new AppError("FORBIDDEN", "This account cannot accept invitations.");
  }

  if (!canUserAcceptTenantInvitation(user.role)) {
    throw new AppError(
      "FORBIDDEN",
      "Admin accounts cannot accept tenant invitations.",
    );
  }

  const invitation = await getInvitationByRawToken(input.token);

  if (!invitation) {
    throw new AppError("NOT_FOUND", "Invitation not found.");
  }

  const now = new Date();

  if (!canAcceptInvitation(invitation, now)) {
    throw new AppError("CONFLICT", "This invitation cannot be accepted.");
  }

  if (
    !doesConnectedEmailMatchInvitationEmail(user.email, invitation.tenantEmail)
  ) {
    throw new AppError(
      "FORBIDDEN",
      "The connected account email does not match this invitation.",
    );
  }

  if (!invitation.contractTenant) {
    throw new AppError(
      "CONFLICT",
      "This invitation is not linked to a tenant slot.",
    );
  }

  if (!canAcceptContractTenant(invitation.contractTenant)) {
    throw new AppError(
      "CONFLICT",
      "This tenant slot cannot be accepted anymore.",
    );
  }

  const contractTenant = invitation.contractTenant;

  await prisma.$transaction(async (tx) => {
    let tenantProfile = user.tenantProfile;
    let createdTenantProfile = false;

    if (!tenantProfile) {
      const existingTenantProfile = await tx.tenantProfile.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      if (existingTenantProfile) {
        tenantProfile = existingTenantProfile;
      } else {
        tenantProfile = await tx.tenantProfile.create({
          data: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        });
        createdTenantProfile = true;
      }
    }

    const existingContractTenant = await tx.contractTenant.findFirst({
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
            tenantProfileId: null,
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
          source: "tenant_accept_invitation",
          invitationId: invitation.id,
          rentalContractId: invitation.rentalContractId,
          contractTenantId: reusableContractTenant
            ? reusableContractTenant.id
            : invitation.contractTenantId,
          tenantProfileId: tenantProfile.id,
          createdTenantProfile,
          reusedTerminatedContractTenant: reusableContractTenant !== null,
        },
      },
    });
  });

  redirect("/tenant");
}
