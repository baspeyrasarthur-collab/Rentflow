import { requireRole } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

export async function getAdminDashboardData() {
  await requireRole(["ADMIN"]);

  const [
    totalUsers,
    ownerUsers,
    tenantUsers,
    totalProperties,
    activeProperties,
    activeContracts,
    totalPayments,
    succeededPayments,
    failedPayments,
    collectedAggregate,
    commissionAggregate,
    acceptedMandates,
    availableReceipts,
    webhookIssues,
    identityReviews,
    recentUsers,
    recentProperties,
    recentPayments,
    recentWebhooks,
    identityVerificationsToReview,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "OWNER" } }),
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.rentalContract.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCEEDED" } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountInCents: true },
    }),
    prisma.platformCommission.aggregate({
      where: { status: "CHARGED" },
      _sum: { amountInCents: true },
    }),
    prisma.paymentMandate.count({ where: { status: "ACCEPTED" } }),
    prisma.receipt.count({ where: { status: { in: ["GENERATED", "SENT"] } } }),
    prisma.webhookEvent.count({
      where: {
        OR: [{ processedAt: null }, { failedAt: { not: null } }],
      },
    }),
    prisma.identityVerification.count({
      where: { status: { in: ["PENDING", "REQUIRES_REVIEW"] } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
      },
    }),
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
        isColocation: true,
        ownerProfile: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.payment.findMany({
      orderBy: { dueDate: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        ownerProfile: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        tenantProfile: {
          select: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        provider: true,
        eventType: true,
        processedAt: true,
        failedAt: true,
      },
    }),
    prisma.identityVerification.findMany({
      where: { status: { in: ["PENDING", "REQUIRES_REVIEW"] } },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        provider: true,
        status: true,
        startedAt: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      ownerUsers,
      tenantUsers,
      totalProperties,
      activeProperties,
      activeContracts,
      totalPayments,
      succeededPayments,
      failedPayments,
      collectedAmountInCents: collectedAggregate._sum.amountInCents ?? 0,
      commissionAmountInCents: commissionAggregate._sum.amountInCents ?? 0,
      acceptedMandates,
      availableReceipts,
      webhookIssues,
      identityReviews,
    },
    recentUsers,
    recentProperties,
    recentPayments,
    recentWebhooks,
    identityVerificationsToReview,
  };
}
