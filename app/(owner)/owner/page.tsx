import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  WalletCards,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  EmptyState,
  InfoAlert,
  OwnerQuickActions,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { getOwnerDashboardData } from "@/server/owner/dashboard";
import { getOwnerNextActions } from "@/server/owner/next-actions";

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  OTHER: "Autre",
};

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archive",
  SUSPENDED: "Suspendu",
};

const propertyStatusTones: Record<
  string,
  "default" | "success" | "info" | "warning" | "danger" | "muted"
> = {
  DRAFT: "warning",
  ACTIVE: "success",
  ARCHIVED: "muted",
  SUSPENDED: "danger",
};

const propertyVisualClasses = [
  "from-primary/40 via-ring/18 to-background",
  "from-chart-4/35 via-primary/14 to-background",
  "from-ring/35 via-secondary/40 to-background",
];

function formatFinanceSignedMoney(amountInCents: number) {
  const formattedAmount = formatMoney(Math.abs(amountInCents));

  return amountInCents < 0 ? `-${formattedAmount}` : `+${formattedAmount}`;
}

function getCashFlowTone(amountInCents: number) {
  return amountInCents < 0 ? "danger" : "success";
}

function getNextActionStatusLabel(status: "TODO" | "PARTIAL") {
  return status === "PARTIAL" ? "Partiellement effectue" : "A faire";
}

function getNextActionStatusTone(status: "TODO" | "PARTIAL") {
  return status === "PARTIAL" ? "warning" : "info";
}

export default async function OwnerIndexPage() {
  const [dashboard, nextActionsResult] = await Promise.all([
    getOwnerDashboardData(),
    getOwnerNextActions()
      .then((actions) => ({ actions }))
      .catch((error: unknown) => ({ error })),
  ]);

  if (!dashboard.ownerProfile || !dashboard.stats) {
    return (
      <section className="space-y-6">
        <PageHeader
          eyebrow="RentFlow"
          title="Profil proprietaire non initialise"
          description="Votre compte a acces a cet espace proprietaire, mais aucun profil proprietaire RentFlow reste rattache a cet utilisateur pour le moment."
        />
        <InfoAlert tone="warning">
          Ce blocage doit etre resolu avant de piloter vos logements depuis le
          tableau de bord.
        </InfoAlert>
      </section>
    );
  }

  if ("error" in nextActionsResult) {
    throw nextActionsResult.error;
  }

  const { stats, properties, recentActivity } = dashboard;
  const nextActions = nextActionsResult.actions.slice(0, 4);

  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="RentFlow"
        title="Tableau de bord"
        description="Voici l'essentiel de votre gestion locative aujourd'hui."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Voir les finances
            </Link>
            <Link className={buttonVariants()} href="/owner/properties/new">
              Ajouter un logement
            </Link>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeader
          title="A faire maintenant"
          description="Les prochaines actions metier importantes, dans l'ordre ou elles meritent votre attention."
        />

        {nextActions.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-4">
            {nextActions.map((action) => (
              <SpotlightCard key={action.id} tone={action.tone}>
                <ActionCard
                  actionLabel="Ouvrir"
                  className="h-full"
                  description={action.description}
                  href={action.href}
                  title={action.title}
                  tone={action.tone}
                >
                  <StatusBadge tone={getNextActionStatusTone(action.status)}>
                    {getNextActionStatusLabel(action.status)}
                  </StatusBadge>
                </ActionCard>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <SpotlightCard tone="success">
            <InfoAlert
              tone="success"
              title="Vos logements se portent a merveille !"
            >
              Aucune action urgente pour le moment. RentFlow vous signalera ici
              les prochaines actions importantes.
            </InfoAlert>
          </SpotlightCard>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/owner/finances"
            >
              Voir le detail financier
            </Link>
          }
          description="Une lecture courte du mois courant, avant le detail financier."
          title="Recapitulatif du mois"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              hint={`${stats.currentMonthSucceededPayments} paiement(s) confirme(s)`}
              icon={<CheckCircle2 className="size-5" />}
              label="Loyers encaisses"
              value={formatMoney(stats.collectedAmountInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              hint="Loyers attendus non encore confirmes comme recus"
              icon={<WalletCards className="size-5" />}
              label="A encaisser"
              value={formatMoney(stats.remainingRentAmountInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="danger">
            <StatCard
              className="h-full border-destructive/65 bg-destructive/20 shadow-destructive/10"
              hint="Depenses proprietaire du mois"
              icon={<FileText className="size-5" />}
              label="Sorties"
              value={formatMoney(stats.outgoingAmountInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone={getCashFlowTone(stats.cashFlowAmountInCents)}>
            <StatCard
              className={cn(
                "h-full",
                stats.cashFlowAmountInCents < 0
                  ? "border-destructive/75 bg-destructive/24 shadow-destructive/15"
                  : "border-primary/75 bg-primary/28 shadow-primary/15",
              )}
              hint="Loyers encaisses moins sorties du mois"
              icon={<BarChart3 className="size-5" />}
              label="Cash-flow estime"
              value={formatFinanceSignedMoney(stats.cashFlowAmountInCents)}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            properties.length > 0 ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner/properties"
              >
                Voir tous mes biens
              </Link>
            ) : null
          }
          description="Apercu rapide des derniers logements rattaches a votre profil."
          title="Mes biens"
        />

        {properties.length === 0 ? (
          <EmptyState
            action={
              <Link className={buttonVariants()} href="/owner/properties/new">
                Ajouter un logement
              </Link>
            }
            description="Ajoutez un premier bien pour commencer a suivre contrats, loyers et quittances dans le bon ordre."
            title="Aucun logement"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {properties.slice(0, 3).map((property, index) => (
              <Link
                className="group block overflow-hidden rounded-xl border border-primary/35 bg-primary/8 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/60 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={`/owner/properties/${property.id}`}
                key={property.id}
              >
                <div
                  className={cn(
                    "relative h-32 overflow-hidden bg-gradient-to-br",
                    propertyVisualClasses[index % propertyVisualClasses.length],
                  )}
                >
                  {property.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Photo du logement ${property.name}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      src={property.imageUrl}
                    />
                  ) : (
                    <>
                      <div className="absolute inset-x-6 bottom-0 h-16 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
                      <div className="absolute right-6 top-6 size-16 rounded-full border border-white/10 bg-white/10" />
                      <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/35 text-primary">
                        <Building2 className="size-5" />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold tracking-normal">
                        {property.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {property.city} -{" "}
                        {propertyTypeLabels[property.propertyType] ??
                          property.propertyType}
                      </p>
                    </div>
                    <StatusBadge
                      tone={propertyStatusTones[property.status] ?? "default"}
                    >
                      {propertyStatusLabels[property.status] ?? property.status}
                    </StatusBadge>
                  </div>

                  <dl className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Contrats</dt>
                      <dd className="mt-1 font-medium">
                        {property._count.rentalContracts}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Paiements</dt>
                      <dd className="mt-1 font-medium">
                        {property._count.payments}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Colocation</dt>
                      <dd className="mt-1 font-medium">
                        {property.isColocation ? "Oui" : "Non"}
                      </dd>
                    </div>
                  </dl>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                    Voir le detail
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Activite recente"
          description="Derniers evenements du mois sur vos biens."
        />
        {recentActivity.length === 0 ? (
          <EmptyState
            title="Aucune activite pour ce mois."
            description="Les paiements, quittances et autres evenements apparaitront ici."
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {recentActivity.map((activity) => (
              <SpotlightCard key={activity.id} tone="info">
                <article className="rounded-xl border border-ring/40 bg-ring/10 p-4 text-card-foreground shadow-sm shadow-black/10">
                  <h3 className="font-medium text-foreground">
                    {activity.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Les raccourcis utiles pour continuer sans chercher dans toute l'application."
          title="Actions rapides"
        />
        <OwnerQuickActions />
      </section>
    </section>
  );
}
