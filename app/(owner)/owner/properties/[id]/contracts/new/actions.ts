"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { buildOwnerIndividualContractCreateData } from "@/server/owner/contract-data";
import { parseOwnerIndividualContractCreateFormData } from "@/server/owner/contract-form";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { propertyIdSchema } from "@/server/validation";

export async function createOwnerIndividualContractAction(
  propertyId: string,
  formData: FormData,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const property = await prisma.property.findFirst({
    where: {
      id: parsedPropertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  if (property.status === "ARCHIVED") {
    throw new AppError(
      "CONFLICT",
      "An archived property cannot receive a new contract.",
    );
  }

  const input = parseOwnerIndividualContractCreateFormData(formData);

  await prisma.$transaction(async (tx) => {
    const contract = await tx.rentalContract.create({
      data: buildOwnerIndividualContractCreateData(
        input,
        property.id,
        ownerProfile.id,
      ),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "rental_contract.created",
        entityType: "RentalContract",
        entityId: contract.id,
        metadata: {
          source: "owner_create_individual_contract",
          propertyId: property.id,
        },
      },
    });
  });

  redirect(`/owner/properties/${property.id}`);
}
