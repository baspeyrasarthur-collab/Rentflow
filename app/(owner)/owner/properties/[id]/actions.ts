"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { buildOwnerPropertyArchiveData } from "@/server/owner/property-data";
import {
  deleteOwnerPropertyPermanently,
  getCurrentOwnerProfileForProperties,
} from "@/server/owner/properties";
import {
  getBlockingArchiveContractStatuses,
  hasBlockingArchiveContracts,
} from "@/server/owner/property-archive";
import {
  removeLocalPropertyImageByUrl,
  uploadLocalPropertyImage,
} from "@/server/storage/property-images";
import { propertyIdSchema } from "@/server/validation";

export async function archiveOwnerPropertyAction(propertyId: string) {
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
      "No archivable property exists for this owner profile.",
    );
  }

  if (property.status === "ARCHIVED") {
    redirect("/owner/properties");
  }

  await prisma.$transaction(async (tx) => {
    const blockingContractCount = await tx.rentalContract.count({
      where: {
        propertyId: property.id,
        ownerProfileId: ownerProfile.id,
        status: {
          in: [...getBlockingArchiveContractStatuses()],
        },
      },
    });

    if (hasBlockingArchiveContracts(blockingContractCount)) {
      throw new AppError(
        "CONFLICT",
        "This property cannot be archived while active or suspended contracts exist.",
      );
    }

    await tx.property.update({
      where: {
        id: property.id,
      },
      data: buildOwnerPropertyArchiveData(),
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.archived",
        entityType: "Property",
        entityId: property.id,
        metadata: { source: "owner_archive_property" },
      },
    });
  });

  redirect("/owner/properties");
}

export async function deleteOwnerPropertyPermanentlyAction(
  propertyId: string,
  formData: FormData,
) {
  const confirmation = formData.get("confirmation");

  await deleteOwnerPropertyPermanently(
    propertyId,
    typeof confirmation === "string" ? confirmation.trim() : "",
  );

  redirect("/owner/properties");
}

function readPropertyIdFromFormData(formData: FormData) {
  const propertyId = formData.get("propertyId");

  if (typeof propertyId !== "string") {
    throw new AppError("BAD_REQUEST", "Property id is required.");
  }

  return propertyIdSchema.parse(propertyId);
}

function readPropertyImageFile(formData: FormData) {
  const file = formData.get("image");

  if (!(file instanceof File)) {
    throw new AppError("BAD_REQUEST", "Property image file is required.");
  }

  return file;
}

export async function updateOwnerPropertyImageAction(formData: FormData) {
  const propertyId = readPropertyIdFromFormData(formData);
  const imageFile = readPropertyImageFile(formData);
  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();

  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  const uploadedImage = await uploadLocalPropertyImage({
    file: imageFile,
    propertyId: property.id,
  });

  await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: {
        id: property.id,
      },
      data: {
        imageStorageKey: uploadedImage.key,
        imageUrl: uploadedImage.url,
      },
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.image_updated",
        entityType: "Property",
        entityId: property.id,
        metadata: {
          source: "owner_update_property_image",
          imageStorageKey: uploadedImage.key,
        },
      },
    });
  });

  await removeLocalPropertyImageByUrl(property.imageUrl);

  redirect(`/owner/properties/${property.id}`);
}

export async function removeOwnerPropertyImageAction(formData: FormData) {
  const propertyId = readPropertyIdFromFormData(formData);
  const confirmation = formData.get("confirmRemoveImage");

  if (confirmation !== "on") {
    throw new AppError(
      "BAD_REQUEST",
      "Property image removal requires confirmation.",
    );
  }

  const { user, ownerProfile } = await getCurrentOwnerProfileForProperties();
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      ownerProfileId: ownerProfile.id,
    },
    select: {
      id: true,
      imageUrl: true,
      imageStorageKey: true,
    },
  });

  if (!property) {
    throw new AppError(
      "NOT_FOUND",
      "No property exists for this owner profile.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.property.update({
      where: {
        id: property.id,
      },
      data: {
        imageStorageKey: null,
        imageUrl: null,
      },
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "property.image_removed",
        entityType: "Property",
        entityId: property.id,
        metadata: {
          source: "owner_remove_property_image",
          previousImageStorageKey: property.imageStorageKey,
        },
      },
    });
  });

  await removeLocalPropertyImageByUrl(property.imageUrl);

  redirect(`/owner/properties/${property.id}`);
}
