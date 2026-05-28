import { requireCurrentUser } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";

const ownerAccessProfileSelect = {
  id: true,
  userId: true,
  plan: true,
} as const;

const tenantAccessProfileSelect = {
  id: true,
  userId: true,
} as const;

export async function requireOwnerAccess() {
  const user = await requireCurrentUser();

  if (user.role === "ADMIN") {
    throw new AppError(
      "FORBIDDEN",
      "Admin accounts cannot access owner space as owners.",
    );
  }

  const ownerProfile = await prisma.ownerProfile.findUnique({
    where: { userId: user.id },
    select: ownerAccessProfileSelect,
  });

  if (!ownerProfile) {
    throw new AppError(
      "FORBIDDEN",
      "An owner profile is required to access owner space.",
    );
  }

  return { user, ownerProfile };
}

export async function requireTenantAccess() {
  const user = await requireCurrentUser();

  if (user.role === "ADMIN") {
    throw new AppError(
      "FORBIDDEN",
      "Admin accounts cannot access tenant space as tenants.",
    );
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: user.id },
    select: tenantAccessProfileSelect,
  });

  if (!tenantProfile) {
    throw new AppError(
      "FORBIDDEN",
      "A tenant profile is required to access tenant space.",
    );
  }

  return { user, tenantProfile };
}
