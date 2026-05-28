import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  getMaxPropertiesForPlan,
  getOwnerPlanFeatures,
  OWNER_PLANS,
  type OwnerPlan,
} from "@/server/billing/plans";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";

const planLabels: Record<OwnerPlan, string> = {
  FREE: "FREE",
  PRO: "PRO",
  SCALE: "SCALE",
};

function formatPropertyLimit(plan: OwnerPlan) {
  if (plan === "SCALE") {
    return "Logements illimités";
  }

  if (plan === "PRO") {
    return "Jusqu’à 15 logements";
  }

  return `${getMaxPropertiesForPlan(plan)} logement`;
}

function getInAppPaymentLabel(plan: OwnerPlan) {
  return getOwnerPlanFeatures(plan).canUseInAppPayments
    ? "option disponible quand le provider réel sera branché"
    : "non disponible avec ce plan";
}

async function getOwnerPlanForPage() {
  try {
    const { ownerProfile } = await getCurrentOwnerProfileForProperties();

    return ownerProfile.plan;
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerUpgradePage() {
  const currentPlan = await getOwnerPlanForPage();

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Plans propriétaire
        </p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Changer de plan
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground">
              Les plans payants permettront de gérer plus de logements et de
              rendre le prélèvement automatique disponible quand un provider
              réel sera branché.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/pricing"
            >
              Voir la page publique des plans
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Retour logements
            </Link>
            <Link className={buttonVariants()} href="/owner">
              Retour espace owner
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground md:grid-cols-2">
        <div>
          <p className="font-medium text-foreground">Plan actuel</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {planLabels[currentPlan]}
          </p>
        </div>
        <div>
          <p className="font-medium text-foreground">Limite de logements</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {formatPropertyLimit(currentPlan)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {OWNER_PLANS.map((plan) => (
          <article
            className="flex h-full flex-col rounded-lg border bg-card p-5 text-card-foreground"
            key={plan}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {planLabels[plan]}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                  {formatPropertyLimit(plan)}
                </h2>
              </div>
              {plan === currentPlan ? (
                <span className="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  Plan actuel
                </span>
              ) : null}
            </div>

            <ul className="mt-6 flex-1 space-y-3 text-sm">
              <li>Fonctionnalités cœur</li>
              <li>Finances</li>
              <li>Dépenses ponctuelles et récurrentes</li>
              <li>Quittances illimitées</li>
              <li>Suivi des paiements externes</li>
              <li>Prélèvement automatique : {getInAppPaymentLabel(plan)}</li>
            </ul>

            <button
              className={buttonVariants({
                className: "mt-6 cursor-not-allowed",
                variant: plan === currentPlan ? "outline" : "default",
              })}
              disabled
              type="button"
            >
              {plan === currentPlan ? "Plan actuel" : "Bientôt disponible"}
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-lg border p-5 text-sm leading-6 text-muted-foreground">
        Le changement de plan et le paiement d’abonnement seront disponibles
        plus tard. Aucun paiement n’est déclenché depuis cette page, et le suivi
        des paiements externes reste possible.
      </section>
    </section>
  );
}
