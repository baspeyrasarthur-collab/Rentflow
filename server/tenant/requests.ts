import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";

export async function getTenantRequestsPageData() {
  const { user, tenantProfile } = await requireTenantAccess();

  const [requestTargets, tenantRequests] = await Promise.all([
    prisma.contractTenant.findMany({
      where: {
        tenantProfileId: tenantProfile.id,
        status: {
          not: "TERMINATED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        rentalContractId: true,
        roomLabel: true,
        status: true,
        rentalContract: {
          select: {
            id: true,
            propertyId: true,
            property: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
      },
    }),
    prisma.tenantRequest.findMany({
      where: {
        tenantProfileId: tenantProfile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        status: true,
        ownerResponse: true,
        createdAt: true,
        resolvedAt: true,
        refusedAt: true,
        acknowledgedAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    }),
  ]);

  return {
    user,
    tenantProfile,
    requestTargets,
    tenantRequests,
  };
}
