import type { UserRole } from "@/features/auth/types";
import { prisma } from "@/server/db/prisma";
import { hashInvitationToken } from "@/server/owner/invitation-token";
import { invitationTokenSchema } from "@/server/validation";

type InvitationAcceptanceStatus = "SENT" | "ACCEPTED" | "EXPIRED" | "CANCELED";

export type InvitationAcceptanceState = {
  status: InvitationAcceptanceStatus;
  expiresAt: Date;
};

export type ContractTenantAcceptanceState = {
  status: string;
  tenantProfileId: string | null;
};

export const invitationAcceptanceSelect = {
  id: true,
  tenantEmail: true,
  status: true,
  expiresAt: true,
  acceptedAt: true,
  canceledAt: true,
  ownerProfileId: true,
  propertyId: true,
  rentalContractId: true,
  contractTenantId: true,
  rentalContract: {
    select: {
      id: true,
      status: true,
      contractType: true,
      colocationMode: true,
      startDate: true,
      endDate: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
      property: {
        select: {
          name: true,
          city: true,
        },
      },
      ownerProfile: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  },
  contractTenant: {
    select: {
      id: true,
      tenantProfileId: true,
      status: true,
    },
  },
} as const;

export function normalizeInvitationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canAcceptInvitation(
  invitation: InvitationAcceptanceState,
  now = new Date(),
) {
  return invitation.status === "SENT" && invitation.expiresAt >= now;
}

export function canUserAcceptTenantInvitation(role: UserRole) {
  return role !== "ADMIN";
}

export function canAcceptContractTenant(
  contractTenant: ContractTenantAcceptanceState,
) {
  return (
    (contractTenant.status === "INVITED" &&
      contractTenant.tenantProfileId === null) ||
    contractTenant.status === "TERMINATED"
  );
}

export function doesConnectedEmailMatchInvitationEmail(
  userEmail: string,
  invitationEmail: string,
) {
  return (
    normalizeInvitationEmail(userEmail) ===
    normalizeInvitationEmail(invitationEmail)
  );
}

export function prepareInvitationTokenLookup(rawToken: unknown) {
  const parsed = invitationTokenSchema.safeParse(rawToken);

  if (!parsed.success) {
    return null;
  }

  return {
    tokenHash: hashInvitationToken(parsed.data),
  };
}

export async function getInvitationByRawToken(rawToken: unknown) {
  const lookup = prepareInvitationTokenLookup(rawToken);

  if (!lookup) {
    return null;
  }

  return prisma.invitation.findUnique({
    where: {
      tokenHash: lookup.tokenHash,
    },
    select: invitationAcceptanceSelect,
  });
}
