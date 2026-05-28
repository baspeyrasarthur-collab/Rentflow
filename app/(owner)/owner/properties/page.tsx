import Link from "next/link";
import { Archive, Building2, FileText, Home, WalletCards } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerPropertyCompletionState } from "@/server/owner/property-completeness";
import { listOwnerProperties } from "@/server/owner/properties";

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

const propertyVisualClasses = [
  "from-primary/40 via-ring/18 to-background",
  "from-chart-4/35 via-primary/14 to-background",
  "from-ring/35 via-secondary/40 to-background",
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortAddress(property: {
  addressLine1: string;
  postalCode: string;
  city: string;
}) {
  return `${property.addressLine1}, ${property.postalCode} ${property.city}`;
}

function getPropertyStatusTone(status: string) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "SUSPENDED") {
    return "danger" as const;
  }

  if (status === "ARCHIVED") {
    return "muted" as const;
  }

  return "info" as const;
}

function PropertyVisual({
  imageUrl,
  index,
  name,
  status,
}: {
  imageUrl: string | null;
  index: number;
  name: string;
  status: string;
}) {
  return (
    <div
      className={cn(
        "relative h-32 overflow-hidden bg-gradient-to-br",
        propertyVisualClasses[index % propertyVisualClasses.length],
        status === "ARCHIVED" ? "grayscale" : "",
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Photo du logement ${name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={imageUrl}
        />
      ) : (
        <>
          <div className="absolute inset-x-7 bottom-0 h-20 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
          <div className="absolute bottom-8 right-8 h-16 w-24 rounded-t-xl border border-white/10 bg-white/10" />
          <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/35 text-primary shadow-sm shadow-black/20">
            <Building2 className="size-5" />
          </div>
        </>
      )}
    </div>
  );
}

async function getPropertiesForPage() {
  try {
    return await listOwnerProperties();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerPropertiesPage() {
  const properties = await getPropertiesForPage();
  const activeProperties = properties.filter(
    (property) => property.status === "ACTIVE",
  );
  const draftProperties = properties.filter(
    (property) => property.status === "DRAFT",
  );
  const archivedProperties = properties.filter(
    (property) => property.status === "ARCHIVED",
  );
  const firstDraftProperty =
    draftProperties.find(
      (property) => !getOwnerPropertyCompletionState(property).isComplete,
    ) ?? null;
  const firstDraftPropertyCompletion = firstDraftProperty
    ? getOwnerPropertyCompletionState(firstDraftProperty)
    : null;
  const firstDraftPropertyHref =
    firstDraftProperty && firstDraftPropertyCompletion
      ? firstDraftPropertyCompletion.missingRequiredFields.length > 0
        ? `/owner/properties/${firstDraftProperty.id}/edit?focus=missing-fields`
        : `/owner/properties/${firstDraftProperty.id}/edit?focus=characteristics`
      : null;
  const firstPropertyWithoutContract =
    properties.find(
      (property) =>
        property.status !== "ARCHIVED" && property._count.rentalContracts === 0,
    ) ?? null;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Logements"
        title="Mes logements"
        description="Suivez vos biens, leurs statuts et les prochaines etapes de gestion."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Voir les finances
            </Link>
            <Link
              className={buttonVariants({
                className: "w-fit shadow-lg shadow-primary/15",
              })}
              href="/owner/properties/new"
            >
              Ajouter un logement
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Point de depart de votre gestion">
          <p>
            Chaque logement sert de point de depart pour creer un contrat,
            inviter un locataire, suivre les paiements et generer les
            quittances.
          </p>
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Resume logements"
          description="Une vue courte de l'etat de votre portefeuille locatif."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<Building2 className="size-5" />}
              label="Total logements"
              value={properties.length}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<Home className="size-5" />}
              label="Actifs"
              value={activeProperties.length}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<FileText className="size-5" />}
              label="Brouillons"
              value={draftProperties.length}
            />
          </SpotlightCard>
          <SpotlightCard tone="default">
            <StatCard
              className="h-full border-border bg-muted/40"
              icon={<Archive className="size-5" />}
              label="Archives"
              value={archivedProperties.length}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur vos logements"
          description="Les prochaines etapes utiles selon l'etat actuel de vos biens."
        />

        {properties.length === 0 ? (
          <SpotlightCard tone="info">
            <ActionCard
              title="Ajouter votre premier logement"
              description="Creez un premier brouillon pour ensuite ajouter un contrat, un locataire, des paiements et des quittances."
              href="/owner/properties/new"
              actionLabel="Ajouter un logement"
              tone="info"
            />
          </SpotlightCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {firstDraftProperty ? (
              <SpotlightCard tone="warning">
                <ActionCard
                  title={`${draftProperties.length} logement(s) brouillon(s)`}
                  description={
                    firstDraftPropertyCompletion?.missingRequiredFields.length
                      ? "Completez les informations obligatoires du logement avant de poursuivre le dossier."
                      : "Les informations principales sont presentes ; verifiez les caracteristiques du logement."
                  }
                  href={firstDraftPropertyHref ?? "/owner/properties"}
                  actionLabel={
                    firstDraftPropertyCompletion?.missingRequiredFields.length
                      ? "Completer"
                      : "Verifier"
                  }
                  icon={<FileText className="size-5" />}
                  tone="warning"
                />
              </SpotlightCard>
            ) : null}

            {firstPropertyWithoutContract ? (
              <SpotlightCard tone="info">
                <ActionCard
                  title="Contrat a creer"
                  description="Un logement sans contrat ne peut pas encore guider invitation, paiements et quittances."
                  href={`/owner/properties/${firstPropertyWithoutContract.id}`}
                  actionLabel="Ouvrir le logement"
                  icon={<Building2 className="size-5" />}
                  tone="info"
                />
              </SpotlightCard>
            ) : null}

            {activeProperties.length > 0 ? (
              <SpotlightCard tone="success">
                <ActionCard
                  title="Suivre les finances"
                  description="Retrouvez les loyers, sorties et cash-flow estimes de vos biens actifs."
                  href="/owner/finances"
                  actionLabel="Voir les finances"
                  icon={<WalletCards className="size-5" />}
                  tone="success"
                />
              </SpotlightCard>
            ) : null}

            {!firstDraftProperty &&
            !firstPropertyWithoutContract &&
            activeProperties.length === 0 ? (
              <EmptyState
                title="Aucune action prioritaire"
                description="RentFlow affichera ici les prochaines actions lorsque vos logements demanderont une suite."
              />
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Liste des logements"
          description={`${properties.length} logement${properties.length > 1 ? "s" : ""} rattache${properties.length > 1 ? "s" : ""} a votre profil proprietaire.`}
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "sm" })}
                href="/owner/properties/new"
              >
                Ajouter un logement
              </Link>
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner"
              >
                Retour dashboard
              </Link>
            </div>
          }
        />

        {properties.length === 0 ? (
          <EmptyState
            title="Aucun logement"
            description="Votre premier logement permettra ensuite de creer un contrat, rattacher un locataire, suivre les paiements et generer les quittances."
            action={
              <Link className={buttonVariants()} href="/owner/properties/new">
                Ajouter un logement
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {properties.map((property, index) => (
              <Link
                className="group block h-full overflow-hidden rounded-xl border border-primary/35 bg-primary/8 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/60 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                href={`/owner/properties/${property.id}`}
                key={property.id}
              >
                <PropertyVisual
                  imageUrl={property.imageUrl}
                  index={index}
                  name={property.name}
                  status={property.status}
                />
                <div className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-normal text-foreground">
                          {property.name}
                        </h3>
                        <StatusBadge
                          tone={getPropertyStatusTone(property.status)}
                        >
                          {propertyStatusLabels[property.status] ??
                            property.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {formatShortAddress(property)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone="info">
                          {propertyTypeLabels[property.propertyType] ??
                            property.propertyType}
                        </StatusBadge>
                        <StatusBadge
                          tone={property.furnished ? "success" : "muted"}
                        >
                          {property.furnished ? "Meuble" : "Non meuble"}
                        </StatusBadge>
                        <StatusBadge
                          tone={property.isColocation ? "warning" : "muted"}
                        >
                          {property.isColocation
                            ? "Colocation"
                            : "Hors colocation"}
                        </StatusBadge>
                      </div>
                    </div>
                    <span
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                    >
                      Voir le detail
                    </span>
                  </div>

                  <div className="grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Contrats</p>
                      <p className="mt-1 font-medium text-foreground">
                        {property._count.rentalContracts}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paiements</p>
                      <p className="mt-1 font-medium text-foreground">
                        {property._count.payments}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quittances</p>
                      <p className="mt-1 font-medium text-foreground">
                        {property._count.receipts}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Invitations</p>
                      <p className="mt-1 font-medium text-foreground">
                        {property._count.invitations}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Mis a jour le {formatDate(property.updatedAt)}
                  </p>
                </div>
              </Link>
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
