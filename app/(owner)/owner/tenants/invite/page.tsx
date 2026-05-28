import Link from "next/link";
import { FileText, Home, UserPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InfoAlert,
  OwnerQuickActions,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { getOwnerTenantInvitationContractOptions } from "@/server/owner/tenant-invitations";

const contractStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archive",
};

export default async function OwnerTenantInvitePage() {
  const contracts = await getOwnerTenantInvitationContractOptions();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Locataires"
        title="Inviter un locataire"
        description="Choisissez d'abord le contrat concerne, puis renseignez les informations du locataire."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/tenants"
            >
              Retour locataires
            </Link>
            <Link className={buttonVariants()} href="/owner/contracts">
              Voir les contrats
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Parcours guide">
          Choisissez d&apos;abord le contrat concerne. L&apos;invitation sera
          ensuite envoyee depuis le parcours contrat existant, avec les memes
          controles de securite et d&apos;email.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Contrats prets pour invitation"
          description="Seuls les contrats brouillon individuels, sans locataire actif ni invitation active, sont proposes ici."
        />

        {contracts.length === 0 ? (
          <EmptyState
            title="Aucun contrat pret pour invitation"
            description="Creez ou completez un contrat brouillon avant d'inviter un locataire."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link className={buttonVariants()} href="/owner/contracts/new">
                  Creer un contrat
                </Link>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/owner/contracts"
                >
                  Voir les contrats
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {contracts.map((contract) => (
              <SpotlightCard key={contract.id} tone="info">
                <article className="h-full rounded-xl border border-ring/40 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Home className="size-4 text-primary" />
                        <span className="truncate">
                          {contract.property.name} - {contract.property.city}
                        </span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-normal text-foreground">
                        Contrat individuel
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone="warning">
                          {contractStatusLabels[contract.status] ??
                            contract.status}
                        </StatusBadge>
                        <StatusBadge tone="info">
                          Invitation disponible
                        </StatusBadge>
                      </div>
                    </div>

                    <Link
                      className={buttonVariants({ size: "sm" })}
                      href={`/owner/properties/${contract.propertyId}/contracts/${contract.id}/invitations/new`}
                    >
                      Inviter sur ce contrat
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-3">
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
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Continuer autrement"
          description="Vous pouvez aussi repartir des contrats ou des logements si le dossier n'est pas encore pret."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SpotlightCard href="/owner/contracts" tone="info">
            <div className="flex h-full items-start gap-4 rounded-xl border border-ring/45 bg-ring/12 p-5 text-card-foreground shadow-sm shadow-black/10">
              <FileText className="mt-1 size-5 shrink-0 text-ring" />
              <div>
                <h2 className="font-semibold tracking-normal text-foreground">
                  Voir les contrats
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Retrouvez les contrats brouillon, actifs ou a completer.
                </p>
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard href="/owner/properties" tone="success">
            <div className="flex h-full items-start gap-4 rounded-xl border border-primary/50 bg-primary/14 p-5 text-card-foreground shadow-sm shadow-black/10">
              <UserPlus className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="font-semibold tracking-normal text-foreground">
                  Voir les logements
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Ouvrez un logement pour verifier son contrat et son parcours
                  locataire.
                </p>
              </div>
            </div>
          </SpotlightCard>
        </div>
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
