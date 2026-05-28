"use server";

import { redirect } from "next/navigation";

import { updateUserPersonalInfoForAccount } from "@/server/account/personal-info";
import {
  removeUserProfileImageForAccount,
  updateUserProfileImageForAccount,
} from "@/server/account/profile-image";
import { requireTenantAccess } from "@/server/auth/access";

export async function updateTenantAccountProfileImageAction(
  formData: FormData,
) {
  const { user } = await requireTenantAccess();

  await updateUserProfileImageForAccount({
    formData,
    source: "tenant_account_update_profile_image",
    user,
  });

  redirect("/tenant/account");
}

export async function removeTenantAccountProfileImageAction(
  formData: FormData,
) {
  const { user } = await requireTenantAccess();

  await removeUserProfileImageForAccount({
    formData,
    source: "tenant_account_remove_profile_image",
    user,
  });

  redirect("/tenant/account");
}

export async function updateTenantAccountPersonalInfoAction(
  formData: FormData,
) {
  const { user } = await requireTenantAccess();

  await updateUserPersonalInfoForAccount({
    formData,
    source: "tenant_account_update_personal_info",
    user,
  });

  redirect("/tenant/account");
}
