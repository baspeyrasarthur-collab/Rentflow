import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { InfoAlert, PageHeader, SpotlightCard } from "@/components/ui/rentflow";
import {
  redirectAfterRoleAccessError,
  requireCurrentUser,
} from "@/server/auth/current-user";
import { getHomePathForRole } from "@/server/auth/roles";

async function getAccountSecurityUser() {
  try {
    return await requireCurrentUser();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function AccountSecurityPage() {
  const user = await getAccountSecurityUser();

  return (
    <section className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={getHomePathForRole(user.role)}
          >
            Retour a mon espace
          </Link>
        }
        description="Modifiez votre email, votre mot de passe et vos options de recuperation depuis l'espace d'authentification."
        eyebrow="Securite"
        title="Identifiants et securite"
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Identifiants Clerk">
          <p>
            Vos identifiants sont sécurisés par l&apos;espace
            d&apos;authentification. La modification de l&apos;email peut
            nécessiter une vérification.
          </p>
        </InfoAlert>
      </SpotlightCard>

      <div className="rounded-2xl border border-ring/35 bg-card/70 p-4 shadow-xl shadow-black/10">
        <UserProfile path="/account/security" routing="path" />
      </div>
    </section>
  );
}
