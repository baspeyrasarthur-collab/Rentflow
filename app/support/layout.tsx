import { headers } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/features/auth/types";
import { requireCurrentUser } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

type SupportLayoutProfile = {
  id: string;
} | null;

function getDisplayName(user: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

function getSupportRole({
  ownerProfile,
  referrer,
  tenantProfile,
  userRole,
}: {
  ownerProfile: SupportLayoutProfile;
  referrer: string | null;
  tenantProfile: SupportLayoutProfile;
  userRole: UserRole;
}): UserRole {
  if (referrer?.includes("/tenant") && tenantProfile) {
    return "TENANT";
  }

  if (referrer?.includes("/owner") && ownerProfile) {
    return "OWNER";
  }

  if (ownerProfile) {
    return "OWNER";
  }

  if (tenantProfile) {
    return "TENANT";
  }

  return userRole;
}

function getRoleLabel(role: UserRole) {
  if (role === "OWNER") {
    return "Proprietaire";
  }

  if (role === "TENANT") {
    return "Locataire";
  }

  return "Admin";
}

export default async function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const requestHeaders = await headers();
  const referrer = requestHeaders.get("referer");
  const [ownerProfile, tenantProfile] = await Promise.all([
    prisma.ownerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        plan: true,
      },
    }),
    prisma.tenantProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
      },
    }),
  ]);
  const role = getSupportRole({
    ownerProfile,
    referrer,
    tenantProfile,
    userRole: user.role,
  });

  return (
    <AppShell
      avatarUrl={user.profileImageUrl}
      currentPlan={role === "OWNER" ? ownerProfile?.plan : undefined}
      displayName={getDisplayName(user)}
      role={role}
      roleLabel={getRoleLabel(role)}
    >
      {children}
    </AppShell>
  );
}
