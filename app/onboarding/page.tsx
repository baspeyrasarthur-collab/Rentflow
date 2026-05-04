import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createRentFlowUserAction } from "@/app/onboarding/actions";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (existingUser) {
    redirect("/dashboard");
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "votre compte Clerk";

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <section className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            RentFlow
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Initialiser votre compte
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            Votre session Clerk est active pour {email}. Choisissez le role
            principal de ce compte RentFlow pour creer le profil interne
            associe.
          </p>
        </div>

        <form action={createRentFlowUserAction} className="space-y-6">
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="sr-only">Role RentFlow</legend>
            <label className="cursor-pointer rounded-lg border bg-card p-5 text-card-foreground transition hover:border-foreground">
              <input
                className="mb-4"
                type="radio"
                name="role"
                value="OWNER"
                required
              />
              <span className="block text-lg font-semibold">Proprietaire</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                Gerer des logements, des locataires et des paiements simules.
              </span>
            </label>

            <label className="cursor-pointer rounded-lg border bg-card p-5 text-card-foreground transition hover:border-foreground">
              <input
                className="mb-4"
                type="radio"
                name="role"
                value="TENANT"
                required
              />
              <span className="block text-lg font-semibold">Locataire</span>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                Consulter une location, un mandat simule et les quittances.
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Continuer
          </button>
        </form>
      </section>
    </main>
  );
}
