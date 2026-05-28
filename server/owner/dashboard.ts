import { requireOwnerAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";

function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

function getDashboardActionToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getRecentActivityLabel(status: string) {
  if (status === "SUCCEEDED") {
    return "Paiement confirme";
  }

  if (status === "REQUESTED") {
    return "Demande de quittance";
  }

  if (status === "GENERATED" || status === "SENT") {
    return "Quittance disponible";
  }

  return "Activite recente";
}

function getRecentInvitationActivityLabel(status: string) {
  if (status === "ACCEPTED") {
    return "Locataire rattache";
  }

  if (status === "SENT") {
    return "Locataire invite";
  }

  return "Invitation locataire";
}

export async function getOwnerDashboardData() {
  const { user, ownerProfile } = await requireOwnerAccess();

  const { start, end } = getCurrentMonthRange();
  const today = getDashboardActionToday();
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
    currentMonthExpectedAggregate,
    currentMonthRemainingAggregate,
    collectedAggregate,
    outgoingAggregate,
    declaredExternalRentPayments,
    requestedReceipts,
    overdueExternalRentPayments,
    draftProperties,
    draftContracts,
    properties,
    recentPayments,
    recentReceipts,
    recentInvitations,
    recentTenantRequests,
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
        type: "RENT",
        dueDate: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amountInCents: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        ...ownerFilter,
        type: "RENT",
        dueDate: {
          gte: start,
          lt: end,
        },
        status: {
          in: ["PLANNED", "PENDING", "PROCESSING", "FAILED", "DISPUTED"],
        },
      },
      _sum: {
        amountInCents: true,
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
    prisma.expense.aggregate({
      where: {
        dueDate: {
          gte: start,
          lt: end,
        },
        status: {
          not: "CANCELED",
        },
        property: {
          ownerProfileId: ownerProfile.id,
        },
      },
      _sum: {
        amountInCents: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        ...ownerFilter,
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: {
          not: "SUCCEEDED",
        },
        declarations: {
          some: {
            declarationType: "PAID_EXTERNALLY",
          },
        },
      },
      select: {
        id: true,
        declarations: {
          orderBy: [
            {
              declaredAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 1,
          select: {
            declarationType: true,
          },
        },
      },
    }),
    prisma.receipt.count({
      where: {
        ...ownerFilter,
        status: "REQUESTED",
      },
    }),
    prisma.payment.count({
      where: {
        ...ownerFilter,
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        dueDate: {
          lt: today,
        },
        status: {
          notIn: ["SUCCEEDED", "CANCELED", "REFUNDED"],
        },
      },
    }),
    prisma.property.count({
      where: {
        ...ownerFilter,
        status: "DRAFT",
      },
    }),
    prisma.rentalContract.count({
      where: {
        ...ownerFilter,
        status: "DRAFT",
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
        imageUrl: true,
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
    prisma.payment.findMany({
      where: {
        ...ownerFilter,
        type: "RENT",
        OR: [
          {
            dueDate: {
              gte: start,
              lt: end,
            },
          },
          {
            paidAt: {
              gte: start,
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        status: true,
        amountInCents: true,
        dueDate: true,
        updatedAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: {
        ...ownerFilter,
        OR: [
          {
            requestedAt: {
              gte: start,
              lt: end,
            },
          },
          {
            generatedAt: {
              gte: start,
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        status: true,
        requestedAt: true,
        generatedAt: true,
        updatedAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    }),
    prisma.invitation.findMany({
      where: {
        ...ownerFilter,
        OR: [
          {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          {
            acceptedAt: {
              gte: start,
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        tenantEmail: true,
        status: true,
        acceptedAt: true,
        createdAt: true,
        updatedAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    }),
    prisma.tenantRequest.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        status: {
          in: ["RESOLVED_BY_OWNER", "REFUSED_BY_OWNER"],
        },
        OR: [
          {
            resolvedAt: {
              gte: start,
              lt: end,
            },
          },
          {
            refusedAt: {
              gte: start,
              lt: end,
            },
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 3,
      select: {
        id: true,
        title: true,
        status: true,
        resolvedAt: true,
        refusedAt: true,
        updatedAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
      },
    }),
  ]);

  const outgoingAmountInCents = outgoingAggregate._sum.amountInCents ?? 0;
  const recentActivity = [
    ...recentPayments.map((payment) => ({
      id: `payment-${payment.id}`,
      title: getRecentActivityLabel(payment.status),
      description: `${payment.property.name} - ${payment.property.city}`,
      date: payment.updatedAt,
    })),
    ...recentReceipts.map((receipt) => ({
      id: `receipt-${receipt.id}`,
      title: getRecentActivityLabel(receipt.status),
      description: `${receipt.property.name} - ${receipt.property.city}`,
      date: receipt.generatedAt ?? receipt.requestedAt,
    })),
    ...recentInvitations.map((invitation) => ({
      id: `invitation-${invitation.id}`,
      title: getRecentInvitationActivityLabel(invitation.status),
      description: `${invitation.property.name} - ${invitation.tenantEmail}`,
      date: invitation.acceptedAt ?? invitation.createdAt,
    })),
    ...recentTenantRequests.map((tenantRequest) => ({
      id: `tenant-request-${tenantRequest.id}`,
      title:
        tenantRequest.status === "REFUSED_BY_OWNER"
          ? "Demande locataire refusee"
          : "Demande locataire traitee",
      description:
        tenantRequest.title ||
        `${tenantRequest.property.name} - ${tenantRequest.property.city}`,
      date:
        tenantRequest.resolvedAt ??
        tenantRequest.refusedAt ??
        tenantRequest.updatedAt,
    })),
  ]
    .sort((first, second) => second.date.getTime() - first.date.getTime())
    .slice(0, 4);

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
      expectedRentAmountInCents:
        currentMonthExpectedAggregate._sum.amountInCents ?? 0,
      remainingRentAmountInCents:
        currentMonthRemainingAggregate._sum.amountInCents ?? 0,
      collectedAmountInCents: collectedAggregate._sum.amountInCents ?? 0,
      outgoingAmountInCents,
      cashFlowAmountInCents:
        (collectedAggregate._sum.amountInCents ?? 0) - outgoingAmountInCents,
      declaredPaidExternalRentPayments: declaredExternalRentPayments.filter(
        (payment) =>
          payment.declarations[0]?.declarationType === "PAID_EXTERNALLY",
      ).length,
      requestedReceipts,
      overdueExternalRentPayments,
      draftProperties,
      draftContracts,
    },
    properties,
    recentActivity,
  };
}
