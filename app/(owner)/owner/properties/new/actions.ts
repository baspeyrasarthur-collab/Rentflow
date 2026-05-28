"use server";

import { redirect } from "next/navigation";

import { canCreatePropertyForPlan } from "@/server/billing/plans";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { buildOwnerPropertyCreateData } from "@/server/owner/property-data";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { parseOwnerPropertyCreateFormData } from "@/server/owner/property-form";

export async function createOwnerPropertyAction(formData: FormData) {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const input = parseOwnerPropertyCreateFormData(formData);

  await prisma.$transaction(async (tx) => {
    const currentPropertyCount = await tx.property.count({
      where: {
        ownerProfileId: ownerProfile.id,
      },
    });

    if (!canCreatePropertyForPlan(ownerProfile.plan, currentPropertyCount)) {
      throw new AppError(
        "FORBIDDEN",
        "Your current plan does not allow adding another property.",
      );
    }

    const property = await tx.property.create({
      data: buildOwnerPropertyCreateData(input, ownerProfile.id),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.created",
        entityType: "Property",
        entityId: property.id,
        metadata: { source: "owner_create_property" },
      },
    });
  });

  redirect("/owner/properties");
}
