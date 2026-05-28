"use server";

import { redirect } from "next/navigation";

import { requireOwnerAccess } from "@/server/auth/access";
import { updateUserPersonalInfoForAccount } from "@/server/account/personal-info";
import {
  removeUserProfileImageForAccount,
  updateUserProfileImageForAccount,
} from "@/server/account/profile-image";
import { prisma } from "@/server/db/prisma";

export async function createTenantProfileFromOwnerAccountAction() {
  const { user } = await requireOwnerAccess();

  await prisma.$transaction(async (tx) => {
    const existingTenantProfile = await tx.tenantProfile.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    const profile =
      existingTenantProfile ??
      (await tx.tenantProfile.upsert({
        where: {
          userId: user.id,
        },
        update: {},
        create: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      }));

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "tenant_profile.created_from_account",
        entityType: "TenantProfile",
        entityId: profile.id,
        metadata: {
          source: "owner_account_create_tenant_profile",
          alreadyExisted: Boolean(existingTenantProfile),
        },
      },
    });
  });

  redirect("/tenant");
}

export async function updateOwnerAccountProfileImageAction(formData: FormData) {
  const { user } = await requireOwnerAccess();

  await updateUserProfileImageForAccount({
    formData,
    source: "owner_account_update_profile_image",
    user,
  });

  redirect("/owner/account");
}

export async function removeOwnerAccountProfileImageAction(formData: FormData) {
  const { user } = await requireOwnerAccess();

  await removeUserProfileImageForAccount({
    formData,
    source: "owner_account_remove_profile_image",
    user,
  });

  redirect("/owner/account");
}

export async function updateOwnerAccountPersonalInfoAction(formData: FormData) {
  const { user } = await requireOwnerAccess();

  await updateUserPersonalInfoForAccount({
    formData,
    source: "owner_account_update_personal_info",
    user,
  });

  redirect("/owner/account?focus=personal-info");
}
