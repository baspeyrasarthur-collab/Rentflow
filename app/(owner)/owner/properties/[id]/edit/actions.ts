"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { buildOwnerPropertyUpdateData } from "@/server/owner/property-data";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { parseOwnerPropertyUpdateFormData } from "@/server/owner/property-form";
import { propertyIdSchema } from "@/server/validation";

export async function updateOwnerPropertyAction(
  propertyId: string,
  formData: FormData,
) {
  const parsedPropertyId = propertyIdSchema.parse(propertyId);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const input = parseOwnerPropertyUpdateFormData(formData);

  const propertyIdToRedirect = await prisma.$transaction(async (tx) => {
    const property = await tx.property.findFirst({
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
        "No editable property exists for this owner profile.",
      );
    }

    await tx.property.update({
      where: {
        id: property.id,
      },
      data: buildOwnerPropertyUpdateData(input),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.updated",
        entityType: "Property",
        entityId: property.id,
        metadata: { source: "owner_update_property" },
      },
    });

    return property.id;
  });

  redirect(`/owner/properties/${propertyIdToRedirect}`);
}
