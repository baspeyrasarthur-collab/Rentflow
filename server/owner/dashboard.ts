import { requireRole } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export async function getOwnerDashboardData() {
  const user = await requireRole(["OWNER", "ADMIN"]);

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      billingName: true,
    },
  });

  if (!ownerProfile) {
    return {
      user,
      ownerProfile: null,
      stats: null,
      properties: [],
    };
  }

  const { start, end } = getCurrentMonthRange();
  const ownerFilter = { ownerProfileId: ownerProfile.id };
  const currentMonthDueFilter = {
    ...ownerFilter,
    dueDate: {
      gte: start,
      lt: end,
    },
  };

  const [
    totalProperties,
    activeProperties,
    activeContracts,
    currentMonthPayments,
    currentMonthSucceededPayments,
    currentMonthFailedPayments,
    collectedAggregate,
    commissionAggregate,
    properties,
  ] = await Promise.all([
    prisma.property.count({
      where: ownerFilter,
    }),
    prisma.property.count({
      where: {
        ...ownerFilter,
        status: "ACTIVE",
      },
    }),
    prisma.rentalContract.count({
      where: {
        ...ownerFilter,
        status: "ACTIVE",
      },
    }),
    prisma.payment.count({
      where: currentMonthDueFilter,
    }),
    prisma.payment.count({
      where: {
        ...currentMonthDueFilter,
        status: "SUCCEEDED",
      },
    }),
    prisma.payment.count({
      where: {
        ...currentMonthDueFilter,
        status: "FAILED",
      },
    }),
    prisma.payment.aggregate({
      where: {
        ...ownerFilter,
        status: "SUCCEEDED",
        paidAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amountInCents: true,
      },
    }),
    prisma.platformCommission.aggregate({
      where: {
        ...ownerFilter,
        status: "CHARGED",
        chargedAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amountInCents: true,
      },
    }),
    prisma.property.findMany({
      where: ownerFilter,
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        name: true,
        city: true,
        propertyType: true,
        status: true,
        isColocation: true,
        _count: {
          select: {
            rentalContracts: true,
            payments: true,
          },
        },
      },
    }),
  ]);

  return {
    user,
    ownerProfile,
    stats: {
      totalProperties,
      activeProperties,
      activeContracts,
      currentMonthPayments,
      currentMonthSucceededPayments,
      currentMonthFailedPayments,
      collectedAmountInCents: collectedAggregate._sum.amountInCents ?? 0,
      platformCommissionAmountInCents:
        commissionAggregate._sum.amountInCents ?? 0,
    },
    properties,
  };
}
