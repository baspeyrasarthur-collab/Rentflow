import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import {
  canMarkExternalPaymentAsReceived,
  isActiveContractTenantForExpectedPayment,
} from "@/server/payments/payment-data";
import { entityIdSchema, paymentIdSchema } from "@/server/validation";

export async function getOwnerPaymentCreateOptions() {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const [properties, contracts, contractTenants] = await Promise.all([
    prisma.property.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        status: {
          not: "ARCHIVED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        city: true,
        status: true,
      },
    }),
    prisma.rentalContract.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        status: {
          not: "ARCHIVED",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        propertyId: true,
        status: true,
        contractType: true,
        totalRentAmountInCents: true,
        totalChargesAmountInCents: true,
        currency: true,
        paymentDayOfMonth: true,
        property: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    }),
    prisma.contractTenant.findMany({
      where: {
        status: "ACTIVE",
        tenantProfileId: {
          not: null,
        },
        rentalContract: {
          ownerProfileId: ownerProfile.id,
          status: {
            not: "ARCHIVED",
          },
          property: {
            ownerProfileId: ownerProfile.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        rentalContractId: true,
        tenantProfileId: true,
        invitedEmail: true,
        invitedFirstName: true,
        invitedLastName: true,
        roomLabel: true,
        rentShareAmountInCents: true,
        chargesShareAmountInCents: true,
        currency: true,
        status: true,
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
        rentalContract: {
          select: {
            id: true,
            propertyId: true,
            status: true,
            currency: true,
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
  ]);

  return {
    user,
    ownerProfile,
    properties,
    contracts,
    contractTenants,
  };
}

export async function getOwnerContractTenantForExpectedPayment(
  contractTenantId: string,
) {
  const parsedContractTenantId = entityIdSchema.parse(contractTenantId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      id: parsedContractTenantId,
      rentalContract: {
        ownerProfileId: ownerProfile.id,
        property: {
          ownerProfileId: ownerProfile.id,
        },
      },
    },
    select: {
      id: true,
      tenantProfileId: true,
      rentalContractId: true,
      rentShareAmountInCents: true,
      chargesShareAmountInCents: true,
      currency: true,
      status: true,
      rentalContract: {
        select: {
          id: true,
          propertyId: true,
          ownerProfileId: true,
          property: {
            select: {
              id: true,
              ownerProfileId: true,
            },
          },
        },
      },
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No tenant attachment exists for this owner profile.",
    );
  }

  if (!isActiveContractTenantForExpectedPayment(contractTenant)) {
    throw new AppError(
      "CONFLICT",
      "An expected payment can only be created for an active tenant attachment.",
    );
  }

  if (!contractTenant.tenantProfileId) {
    throw new AppError(
      "CONFLICT",
      "An expected payment requires a linked tenant profile.",
    );
  }

  return { user, ownerProfile, contractTenant };
}

export async function getOwnerContractTenantForCentralExpectedPayment(input: {
  contractTenantId: string;
  propertyId: string;
  rentalContractId: string;
}) {
  const parsedContractTenantId = entityIdSchema.parse(input.contractTenantId);
  const parsedPropertyId = entityIdSchema.parse(input.propertyId);
  const parsedRentalContractId = entityIdSchema.parse(input.rentalContractId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const contractTenant = await prisma.contractTenant.findFirst({
    where: {
      id: parsedContractTenantId,
      status: "ACTIVE",
      tenantProfileId: {
        not: null,
      },
      rentalContractId: parsedRentalContractId,
      rentalContract: {
        id: parsedRentalContractId,
        propertyId: parsedPropertyId,
        ownerProfileId: ownerProfile.id,
        status: {
          not: "ARCHIVED",
        },
        property: {
          id: parsedPropertyId,
          ownerProfileId: ownerProfile.id,
        },
      },
    },
    select: {
      id: true,
      tenantProfileId: true,
      rentalContractId: true,
      rentShareAmountInCents: true,
      chargesShareAmountInCents: true,
      currency: true,
      status: true,
      rentalContract: {
        select: {
          id: true,
          propertyId: true,
          ownerProfileId: true,
          currency: true,
          property: {
            select: {
              id: true,
              ownerProfileId: true,
            },
          },
        },
      },
    },
  });

  if (!contractTenant) {
    throw new AppError(
      "NOT_FOUND",
      "No active tenant attachment exists for this owner contract.",
    );
  }

  if (!isActiveContractTenantForExpectedPayment(contractTenant)) {
    throw new AppError(
      "CONFLICT",
      "An expected payment can only be created for an active tenant attachment.",
    );
  }

  if (!contractTenant.tenantProfileId) {
    throw new AppError(
      "CONFLICT",
      "An expected payment requires a linked tenant profile.",
    );
  }

  return { user, ownerProfile, contractTenant };
}

export async function getOwnerExternalPaymentForReceipt(paymentId: string) {
  const parsedPaymentId = paymentIdSchema.parse(paymentId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const payment = await prisma.payment.findFirst({
    where: {
      id: parsedPaymentId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      ownerProfileId: true,
      propertyId: true,
      rentalContractId: true,
      contractTenantId: true,
      provider: true,
      providerPaymentId: true,
      status: true,
    },
  });

  if (!payment) {
    throw new AppError(
      "NOT_FOUND",
      "No external payment exists for this owner profile.",
    );
  }

  if (!canMarkExternalPaymentAsReceived(payment)) {
    throw new AppError(
      "CONFLICT",
      "Only planned external payments can be marked as received.",
    );
  }

  return { user, ownerProfile, payment };
}
