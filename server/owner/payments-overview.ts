import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import {
  getOwnerFinanceMonthRange,
  OWNER_FINANCE_REMAINING_PAYMENT_STATUSES,
} from "@/server/owner/finances";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

const latestPaymentDeclarationOrderBy: Prisma.PaymentDeclarationOrderByWithRelationInput[] =
  [
    {
      declaredAt: "desc",
    },
    {
      createdAt: "desc",
    },
  ];

const ownerPaymentOverviewSelect = {
  id: true,
  provider: true,
  providerPaymentId: true,
  type: true,
  status: true,
  amountInCents: true,
  currency: true,
  dueDate: true,
  paidAt: true,
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
  contractTenant: {
    select: {
      id: true,
      invitedEmail: true,
      invitedFirstName: true,
      invitedLastName: true,
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
  declarations: {
    orderBy: latestPaymentDeclarationOrderBy,
    take: 1,
    select: {
      id: true,
      declarationType: true,
      declaredAt: true,
    },
  },
} as const;

export async function getOwnerPaymentsOverview() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();
  const now = new Date();
  const { start, end } = getOwnerFinanceMonthRange(now);

  const [
    payments,
    expectedRentAggregate,
    collectedRentAggregate,
    watchPaymentsCount,
    declaredPaidExternalPayments,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        type: "RENT",
      },
      orderBy: {
        dueDate: "desc",
      },
      take: 40,
      select: ownerPaymentOverviewSelect,
    }),
    prisma.payment.aggregate({
      where: {
        ownerProfileId: ownerProfile.id,
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
        ownerProfileId: ownerProfile.id,
        type: "RENT",
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
    prisma.payment.count({
      where: {
        ownerProfileId: ownerProfile.id,
        type: "RENT",
        dueDate: {
          lt: now,
        },
        status: {
          in: [...OWNER_FINANCE_REMAINING_PAYMENT_STATUSES],
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
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
          orderBy: latestPaymentDeclarationOrderBy,
          take: 1,
          select: {
            declarationType: true,
          },
        },
      },
    }),
  ]);

  return {
    periodStart: start,
    periodEnd: end,
    summary: {
      expectedRentInCents: expectedRentAggregate._sum.amountInCents ?? 0,
      collectedRentInCents: collectedRentAggregate._sum.amountInCents ?? 0,
      watchPayments: watchPaymentsCount,
      declaredPaidExternalPayments: declaredPaidExternalPayments.filter(
        (payment) =>
          payment.declarations[0]?.declarationType === "PAID_EXTERNALLY",
      ).length,
    },
    payments,
  };
}
