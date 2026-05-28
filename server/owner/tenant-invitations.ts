import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

export async function getOwnerTenantInvitationContractOptions() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();
  const now = new Date();

  const contracts = await prisma.rentalContract.findMany({
    where: {
      ownerProfileId: ownerProfile.id,
      status: "DRAFT",
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      property: {
        status: {
          not: "ARCHIVED",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      propertyId: true,
      status: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          city: true,
          status: true,
        },
      },
      contractTenants: {
        where: {
          status: "ACTIVE",
        },
        take: 1,
        select: {
          id: true,
        },
      },
      invitations: {
        where: {
          status: "SENT",
          expiresAt: {
            gte: now,
          },
        },
        take: 1,
        select: {
          id: true,
          tenantEmail: true,
          expiresAt: true,
        },
      },
    },
  });

  return contracts.filter(
    (contract) =>
      contract.contractTenants.length === 0 &&
      contract.invitations.length === 0,
  );
}
