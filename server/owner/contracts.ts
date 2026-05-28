import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { contractIdSchema, propertyIdSchema } from "@/server/validation";

const latestPaymentDeclarationOrderBy: Prisma.PaymentDeclarationOrderByWithRelationInput[] =
  [
    {
      declaredAt: "desc",
    },
    {
      createdAt: "desc",
    },
  ];

const ownerContractListSelect = {
  id: true,
  propertyId: true,
  ownerProfileId: true,
  contractType: true,
  colocationMode: true,
  startDate: true,
  endDate: true,
  status: true,
  totalRentAmountInCents: true,
  totalChargesAmountInCents: true,
  depositAmountInCents: true,
  currency: true,
  paymentDayOfMonth: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      contractTenants: true,
      invitations: true,
      paymentMandates: true,
      payments: true,
      receipts: true,
    },
  },
} as const;

const ownerContractDetailSelect = {
  ...ownerContractListSelect,
  property: {
    select: {
      id: true,
      name: true,
      city: true,
      status: true,
      isColocation: true,
    },
  },
  contractTenants: {
    orderBy: {
      createdAt: "desc",
    },
    select: {
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
      tenantProfile: {
        select: {
          userId: true,
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
  },
  payments: {
    orderBy: {
      dueDate: "desc",
    },
    take: 8,
    select: {
      id: true,
      contractTenantId: true,
      provider: true,
      providerPaymentId: true,
      type: true,
      status: true,
      amountInCents: true,
      currency: true,
      dueDate: true,
      paidAt: true,
      failedAt: true,
      failureReason: true,
      tenantProfileId: true,
      rentalContractId: true,
      declarations: {
        orderBy: latestPaymentDeclarationOrderBy,
        take: 1,
        select: {
          id: true,
          declarationType: true,
          declaredAt: true,
          tenantProfileId: true,
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
        },
      },
      contractTenant: {
        select: {
          id: true,
          rentShareAmountInCents: true,
          chargesShareAmountInCents: true,
        },
      },
    },
  },
  receipts: {
    where: {
      type: "RENT_RECEIPT",
      status: {
        not: "CANCELED",
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
      totalAmountInCents: true,
      currency: true,
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
    },
  },
} as const;

async function getOwnerPropertyForContracts(propertyId: string) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const property = await prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      ownerProfileId: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  return { user, ownerProfile, property };
}

export async function listOwnerPropertyContracts(propertyId: string) {
  const { ownerProfile, property } =
    await getOwnerPropertyForContracts(propertyId);

  return prisma.rentalContract.findMany({
    where: {
      propertyId: property.id,
      ownerProfileId: ownerProfile.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: ownerContractListSelect,
  });
}

export async function getOwnerPropertyContractById(
  propertyId: string,
  contractId: string,
) {
  const parsedContractId = contractIdSchema.parse(contractId);
  const { ownerProfile, property } =
    await getOwnerPropertyForContracts(propertyId);

  return prisma.rentalContract.findFirst({
    where: {
      id: parsedContractId,
      propertyId: property.id,
      ownerProfileId: ownerProfile.id,
    },
    select: ownerContractDetailSelect,
  });
}

export async function listOwnerPropertiesForContractCreation() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findMany({
    where: {
      ownerProfileId: ownerProfile.id,
      status: {
        not: "ARCHIVED",
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      name: true,
      city: true,
      propertyType: true,
      status: true,
      furnished: true,
      isColocation: true,
      _count: {
        select: {
          rentalContracts: true,
        },
      },
    },
  });
}
