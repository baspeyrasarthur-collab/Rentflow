import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PlaceholderScreen } from "@/components/layout/placeholder-screen";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      role: true,
      disabledAt: true,
      ownerProfile: {
        select: {
          id: true,
        },
      },
      tenantProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/onboarding");
  }

  if (user.disabledAt) {
    return (
      <main className="min-h-screen bg-background px-6 py-12">
        <PlaceholderScreen
          title="Compte desactive"
          description="Ce compte RentFlow est desactive. Contactez l'administration RentFlow pour verifier la situation."
        />
      </main>
    );
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.ownerProfile) {
    redirect("/owner");
  }

  if (user.tenantProfile) {
    redirect("/tenant");
  }

  redirect("/onboarding");
}
