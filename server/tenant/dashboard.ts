import { requireRole } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export async function getTenantDashboardData() {
  const user = await requireRole(["TENANT", "ADMIN"]);

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
    },
  });

  if (!tenantProfile) {
    return {
      user,
      tenantProfile: null,
      stats: null,
      contractTenants: [],
      recentPayments: [],
      recentReceipts: [],
    };
  }

  const { start, end } = getCurrentMonthRange();
  const tenantFilter = { tenantProfileId: tenantProfile.id };
  const currentMonthDueFilter = {
    ...tenantFilter,
    dueDate: {
      gte: start,
      lt: end,
    },
  };

  const [
    activeContractTenants,
    currentMonthPayments,
    currentMonthSucceededPayments,
    currentMonthFailedPayments,
    paidAggregate,
    acceptedMandates,
    availableReceipts,
    pendingInvitations,
    contractTenants,
    recentPayments,
    recentReceipts,
  ] = await Promise.all([
    prisma.contractTenant.count({
      where: {
        ...tenantFilter,
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
        ...tenantFilter,
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
    prisma.paymentMandate.count({
      where: {
        ...tenantFilter,
        status: "ACCEPTED",
      },
    }),
    prisma.receipt.count({
      where: {
        ...tenantFilter,
        status: {
          in: ["GENERATED", "SENT"],
        },
      },
    }),
    prisma.invitation.count({
      where: {
        tenantEmail: user.email,
        status: "SENT",
        expiresAt: {
          gte: new Date(),
        },
      },
    }),
    prisma.contractTenant.findMany({
      where: tenantFilter,
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        roomLabel: true,
        rentShareAmountInCents: true,
        chargesShareAmountInCents: true,
        currency: true,
        status: true,
        rentalContract: {
          select: {
            contractType: true,
            paymentDayOfMonth: true,
            property: {
              select: {
                name: true,
                city: true,
                isColocation: true,
              },
            },
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: tenantFilter,
      orderBy: {
        dueDate: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        paidAt: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: tenantFilter,
      orderBy: {
        periodStart: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        totalAmountInCents: true,
        currency: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    user,
    tenantProfile,
    stats: {
      activeContractTenants,
      currentMonthPayments,
      currentMonthSucceededPayments,
      currentMonthFailedPayments,
      paidAmountInCents: paidAggregate._sum.amountInCents ?? 0,
      acceptedMandates,
      availableReceipts,
      pendingInvitations,
    },
    contractTenants,
    recentPayments,
    recentReceipts,
  };
}
