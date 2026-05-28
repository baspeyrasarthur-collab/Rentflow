import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import {
  removeLocalProfileImageByUrl,
  uploadLocalProfileImage,
} from "@/server/storage/profile-images";

function readProfileImageFile(formData: FormData) {
  const file = formData.get("image");

  if (!(file instanceof File)) {
    throw new AppError("BAD_REQUEST", "Profile image file is required.");
  }

  return file;
}

export async function updateUserProfileImageForAccount(input: {
  formData: FormData;
  source: string;
  user: {
    id: string;
  };
}) {
  const imageFile = readProfileImageFile(input.formData);
  const user = await prisma.user.findUnique({
    where: {
      id: input.user.id,
    },
    select: {
      id: true,
      profileImageUrl: true,
    },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "No user exists for this session.");
  }

  const uploadedImage = await uploadLocalProfileImage({
    file: imageFile,
    userId: user.id,
  });

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImageStorageKey: uploadedImage.key,
        profileImageUrl: uploadedImage.url,
      },
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "user.profile_image_updated",
        entityType: "User",
        entityId: user.id,
        metadata: {
          source: input.source,
          profileImageStorageKey: uploadedImage.key,
        },
      },
    });
  });

  await removeLocalProfileImageByUrl(user.profileImageUrl);
}

export async function removeUserProfileImageForAccount(input: {
  formData: FormData;
  source: string;
  user: {
    id: string;
  };
}) {
  const confirmation = input.formData.get("confirmRemoveProfileImage");

  if (confirmation !== "on") {
    throw new AppError(
      "BAD_REQUEST",
      "Profile image removal requires confirmation.",
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: input.user.id,
    },
    select: {
      id: true,
      profileImageUrl: true,
      profileImageStorageKey: true,
    },
  });

  if (!user) {
    throw new AppError("NOT_FOUND", "No user exists for this session.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        profileImageStorageKey: null,
        profileImageUrl: null,
      },
      select: {
        id: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "user.profile_image_removed",
        entityType: "User",
        entityId: user.id,
        metadata: {
          source: input.source,
          previousProfileImageStorageKey: user.profileImageStorageKey,
        },
      },
    });
  });

  await removeLocalProfileImageByUrl(user.profileImageUrl);
}
