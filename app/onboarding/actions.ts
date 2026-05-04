"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/errors";
import { onboardingFormSchema } from "@/server/validation";

function getPrimaryEmail(clerkUser: Awaited<ReturnType<typeof currentUser>>) {
  if (!clerkUser) {
    return null;
  }

  return (
    clerkUser.primaryEmailAddress ??
    clerkUser.emailAddresses.find((emailAddress) => emailAddress.emailAddress)
  );
}

export async function createRentFlowUserAction(formData: FormData) {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const parsed = onboardingFormSchema.safeParse({
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new AppError("BAD_REQUEST", "Invalid onboarding role.");
  }

  const clerkUser = await currentUser();
  const primaryEmail = getPrimaryEmail(clerkUser);

  if (!primaryEmail) {
    throw new AppError(
      "BAD_REQUEST",
      "An email address is required to create a RentFlow account.",
    );
  }

  // Clerk exposes the verification status here, not the original verification date.
  // This records when RentFlow initialized an already verified email.
  const emailVerifiedAt =
    primaryEmail.verification?.status === "verified" ? new Date() : null;

  await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (existingUser) {
      return existingUser;
    }

    const createdUser = await tx.user.create({
      data: {
        clerkUserId: userId,
        email: primaryEmail.emailAddress.toLowerCase(),
        firstName: clerkUser?.firstName ?? null,
        lastName: clerkUser?.lastName ?? null,
        role: parsed.data.role,
        emailVerifiedAt,
      },
      select: {
        id: true,
      },
    });

    if (parsed.data.role === "OWNER") {
      await tx.ownerProfile.create({
        data: {
          userId: createdUser.id,
          identityVerificationStatus: "NOT_STARTED",
        },
      });
    }

    if (parsed.data.role === "TENANT") {
      await tx.tenantProfile.create({
        data: {
          userId: createdUser.id,
          identityVerificationStatus: "NOT_STARTED",
        },
      });
    }

    return createdUser;
  });

  redirect("/dashboard");
}
