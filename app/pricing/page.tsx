import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

const plans = [
  {
    name: "FREE",
    limit: "1 logement",
    description:
      "Pour démarrer avec les fonctionnalités cœur de gestion locative.",
    features: [
      "Finances",
      "Dépenses ponctuelles",
      "Dépenses récurrentes",
      "Quittances illimitées",
      "Suivi des paiements externes",
      "Pas de prélèvement automatique via RentFlow",
    ],
    cta: "Commencer gratuitement",
  },
  {
    name: "PRO",
    limit: "Jusqu'à 15 logements",
    description:
      "Pour suivre un portefeuille établi avec les mêmes fonctionnalités cœur.",
    features: [
      "Toutes les fonctionnalités cœur",
      "Finances et cash-flow estimé",
      "Dépenses ponctuelles et récurrentes",
      "Quittances illimitées",
      "Paiements externes toujours suivis",
      "Option prélèvement automatique via RentFlow quand un provider réel sera branché",
    ],
    cta: "Créer un compte",
  },
  {
    name: "SCALE",
    limit: "Logements illimités",
    description:
      "Pour les propriétaires avec un portefeuille locatif plus important.",
    features: [
      "Toutes les fonctionnalités PRO",
      "Limite de logements illimitée",
      "Suivi centralisé du portefeuille",
      "Paiements externes toujours suivis",
      "Option prélèvement automatique via RentFlow quand un provider réel sera branché",
      "Adapté aux portefeuilles plus importants",
    ],
    cta: "Créer un compte",
  },
];

function PlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className="flex h-full flex-col rounded-lg border bg-card p-6 text-card-foreground">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {plan.name}
        </p>
        <div>
          <h2 className="text-2xl font-semibold tracking-normal">
            {plan.limit}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {plan.description}
          </p>
        </div>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li className="flex gap-3" key={feature}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
            <span className="leading-6">{feature}</span>
          </li>
        ))}
      </ul>

      <Link className={buttonVariants({ className: "mt-6" })} href="/sign-up">
        {plan.cta}
      </Link>
    </article>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:py-14">
        <header className="flex flex-col gap-5 border-b pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <Link className="text-base font-semibold" href="/">
              RentFlow
            </Link>
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Plans propriétaire
              </p>
              <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
                Plans RentFlow
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Choisissez le plan adapté à votre portefeuille locatif.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/sign-in"
            >
              Se connecter
            </Link>
            <Link className={buttonVariants()} href="/sign-up">
              Créer un compte
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo"
            >
              Voir la démo
            </Link>
          </div>
        </header>

        <section className="grid gap-4 rounded-lg border bg-muted/40 p-5 text-sm text-muted-foreground md:grid-cols-2">
          <p>
            Le compte locataire est gratuit. Le propriétaire choisit un plan
            selon la taille de son portefeuille.
          </p>
          <p>
            Le paiement d’abonnement réel sera disponible plus tard. Aucun
            prélèvement automatique réel n’est actif dans le MVP, et le paiement
            externe reste toujours possible.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border p-5 text-sm leading-6 text-muted-foreground md:grid-cols-2">
          <p>
            Les paiements et prélèvements réels seront branchés plus tard via un
            provider validé.
          </p>
          <p>
            Le modèle actuel prépare les limites et fonctionnalités sans
            checkout réel.
          </p>
        </section>
      </section>
    </main>
  );
}
