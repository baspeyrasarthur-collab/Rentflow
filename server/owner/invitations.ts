import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { contractIdSchema, propertyIdSchema } from "@/server/validation";

export function canInviteTenantToContract(contractStatus: string) {
  return contractStatus === "DRAFT";
}

export async function getOwnerContractForInvitation(
  propertyId: string,
  contractId: string,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const parsedContractId = contractIdSchema.parse(contractId);
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

  const contract = await prisma.rentalContract.findFirst({
    where: {
      id: parsedContractId,
      propertyId: property.id,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      propertyId: true,
      ownerProfileId: true,
      contractType: true,
      colocationMode: true,
      status: true,
      startDate: true,
      endDate: true,
      totalRentAmountInCents: true,
      totalChargesAmountInCents: true,
      depositAmountInCents: true,
      currency: true,
      paymentDayOfMonth: true,
    },
  });

  if (!contract) {
    throw new AppError(
      "NOT_FOUND",
      "No contract exists for this owner profile.",
    );
  }

  if (contract.contractType !== "INDIVIDUAL") {
    throw new AppError(
      "CONFLICT",
      "Only individual contracts can receive tenant invitations in this phase.",
    );
  }

  if (contract.colocationMode !== "NONE") {
    throw new AppError(
      "CONFLICT",
      "Colocation contracts cannot receive this individual invitation.",
    );
  }

  if (!canInviteTenantToContract(contract.status)) {
    throw new AppError(
      "CONFLICT",
      "Only draft contracts can receive tenant invitations in this phase.",
    );
  }

  return {
    user,
    ownerProfile,
    property,
    contract,
  };
}
