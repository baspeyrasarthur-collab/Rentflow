import Link from "next/link";
import { Building2, FileText, PauseCircle, Pencil } from "lucide-react";

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
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerContractsOverview } from "@/server/owner/contracts-overview";

const contractTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  COLOCATION: "Colocation",
};

const contractStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Resiliation demandee",
  TERMINATED: "Termine",
  ARCHIVED: "Archive",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "Non renseignee";
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "DRAFT") {
    return "warning" as const;
  }

  if (status === "SUSPENDED" || status === "TERMINATION_REQUESTED") {
    return "danger" as const;
  }

  if (status === "TERMINATED" || status === "ARCHIVED") {
    return "muted" as const;
  }

  return "info" as const;
}

function getSpotlightTone(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

async function getContractsForPage() {
  try {
    return await getOwnerContractsOverview();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerContractsPage() {
  const contracts = await getContractsForPage();
  const firstDraftContract = contracts.draftContracts[0] ?? null;
  const firstContractWithoutTenant =
    contracts.contractsWithoutActiveTenant[0] ?? null;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Contrats"
        title="Contrats"
        description="Suivez les contrats lies a vos logements et identifiez ceux qui doivent etre completes."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Voir les biens
            </Link>
            <Link className={buttonVariants()} href="/owner/contracts/new">
              Creer un contrat
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Creation rattachee a un logement">
          Un contrat est toujours rattache a un logement. Vous pouvez choisir le
          bien depuis la page de creation, puis ouvrir le formulaire du logement
          concerne.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Resume contrats"
          description="Les statuts principaux de vos contrats owner."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<FileText className="size-5" />}
              label="Total contrats"
              value={contracts.summary.totalContracts}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<Pencil className="size-5" />}
              label="Brouillons"
              value={contracts.summary.draftContracts}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              label="Actifs"
              value={contracts.summary.activeContracts}
            />
          </SpotlightCard>
          <SpotlightCard tone="default">
            <StatCard
              className="h-full border-border bg-muted/40"
              icon={<PauseCircle className="size-5" />}
              label="Suspendus / termines"
              value={contracts.summary.pausedOrFinishedContracts}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur vos contrats"
          description="Les contrats qui demandent une suite visible."
        />
        {!firstDraftContract && !firstContractWithoutTenant ? (
          <EmptyState
            title="Aucune action prioritaire"
            description="Les contrats a completer ou sans locataire apparaitront ici."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {firstDraftContract ? (
              <SpotlightCard tone="warning">
                <ActionCard
                  title={`${contracts.draftContracts.length} contrat(s) brouillon(s)`}
                  description="Completez les contrats encore en brouillon avant de poursuivre le parcours locataire."
                  href={`/owner/properties/${firstDraftContract.property.id}/contracts/${firstDraftContract.id}`}
                  actionLabel="Ouvrir le premier"
                  icon={<Pencil className="size-5" />}
                  tone="warning"
                />
              </SpotlightCard>
            ) : null}
            {firstContractWithoutTenant ? (
              <SpotlightCard tone="info">
                <ActionCard
                  title="Contrat sans locataire"
                  description="Ouvrez le contrat pour poursuivre le rattachement locataire selon le workflow existant."
                  href={`/owner/properties/${firstContractWithoutTenant.property.id}/contracts/${firstContractWithoutTenant.id}`}
                  actionLabel="Voir le contrat"
                  icon={<Building2 className="size-5" />}
                  tone="info"
                />
              </SpotlightCard>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Liste des contrats"
          description="Contrats rattaches a vos logements, classes par derniere mise a jour."
        />
        {contracts.contracts.length === 0 ? (
          <EmptyState
            title="Aucun contrat"
            description="Ouvrez un logement pour creer un premier contrat."
            action={
              <Link className={buttonVariants()} href="/owner/contracts/new">
                Creer un contrat
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {contracts.contracts.map((contract) => (
              <SpotlightCard
                key={contract.id}
                tone={getSpotlightTone(contract.status)}
              >
                <article className="h-full rounded-xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {contract.property.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {contract.property.city} -{" "}
                        {contractTypeLabels[contract.contractType] ??
                          contract.contractType}
                      </p>
                      <div className="mt-3">
                        <StatusBadge tone={getStatusTone(contract.status)}>
                          {contractStatusLabels[contract.status] ??
                            contract.status}
                        </StatusBadge>
                      </div>
                    </div>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href={`/owner/properties/${contract.property.id}/contracts/${contract.id}`}
                    >
                      Voir le contrat
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Periode</p>
                      <p className="font-medium text-foreground">
                        {formatDate(contract.startDate)} -{" "}
                        {formatOptionalDate(contract.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Loyer</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(
                          contract.totalRentAmountInCents,
                          contract.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Charges</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(
                          contract.totalChargesAmountInCents,
                          contract.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Jour paiement</p>
                      <p className="font-medium text-foreground">
                        Jour {contract.paymentDayOfMonth}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Locataires</p>
                      <p className="font-medium text-foreground">
                        {contract._count.contractTenants}
                      </p>
                    </div>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Actions rapides"
          description="Raccourcis vers les prochaines actions du parcours owner."
        />
        <OwnerQuickActions />
      </section>
    </section>
  );
}
