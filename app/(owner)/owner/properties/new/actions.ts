"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { parseOwnerPropertyCreateFormData } from "@/server/owner/property-form";

export async function createOwnerPropertyAction(formData: FormData) {
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const input = parseOwnerPropertyCreateFormData(formData);

  const property = await prisma.property.create({
    data: {
      ...input,
      ownerProfileId: ownerProfile.id,
      status: "DRAFT",
    },
    select: {
      id: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "property.created",
      entityType: "Property",
      entityId: property.id,
      metadata: { source: "owner_create_property" },
    },
  });

  redirect("/owner/properties");
}
