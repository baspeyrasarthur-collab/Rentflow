import { requireOwnerAccess } from "@/server/auth/access";
import {
  canCreatePropertyForPlan,
  getMaxPropertiesForPlan,
} from "@/server/billing/plans";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  propertyDeleteConfirmationSchema,
  propertyIdSchema,
} from "@/server/validation";

const propertyListSelect = {
  id: true,
  name: true,
  addressLine1: true,
  addressLine2: true,
  postalCode: true,
  city: true,
  country: true,
  propertyType: true,
  surfaceAreaSqm: true,
  furnished: true,
  isColocation: true,
  status: true,
  imageUrl: true,
  imageStorageKey: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      rentalContracts: true,
      payments: true,
      receipts: true,
      invitations: true,
    },
  },
} as const;

const propertyDetailSelect = {
  ...propertyListSelect,
  rentalContracts: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      contractType: true,
      colocationMode: true,
      status: true,
      startDate: true,
      endDate: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
    },
  },
  payments: {
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
    },
  },
  invitations: {
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    select: {
      id: true,
      tenantEmail: true,
      tenantFirstName: true,
      tenantLastName: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      createdAt: true,
    },
  },
} as const;

export async function getCurrentOwnerProfileForProperties() {
  return requireOwnerAccess();
}

export async function listOwnerProperties() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findMany({
    where: {
      ownerProfileId: ownerProfile.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: propertyListSelect,
  });
}

export async function getOwnerPropertyCreationAvailability() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();
  const currentPropertyCount = await prisma.property.count({
    where: {
      ownerProfileId: ownerProfile.id,
    },
  });

  return {
    plan: ownerProfile.plan,
    currentPropertyCount,
    maxProperties: getMaxPropertiesForPlan(ownerProfile.plan),
    canCreateProperty: canCreatePropertyForPlan(
      ownerProfile.plan,
      currentPropertyCount,
    ),
  };
}

export async function getOwnerPropertyById(propertyId: string) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();

  return prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: propertyDetailSelect,
  });
}

export async function deleteOwnerPropertyPermanently(
  propertyId: string,
  confirmation: string,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const parsedConfirmation =
    propertyDeleteConfirmationSchema.safeParse(confirmation);

  if (!parsedConfirmation.success) {
    throw new AppError(
      "BAD_REQUEST",
      "Type SUPPRIMER to confirm permanent property deletion.",
    );
  }

  const property = await prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      name: true,
      ownerProfileId: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No deletable property exists for this owner profile.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const contracts = await tx.rentalContract.findMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
      select: {
        id: true,
      },
    });
    const contractIds = contracts.map((contract) => contract.id);

    const contractTenants =
      contractIds.length > 0
        ? await tx.contractTenant.findMany({
            where: {
              rentalContractId: {
                in: contractIds,
              },
            },
            select: {
              id: true,
            },
          })
        : [];
    const contractTenantIds = contractTenants.map(
      (contractTenant) => contractTenant.id,
    );

    const payments = await tx.payment.findMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
      select: {
        id: true,
      },
    });
    const paymentIds = payments.map((payment) => payment.id);

    const paymentDeclarations =
      paymentIds.length > 0
        ? await tx.paymentDeclaration.deleteMany({
            where: {
              paymentId: {
                in: paymentIds,
              },
            },
          })
        : { count: 0 };

    const platformCommissions =
      paymentIds.length > 0
        ? await tx.platformCommission.deleteMany({
            where: {
              paymentId: {
                in: paymentIds,
              },
            },
          })
        : { count: 0 };

    const receipts = await tx.receipt.deleteMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
    });

    const paymentsDeleted = await tx.payment.deleteMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
    });

    const paymentMandates =
      contractIds.length > 0 || contractTenantIds.length > 0
        ? await tx.paymentMandate.deleteMany({
            where: {
              OR: [
                ...(contractIds.length > 0
                  ? [
                      {
                        rentalContractId: {
                          in: contractIds,
                        },
                      },
                    ]
                  : []),
                ...(contractTenantIds.length > 0
                  ? [
                      {
                        contractTenantId: {
                          in: contractTenantIds,
                        },
                      },
                    ]
                  : []),
              ],
            },
          })
        : { count: 0 };

    const invitations = await tx.invitation.deleteMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
    });

    const expenses = await tx.expense.deleteMany({
      where: {
        propertyId: property.id,
      },
    });

    const recurringExpenseRules = await tx.recurringExpenseRule.deleteMany({
      where: {
        propertyId: property.id,
      },
    });

    const contractTenantsDeleted =
      contractIds.length > 0
        ? await tx.contractTenant.deleteMany({
            where: {
              rentalContractId: {
                in: contractIds,
              },
            },
          })
        : { count: 0 };

    const rentalContracts = await tx.rentalContract.deleteMany({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
      },
    });

    await tx.property.delete({
      where: {
        id: property.id,
      },
      select: {
        id: true,
      },
    });

    const deletedRelatedDataSummary = {
      rentalContracts: rentalContracts.count,
      contractTenants: contractTenantsDeleted.count,
      invitations: invitations.count,
      paymentMandates: paymentMandates.count,
      payments: paymentsDeleted.count,
      paymentDeclarations: paymentDeclarations.count,
      receipts: receipts.count,
      platformCommissions: platformCommissions.count,
      expenses: expenses.count,
      recurringExpenseRules: recurringExpenseRules.count,
    };

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.deleted",
        entityType: "Property",
        entityId: property.id,
        metadata: {
          source: "owner_delete_property",
          propertyName: property.name,
          ownerProfileId: ownerProfile.id,
          deletedRelatedDataSummary,
        },
      },
    });

    return {
      propertyId: property.id,
      deletedRelatedDataSummary,
    };
  });
}
