import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

const ownerTenantSelect = {
  id: true,
  tenantProfileId: true,
  invitedEmail: true,
  invitedFirstName: true,
  invitedLastName: true,
  roomLabel: true,
  rentShareAmountInCents: true,
  chargesShareAmountInCents: true,
  currency: true,
  startDate: true,
  endDate: true,
  status: true,
  rentalContract: {
    select: {
      id: true,
      contractType: true,
      status: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      currency: true,
      property: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  },
  tenantProfile: {
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
} as const;

const ownerInvitationSelect = {
  id: true,
  tenantEmail: true,
  tenantFirstName: true,
  tenantLastName: true,
  status: true,
  expiresAt: true,
  acceptedAt: true,
  createdAt: true,
  rentalContract: {
    select: {
      id: true,
      status: true,
      property: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  },
} as const;

export async function getOwnerTenantsOverview() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  const [contractTenants, invitations, tenantRequests, contractCount] =
    await Promise.all([
      prisma.contractTenant.findMany({
        where: {
          rentalContract: {
            ownerProfileId: ownerProfile.id,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: ownerTenantSelect,
      }),
      prisma.invitation.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: ownerInvitationSelect,
      }),
      prisma.tenantRequest.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
          status: {
            in: ["OPEN", "RESOLVED_BY_OWNER", "REFUSED_BY_OWNER"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
        select: {
          id: true,
          rentalContractId: true,
          category: true,
          title: true,
          description: true,
          status: true,
          ownerResponse: true,
          createdAt: true,
          resolvedAt: true,
          refusedAt: true,
          tenantProfile: {
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
          property: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
      }),
      prisma.rentalContract.count({
        where: {
          ownerProfileId: ownerProfile.id,
        },
      }),
    ]);

  const activeTenants = contractTenants.filter(
    (contractTenant) => contractTenant.status === "ACTIVE",
  );
  const formerTenants = contractTenants.filter(
    (contractTenant) => contractTenant.status === "TERMINATED",
  );
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "SENT",
  );
  const openTenantRequests = tenantRequests.filter(
    (tenantRequest) => tenantRequest.status === "OPEN",
  );

  return {
    summary: {
      activeTenants: activeTenants.length,
      pendingInvitations: pendingInvitations.length,
      formerTenants: formerTenants.length,
      openTenantRequests: openTenantRequests.length,
      contractCount,
    },
    activeTenants,
    formerTenants,
    pendingInvitations,
    tenantRequests,
  };
}
