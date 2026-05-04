import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import type { UserRole } from "@/features/auth/types";
import { getHomePathForRole } from "@/server/auth/roles";
import { prisma } from "@/server/db/prisma";
import { AppError, isAppError } from "@/server/errors";
import {
  assertActivePrincipal,
  assertRole,
  type AuthenticatedPrincipal,
} from "@/server/security/access-control";

const currentUserSelect = {
  id: true,
  clerkUserId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  disabledAt: true,
} as const;

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: currentUserSelect,
  });
}

export async function requireCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError("UNAUTHORIZED", "Authentication is required.");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: currentUserSelect,
  });

  if (!user) {
    throw new AppError(
      "NOT_FOUND",
      "No RentFlow user exists for this session.",
    );
  }

  assertActivePrincipal(toAuthenticatedPrincipal(user));

  return user;
}

export async function requireRole(allowedRoles: readonly UserRole[]) {
  const user = await requireCurrentUser();
  const principal = toAuthenticatedPrincipal(user);

  assertRole(principal, allowedRoles);

  return user;
}

export async function redirectAfterRoleAccessError(
  error: unknown,
): Promise<never> {
  if (!isAppError(error)) {
    throw error;
  }

  if (error.code === "FORBIDDEN") {
    const user = await getCurrentUser();

    if (user && !user.disabledAt) {
      redirect(getHomePathForRole(user.role));
    }
  }

  redirect("/dashboard");
}

export function toAuthenticatedPrincipal(user: {
  id: string;
  role: UserRole;
  disabledAt?: Date | null;
}): AuthenticatedPrincipal {
  return {
    userId: user.id,
    role: user.role,
    disabledAt: user.disabledAt,
  };
}
