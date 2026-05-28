"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  buildOwnerIndividualContractUpdateData,
  canEditOwnerIndividualContract,
} from "@/server/owner/contract-data";
import { parseOwnerIndividualContractUpdateFormData } from "@/server/owner/contract-form";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { contractIdSchema, propertyIdSchema } from "@/server/validation";

export async function updateOwnerIndividualContractAction(
  propertyId: string,
  contractId: string,
  formData: FormData,
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
      status: true,
    },
  });

  if (!contract) {
    throw new AppError(
      "NOT_FOUND",
      "No contract exists for this owner profile.",
    );
  }

  if (!canEditOwnerIndividualContract(contract.status)) {
    throw new AppError(
      "CONFLICT",
      "Only draft contracts can be edited in this phase.",
    );
  }

  const input = parseOwnerIndividualContractUpdateFormData(formData);
  const updateData = buildOwnerIndividualContractUpdateData(input);

  await prisma.$transaction(async (tx) => {
    await tx.rentalContract.update({
      where: {
        id: contract.id,
      },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "rental_contract.updated",
        entityType: "RentalContract",
        entityId: contract.id,
        metadata: {
          source: "owner_update_individual_contract",
          propertyId: property.id,
        },
      },
    });
  });

  redirect(`/owner/properties/${property.id}/contracts/${contract.id}`);
}
