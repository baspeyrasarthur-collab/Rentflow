import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

const ownerReceiptOverviewSelect = {
  id: true,
  propertyId: true,
  rentalContractId: true,
  contractTenantId: true,
  type: true,
  periodStart: true,
  periodEnd: true,
  rentAmountInCents: true,
  chargesAmountInCents: true,
  totalAmountInCents: true,
  currency: true,
  status: true,
  requestedAt: true,
  generatedAt: true,
  sentAt: true,
  property: {
    select: {
      id: true,
      name: true,
      city: true,
    },
  },
  rentalContract: {
    select: {
      id: true,
      propertyId: true,
      status: true,
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

export async function getOwnerReceiptsOverview() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  const [receipts, requestedCount, generatedCount, sentCount, propertyRefs] =
    await Promise.all([
      prisma.receipt.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
          status: {
            not: "CANCELED",
          },
        },
        orderBy: {
          periodStart: "desc",
        },
        take: 40,
        select: ownerReceiptOverviewSelect,
      }),
      prisma.receipt.count({
        where: {
          ownerProfileId: ownerProfile.id,
          status: "REQUESTED",
        },
      }),
      prisma.receipt.count({
        where: {
          ownerProfileId: ownerProfile.id,
          status: "GENERATED",
        },
      }),
      prisma.receipt.count({
        where: {
          ownerProfileId: ownerProfile.id,
          status: "SENT",
        },
      }),
      prisma.receipt.findMany({
        where: {
          ownerProfileId: ownerProfile.id,
          status: {
            not: "CANCELED",
          },
        },
        select: {
          propertyId: true,
        },
      }),
    ]);

  return {
    summary: {
      requestedReceipts: requestedCount,
      generatedReceipts: generatedCount,
      sentReceipts: sentCount,
      propertiesWithReceipts: new Set(
        propertyRefs.map((receipt) => receipt.propertyId),
      ).size,
    },
    requestedReceipts: receipts.filter(
      (receipt) => receipt.status === "REQUESTED",
    ),
    availableReceipts: receipts.filter(
      (receipt) => receipt.status === "GENERATED" || receipt.status === "SENT",
    ),
  };
}
