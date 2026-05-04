"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
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
      "No editable property exists for this owner profile.",
    );
  }

  await prisma.property.update({
    where: {
      id: property.id,
    },
    data: input,
    select: {
      id: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "property.updated",
      entityType: "Property",
      entityId: property.id,
      metadata: { source: "owner_update_property" },
    },
  });

  redirect(`/owner/properties/${property.id}`);
}
