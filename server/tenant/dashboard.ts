import { requireTenantAccess } from "@/server/auth/access";
import { prisma } from "@/server/db/prisma";

function getCurrentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { start, end };
}

export async function getTenantDashboardData() {
  const { user, tenantProfile } = await requireTenantAccess();

  const now = new Date();
  const externalPaymentDeclarationCutoff = new Date(now);
  externalPaymentDeclarationCutoff.setDate(
    externalPaymentDeclarationCutoff.getDate() + 1,
  );
  const { start, end } = getCurrentMonthRange();
  const tenantFilter = { tenantProfileId: tenantProfile.id };
  const pendingInvitationFilter = {
    tenantEmail: user.email,
    status: "SENT" as const,
    expiresAt: {
      gte: now,
    },
  };
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
    receivedInvitations,
    contractTenants,
    recentPayments,
    externalPaymentDeclarationCandidates,
    requestedReceipts,
    recentReceipts,
    rentReceiptPeriodStatuses,
    requestTargets,
    tenantRequests,
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
      where: pendingInvitationFilter,
    }),
    prisma.invitation.findMany({
      where: pendingInvitationFilter,
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      select: {
        id: true,
        tenantEmail: true,
        tenantFirstName: true,
        tenantLastName: true,
        contractTenantId: true,
        expiresAt: true,
        createdAt: true,
        property: {
          select: {
            name: true,
            city: true,
          },
        },
        rentalContract: {
          select: {
            id: true,
            contractType: true,
            status: true,
            startDate: true,
            endDate: true,
            totalRentAmountInCents: true,
            totalChargesAmountInCents: true,
            currency: true,
            paymentDayOfMonth: true,
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
        depositShareAmountInCents: true,
        currency: true,
        startDate: true,
        endDate: true,
        status: true,
        rentalContract: {
          select: {
            id: true,
            contractType: true,
            status: true,
            paymentDayOfMonth: true,
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
            property: {
              select: {
                name: true,
                city: true,
                propertyType: true,
                isColocation: true,
                imageUrl: true,
              },
            },
          },
        },
        paymentMandates: {
          where: {
            tenantProfileId: tenantProfile.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            provider: true,
            status: true,
            ibanLast4: true,
            acceptedAt: true,
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
        rentalContractId: true,
        contractTenantId: true,
        tenantProfileId: true,
        provider: true,
        providerPaymentId: true,
        type: true,
        status: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        paidAt: true,
        declarations: {
          where: {
            tenantProfileId: tenantProfile.id,
          },
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
            id: true,
            declarationType: true,
            declaredAt: true,
          },
        },
        contractTenant: {
          select: {
            id: true,
            status: true,
            rentShareAmountInCents: true,
            chargesShareAmountInCents: true,
            paymentMandates: {
              where: {
                tenantProfileId: tenantProfile.id,
                provider: "MOCK",
                status: "ACCEPTED",
              },
              take: 1,
              select: {
                id: true,
                provider: true,
                status: true,
              },
            },
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        ...tenantFilter,
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: {
          in: ["PLANNED", "PENDING"],
        },
        dueDate: {
          lte: externalPaymentDeclarationCutoff,
        },
        OR: [
          {
            contractTenantId: null,
          },
          {
            contractTenant: {
              is: {
                status: {
                  not: "TERMINATED",
                },
              },
            },
          },
        ],
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 4,
      select: {
        id: true,
        rentalContractId: true,
        contractTenantId: true,
        tenantProfileId: true,
        provider: true,
        providerPaymentId: true,
        type: true,
        status: true,
        amountInCents: true,
        currency: true,
        dueDate: true,
        declarations: {
          where: {
            tenantProfileId: tenantProfile.id,
          },
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
            id: true,
            declarationType: true,
            declaredAt: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: {
        ...tenantFilter,
        type: "RENT_RECEIPT",
        status: "REQUESTED",
      },
      orderBy: {
        requestedAt: "desc",
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
        requestedAt: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: {
        ...tenantFilter,
        status: {
          in: ["GENERATED", "SENT"],
        },
      },
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
    prisma.receipt.findMany({
      where: {
        ...tenantFilter,
        type: "RENT_RECEIPT",
        status: {
          in: ["REQUESTED", "GENERATED", "SENT"],
        },
      },
      orderBy: {
        periodStart: "desc",
      },
      take: 20,
      select: {
        id: true,
        type: true,
        status: true,
        tenantProfileId: true,
        rentalContractId: true,
        contractTenantId: true,
        periodStart: true,
        periodEnd: true,
      },
    }),
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
                imageUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.tenantRequest.findMany({
      where: tenantFilter,
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
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

  const recentReceiptIds = recentReceipts.map((receipt) => receipt.id);
  const seenReceiptLogs =
    recentReceiptIds.length > 0
      ? await prisma.auditLog.findMany({
          where: {
            userId: user.id,
            action: "receipt.seen_by_tenant",
            entityType: "Receipt",
            entityId: {
              in: recentReceiptIds,
            },
          },
          select: {
            entityId: true,
          },
        })
      : [];
  const seenReceiptIds = new Set(
    seenReceiptLogs
      .map((log) => log.entityId)
      .filter((entityId): entityId is string => entityId !== null),
  );
  const currentRentals = contractTenants.filter(
    (contractTenant) => contractTenant.status !== "TERMINATED",
  );
  const formerRentals = contractTenants.filter(
    (contractTenant) => contractTenant.status === "TERMINATED",
  );
  const externalPaymentsToDeclare = externalPaymentDeclarationCandidates.filter(
    (payment) =>
      payment.dueDate <= externalPaymentDeclarationCutoff &&
      payment.declarations[0]?.declarationType !== "PAID_EXTERNALLY",
  );
  const unseenAvailableReceipts = recentReceipts.filter(
    (receipt) => !seenReceiptIds.has(receipt.id),
  );

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
    receivedInvitations,
    contractTenants,
    currentRentals,
    formerRentals,
    recentPayments,
    externalPaymentsToDeclare,
    requestedReceipts,
    recentReceipts,
    unseenAvailableReceipts,
    rentReceiptPeriodStatuses,
    requestTargets,
    tenantRequests,
  };
}
