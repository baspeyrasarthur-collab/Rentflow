import Link from "next/link";
import { Home } from "lucide-react";

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
import { listOwnerPropertiesForContractCreation } from "@/server/owner/contracts";

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  OTHER: "Autre",
};

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
};

function getPropertyStatusTone(status: string) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "DRAFT") {
    return "warning" as const;
  }

  return "info" as const;
}

export default async function NewOwnerContractPage() {
  const properties = await listOwnerPropertiesForContractCreation();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Contrats"
        title="Creer un contrat"
        description="Choisissez le logement a rattacher au contrat avant d'ouvrir le formulaire de creation."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/contracts"
            >
              Retour contrats
            </Link>
            <Link className={buttonVariants()} href="/owner/properties">
              Voir les logements
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Rattachement du logement">
          Choisissez le logement concerne. Vous pourrez revenir ici si vous vous
          etes trompe de bien avant de creer le brouillon de contrat.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Logements disponibles"
          description="Les logements archives sont exclus de la creation de nouveaux contrats."
        />

        {properties.length === 0 ? (
          <EmptyState
            title="Aucun logement disponible"
            description="Ajoutez un logement actif ou brouillon avant de creer un contrat."
            action={
              <Link className={buttonVariants()} href="/owner/properties/new">
                Ajouter un logement
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {properties.map((property) => (
              <SpotlightCard key={property.id} tone="info">
                <article className="h-full rounded-xl border border-ring/40 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Home className="size-4 text-primary" />
                        <span className="truncate">{property.city}</span>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold tracking-normal text-foreground">
                        {property.name}
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          tone={getPropertyStatusTone(property.status)}
                        >
                          {propertyStatusLabels[property.status] ??
                            property.status}
                        </StatusBadge>
                        <StatusBadge tone="info">
                          {propertyTypeLabels[property.propertyType] ??
                            property.propertyType}
                        </StatusBadge>
                      </div>
                    </div>

                    <Link
                      className={buttonVariants({ size: "sm" })}
                      href={`/owner/properties/${property.id}/contracts/new`}
                    >
                      Creer pour ce logement
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Contrats</p>
                      <p className="font-medium text-foreground">
                        {property._count.rentalContracts}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Meuble</p>
                      <p className="font-medium text-foreground">
                        {property.furnished ? "Oui" : "Non"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Colocation</p>
                      <p className="font-medium text-foreground">
                        {property.isColocation ? "Oui" : "Non"}
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
