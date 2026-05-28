import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Camera, FileText, Home, Pencil } from "lucide-react";

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
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerPropertyCompletionState } from "@/server/owner/property-completeness";
import { getOwnerPropertyById } from "@/server/owner/properties";

import {
  archiveOwnerPropertyAction,
  deleteOwnerPropertyPermanentlyAction,
  removeOwnerPropertyImageAction,
  updateOwnerPropertyImageAction,
} from "./actions";

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

const paymentStatusLabels: Record<string, string> = {
  PLANNED: "Planifie",
  PENDING: "En attente",
  PROCESSING: "En traitement",
  SUCCEEDED: "Recu",
  FAILED: "Echoue",
  CANCELED: "Annule",
  REFUNDED: "Rembourse",
  DISPUTED: "Conteste",
};

const paymentTypeLabels: Record<string, string> = {
  RENT: "Loyer et charges",
  CHARGES: "Charges",
  DEPOSIT: "Depot",
  ONE_OFF_EXPENSE: "Depense ponctuelle",
};

const invitationStatusLabels: Record<string, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptee",
  EXPIRED: "Expiree",
  REVOKED: "Revoquee",
};

const propertyVisualClasses: Record<string, string> = {
  ACTIVE: "from-primary/45 via-ring/18 to-background",
  DRAFT: "from-chart-4/40 via-primary/12 to-background",
  SUSPENDED: "from-destructive/38 via-chart-4/14 to-background",
  ARCHIVED: "from-muted/70 via-secondary/30 to-background",
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
  if (status === "ACTIVE" || status === "SUCCEEDED" || status === "ACCEPTED") {
    return "success" as const;
  }

  if (status === "FAILED" || status === "DISPUTED" || status === "SUSPENDED") {
    return "danger" as const;
  }

  if (status === "DRAFT" || status === "PENDING" || status === "PLANNED") {
    return "warning" as const;
  }

  if (
    status === "ARCHIVED" ||
    status === "TERMINATED" ||
    status === "EXPIRED" ||
    status === "REVOKED"
  ) {
    return "muted" as const;
  }

  return "info" as const;
}

function getPropertySpotlightTone(status: string) {
  if (status === "ACTIVE") {
    return "success" as const;
  }

  if (status === "DRAFT") {
    return "warning" as const;
  }

  if (status === "SUSPENDED") {
    return "danger" as const;
  }

  return "default" as const;
}

function getSpotlightToneFromStatus(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

function PropertyHeroVisual({
  imageUrl,
  name,
  status,
}: {
  imageUrl: string | null;
  name: string;
  status: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-44 overflow-hidden rounded-xl border bg-gradient-to-br shadow-xl shadow-black/20",
        propertyVisualClasses[status] ?? propertyVisualClasses.ACTIVE,
        status === "ARCHIVED" ? "border-border grayscale" : "border-primary/35",
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Photo du logement ${name}`}
          className="h-full min-h-44 w-full object-cover"
          src={imageUrl}
        />
      ) : (
        <>
          <div className="absolute inset-x-10 bottom-0 h-32 rounded-t-3xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
          <div className="absolute bottom-12 right-12 h-24 w-36 rounded-t-2xl border border-white/10 bg-white/10 shadow-xl shadow-black/20" />
          <div className="absolute left-8 top-8 flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-background/40 text-primary shadow-sm shadow-black/25 backdrop-blur-sm">
            <Building2 className="size-7" />
          </div>
          <div className="absolute bottom-5 left-5 max-w-md">
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Visuel logement
            </p>
            <p className="mt-1.5 text-lg font-semibold tracking-normal text-foreground">
              Photo du logement
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function getSurfaceLabel(surfaceAreaSqm: number | null) {
  return surfaceAreaSqm ? `${surfaceAreaSqm} m2` : "Non renseignee";
}

function getContractPeriodLabel(contract: {
  startDate: Date;
  endDate: Date | null;
}) {
  return `${formatDate(contract.startDate)} - ${formatOptionalDate(
    contract.endDate,
  )}`;
}

function getInvitationTenantLabel(invitation: {
  tenantEmail: string;
  tenantFirstName: string | null;
  tenantLastName: string | null;
}) {
  const name = [invitation.tenantFirstName, invitation.tenantLastName]
    .filter(Boolean)
    .join(" ");

  return name || invitation.tenantEmail;
}

async function getPropertyForPage(propertyId: string) {
  try {
    return await getOwnerPropertyById(propertyId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyForPage(id);

  if (!property) {
    notFound();
  }

  const archiveAction = archiveOwnerPropertyAction.bind(null, property.id);
  const deleteAction = deleteOwnerPropertyPermanentlyAction.bind(
    null,
    property.id,
  );
  const propertyPath = `/owner/properties/${property.id}`;
  const isArchived = property.status === "ARCHIVED";
  const draftContract = property.rentalContracts.find(
    (contract) => contract.status === "DRAFT",
  );
  const firstContract = property.rentalContracts[0] ?? null;
  const hasNoContracts = property.rentalContracts.length === 0;
  const propertyCompletion = getOwnerPropertyCompletionState(property);
  const propertyCompletionAction =
    propertyCompletion.missingRequiredFields.length > 0
      ? {
          title: "Completer le logement",
          description:
            "Certaines informations obligatoires manquent encore avant de poursuivre sereinement.",
          href: `${propertyPath}/edit?focus=missing-fields`,
          actionLabel: "Completer",
          tone: "warning" as const,
        }
      : propertyCompletion.missingSecondaryFields.length > 0
        ? {
            title: "Verifier les caracteristiques",
            description:
              "Les informations principales sont presentes ; verifiez les caracteristiques du logement.",
            href: `${propertyPath}/edit?focus=characteristics`,
            actionLabel: "Verifier",
            tone: "warning" as const,
          }
        : null;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Detail logement"
        title={property.name}
        description={`${property.city} - ${
          propertyTypeLabels[property.propertyType] ?? property.propertyType
        } - ${propertyStatusLabels[property.status] ?? property.status}`}
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Retour logements
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`${propertyPath}/edit`}
            >
              Modifier
            </Link>
            {!isArchived ? (
              <Link
                className={buttonVariants()}
                href={`${propertyPath}/contracts/new`}
              >
                Creer un contrat
              </Link>
            ) : null}
          </>
        }
      />

      {isArchived ? (
        <SpotlightCard tone="default">
          <InfoAlert title="Logement archive" tone="warning">
            <p>
              Ce logement est archive. Son historique reste consultable, mais
              les nouvelles actions de gestion sont limitees.
            </p>
            <p className="mt-2">
              Ce n&apos;est pas une suppression : les donnees sont conservees et
              certaines actions peuvent etre indisponibles.
            </p>
          </InfoAlert>
        </SpotlightCard>
      ) : null}

      <SpotlightCard tone="info">
        <InfoAlert title="Point de depart du dossier logement" tone="info">
          <p>
            Ce logement sert de point de depart pour creer un contrat, inviter
            un locataire, suivre les paiements et generer les quittances.
          </p>
          {property.status === "DRAFT" && !propertyCompletion.isComplete ? (
            <p className="mt-2">
              Le logement est encore en brouillon : completez ses informations
              avant de l&apos;exploiter pleinement.
            </p>
          ) : null}
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Synthese logement"
          description="Les informations utiles avant de traiter les prochaines actions."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <SpotlightCard tone={getPropertySpotlightTone(property.status)}>
            <StatCard
              className={cn(
                "h-full",
                property.status === "ACTIVE"
                  ? "border-primary/70 bg-primary/26 shadow-primary/15"
                  : property.status === "DRAFT"
                    ? "border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
                    : property.status === "SUSPENDED"
                      ? "border-destructive/70 bg-destructive/24 shadow-destructive/15"
                      : "border-border bg-muted/40",
              )}
              icon={<Home className="size-5" />}
              label="Statut"
              value={propertyStatusLabels[property.status] ?? property.status}
              hint={isArchived ? "Historique conserve" : "Dossier actif"}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/55 bg-ring/18 shadow-ring/10"
              icon={<Building2 className="size-5" />}
              label="Type"
              value={
                propertyTypeLabels[property.propertyType] ??
                property.propertyType
              }
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/45 bg-ring/14"
              label="Ville"
              value={property.city}
            />
          </SpotlightCard>
          <SpotlightCard tone="default">
            <StatCard
              className="h-full border-border bg-card"
              label="Surface"
              value={getSurfaceLabel(property.surfaceAreaSqm)}
            />
          </SpotlightCard>
          <SpotlightCard tone={property.isColocation ? "warning" : "default"}>
            <StatCard
              className="h-full border-chart-4/45 bg-chart-4/12"
              label="Colocation"
              value={property.isColocation ? "Oui" : "Non"}
            />
          </SpotlightCard>
          <SpotlightCard tone={property.furnished ? "success" : "default"}>
            <StatCard
              className="h-full border-primary/45 bg-primary/12"
              label="Meuble"
              value={property.furnished ? "Oui" : "Non"}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur ce logement"
          description="Les prochaines etapes utiles pour avancer dans le bon ordre."
        />
        {isArchived ? (
          <EmptyState
            title="Logement archive"
            description="Ce logement reste disponible en consultation, sans nouvelle action de gestion depuis cette page."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {propertyCompletionAction ? (
              <SpotlightCard tone={propertyCompletionAction.tone}>
                <ActionCard
                  title={propertyCompletionAction.title}
                  description={propertyCompletionAction.description}
                  href={propertyCompletionAction.href}
                  actionLabel={propertyCompletionAction.actionLabel}
                  icon={<Pencil className="size-5" />}
                  tone={propertyCompletionAction.tone}
                />
              </SpotlightCard>
            ) : null}

            {hasNoContracts ? (
              <SpotlightCard tone="success">
                <ActionCard
                  title="Creer un contrat"
                  description="Ajoutez le contrat individuel qui servira ensuite aux invitations, paiements et quittances."
                  href={`${propertyPath}/contracts/new`}
                  actionLabel="Creer un contrat"
                  icon={<FileText className="size-5" />}
                  tone="success"
                />
              </SpotlightCard>
            ) : null}

            {draftContract ? (
              <SpotlightCard tone="warning">
                <ActionCard
                  title="Ouvrir le contrat brouillon"
                  description="Finalisez le contrat rattache a ce logement avant de poursuivre le suivi."
                  href={`${propertyPath}/contracts/${draftContract.id}`}
                  actionLabel="Voir le contrat"
                  icon={<FileText className="size-5" />}
                  tone="warning"
                />
              </SpotlightCard>
            ) : null}

            {!draftContract && firstContract ? (
              <SpotlightCard tone="info">
                <ActionCard
                  title="Consulter le contrat"
                  description="Accedez au suivi des locataires, paiements et quittances du contrat le plus recent."
                  href={`${propertyPath}/contracts/${firstContract.id}`}
                  actionLabel="Voir le contrat"
                  icon={<FileText className="size-5" />}
                  tone="info"
                />
              </SpotlightCard>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Informations du bien"
          description="Adresse, caracteristiques, photo et historique du dossier logement."
        />
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
          <article className="h-full rounded-xl border border-primary/35 bg-primary/8 p-4 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/60 hover:shadow-xl hover:shadow-black/20">
            <PropertyHeroVisual
              imageUrl={property.imageUrl}
              name={property.name}
              status={property.status}
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/55 bg-primary/24 text-primary">
                  <Camera className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-normal text-foreground">
                    Photo du logement
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {property.imageUrl
                      ? "Photo visible par les locataires rattaches."
                      : "Ajoutez une photo pour rendre le logement plus identifiable."}
                  </p>
                </div>
              </div>
              <StatusBadge tone={property.imageUrl ? "success" : "info"}>
                {property.imageUrl ? "Configuree" : "Optionnelle"}
              </StatusBadge>
            </div>
            <form
              action={updateOwnerPropertyImageAction}
              className="mt-4 space-y-3 rounded-lg border border-border/80 bg-background/45 p-3"
            >
              <input name="propertyId" type="hidden" value={property.id} />
              <label className="grid gap-2 text-sm text-muted-foreground">
                <span>
                  {property.imageUrl
                    ? "Remplacer la photo"
                    : "Ajouter une photo"}
                </span>
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
                  name="image"
                  required
                  type="file"
                />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">
                Formats acceptes : JPG, PNG, WebP. Taille maximale : 5 Mo.
              </p>
              <button className={buttonVariants({ size: "sm" })} type="submit">
                {property.imageUrl ? "Remplacer la photo" : "Ajouter une photo"}
              </button>
            </form>
            {property.imageUrl ? (
              <form
                action={removeOwnerPropertyImageAction}
                className="mt-3 space-y-3 rounded-lg border border-destructive/35 bg-destructive/10 p-3"
              >
                <input name="propertyId" type="hidden" value={property.id} />
                <label className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                  <input
                    className="mt-1 size-4 shrink-0 accent-primary"
                    name="confirmRemoveImage"
                    required
                    type="checkbox"
                  />
                  <span>
                    Je confirme vouloir supprimer la photo du logement.
                  </span>
                </label>
                <button
                  className={buttonVariants({
                    variant: "destructive",
                    size: "sm",
                  })}
                  type="submit"
                >
                  Supprimer la photo
                </button>
              </form>
            ) : null}
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <SpotlightCard tone="info">
              <article className="h-full rounded-xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="font-semibold tracking-normal text-foreground">
                    Adresse
                  </h3>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`${propertyPath}/edit`}
                  >
                    Modifier les informations
                  </Link>
                </div>
                <dl className="mt-4 grid gap-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Adresse</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {property.addressLine1}
                    </dd>
                  </div>
                  {property.addressLine2 ? (
                    <div>
                      <dt className="text-muted-foreground">Complement</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {property.addressLine2}
                      </dd>
                    </div>
                  ) : null}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Code postal</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {property.postalCode}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Ville</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {property.city}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Pays</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {property.country}
                    </dd>
                  </div>
                </dl>
              </article>
            </SpotlightCard>

            <SpotlightCard tone={getPropertySpotlightTone(property.status)}>
              <article className="h-full rounded-xl border border-primary/35 bg-primary/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="font-semibold tracking-normal text-foreground">
                    Caracteristiques
                  </h3>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href={`${propertyPath}/edit`}
                  >
                    Modifier les caracteristiques
                  </Link>
                </div>
                <dl className="mt-4 grid gap-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Statut</dt>
                    <dd>
                      <StatusBadge tone={getStatusTone(property.status)}>
                        {propertyStatusLabels[property.status] ??
                          property.status}
                      </StatusBadge>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium text-foreground">
                      {propertyTypeLabels[property.propertyType] ??
                        property.propertyType}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Surface</dt>
                    <dd className="font-medium text-foreground">
                      {getSurfaceLabel(property.surfaceAreaSqm)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Meuble</dt>
                    <dd className="font-medium text-foreground">
                      {property.furnished ? "Oui" : "Non"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Colocation</dt>
                    <dd className="font-medium text-foreground">
                      {property.isColocation ? "Oui" : "Non"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Cree le</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(property.createdAt)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Mis a jour le</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(property.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </article>
            </SpotlightCard>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Contrats"
          description="Contrats rattaches a ce logement et acces au suivi detaille."
          action={
            !isArchived ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`${propertyPath}/contracts/new`}
              >
                Creer un contrat individuel
              </Link>
            ) : null
          }
        />

        {property.rentalContracts.length === 0 ? (
          <EmptyState
            title="Aucun contrat rattache"
            description="Creez un contrat pour pouvoir inviter un locataire, suivre les paiements et generer les quittances."
            action={
              !isArchived ? (
                <Link
                  className={buttonVariants()}
                  href={`${propertyPath}/contracts/new`}
                >
                  Creer un contrat
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {property.rentalContracts.map((contract) => (
              <SpotlightCard
                key={contract.id}
                tone={getSpotlightToneFromStatus(contract.status)}
              >
                <article className="h-full rounded-xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {contractTypeLabels[contract.contractType] ??
                            contract.contractType}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getContractPeriodLabel(contract)}
                        </p>
                      </div>
                      <StatusBadge tone={getStatusTone(contract.status)}>
                        {contractStatusLabels[contract.status] ??
                          contract.status}
                      </StatusBadge>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        href={`${propertyPath}/contracts/${contract.id}`}
                      >
                        Voir le contrat
                      </Link>
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        href={`${propertyPath}/contracts/${contract.id}/edit`}
                      >
                        Modifier le contrat
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Loyer</p>
                      <p className="mt-1 font-medium text-foreground">
                        {formatMoney(
                          contract.totalRentAmountInCents,
                          contract.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Charges</p>
                      <p className="mt-1 font-medium text-foreground">
                        {formatMoney(
                          contract.totalChargesAmountInCents,
                          contract.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paiement</p>
                      <p className="mt-1 font-medium text-foreground">
                        Jour {contract.paymentDayOfMonth}
                      </p>
                    </div>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
        {!isArchived ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Le rattachement d&apos;un contrat existant pourra etre ajoute plus
            tard. Pour l&apos;instant, creez un contrat depuis ce logement.
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Locataires"
          description="Invitations et rattachements locataires restent pilotes depuis les contrats."
          action={
            !isArchived && draftContract ? (
              <Link
                className={buttonVariants({ size: "sm" })}
                href={`${propertyPath}/contracts/${draftContract.id}/invitations/new`}
              >
                Inviter un locataire
              </Link>
            ) : !isArchived && firstContract ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`${propertyPath}/contracts/${firstContract.id}`}
              >
                Inviter depuis le contrat
              </Link>
            ) : !isArchived ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`${propertyPath}/contracts/new`}
              >
                Creer un contrat d&apos;abord
              </Link>
            ) : null
          }
        />

        {property.invitations.length === 0 ? (
          <SpotlightCard tone="info">
            <EmptyState
              title="Aucun locataire invite"
              description="Les invitations locataire se creent depuis un contrat. Creez ou ouvrez un contrat pour inviter un locataire."
              action={
                !isArchived && draftContract ? (
                  <Link
                    className={buttonVariants()}
                    href={`${propertyPath}/contracts/${draftContract.id}/invitations/new`}
                  >
                    Inviter un locataire
                  </Link>
                ) : !isArchived && firstContract ? (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={`${propertyPath}/contracts/${firstContract.id}`}
                  >
                    Inviter depuis le contrat
                  </Link>
                ) : !isArchived ? (
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href={`${propertyPath}/contracts/new`}
                  >
                    Creer un contrat d&apos;abord
                  </Link>
                ) : null
              }
            />
          </SpotlightCard>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {property.invitations.map((invitation) => (
              <SpotlightCard key={invitation.id} tone="info">
                <article className="h-full rounded-xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {getInvitationTenantLabel(invitation)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invitation.tenantEmail}
                      </p>
                    </div>
                    <StatusBadge tone={getStatusTone(invitation.status)}>
                      {invitationStatusLabels[invitation.status] ??
                        invitation.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Invitation creee depuis le workflow contrat. Aucune
                    suppression ou retrait locataire n&apos;est ajoute ici.
                  </p>
                  <div className="mt-4">
                    <StatusBadge tone="muted">
                      Retirer un locataire - bientot disponible
                    </StatusBadge>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Activite recente"
          description="Derniers paiements et invitations rattaches au logement."
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <SectionHeader title="Paiements recents" />
            {property.payments.length === 0 ? (
              <EmptyState
                title="Aucun paiement rattache"
                description="Les paiements attendus apparaitront ici une fois crees depuis un contrat."
              />
            ) : (
              <div className="grid gap-3">
                {property.payments.map((payment) => (
                  <SpotlightCard key={payment.id} tone="warning">
                    <article className="rounded-xl border border-chart-4/45 bg-chart-4/10 p-4 text-card-foreground shadow-sm shadow-black/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {paymentTypeLabels[payment.type] ?? payment.type}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Echeance {formatDate(payment.dueDate)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Recu le{" "}
                            {payment.paidAt
                              ? formatDate(payment.paidAt)
                              : "non confirme"}
                          </p>
                        </div>
                        <div className="space-y-2 sm:text-right">
                          <p className="font-semibold text-foreground">
                            {formatMoney(
                              payment.amountInCents,
                              payment.currency,
                            )}
                          </p>
                          <StatusBadge tone={getStatusTone(payment.status)}>
                            {paymentStatusLabels[payment.status] ??
                              payment.status}
                          </StatusBadge>
                        </div>
                      </div>
                    </article>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Invitations recentes" />
            {property.invitations.length === 0 ? (
              <EmptyState
                title="Aucune invitation rattachee"
                description="Les invitations locataire apparaitront ici quand elles seront creees depuis un contrat."
              />
            ) : (
              <div className="grid gap-3">
                {property.invitations.map((invitation) => (
                  <SpotlightCard key={invitation.id} tone="info">
                    <article className="rounded-xl border border-ring/35 bg-ring/8 p-4 text-card-foreground shadow-sm shadow-black/10">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {getInvitationTenantLabel(invitation)}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {invitation.tenantEmail}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Expire le {formatDate(invitation.expiresAt)}
                          </p>
                        </div>
                        <div className="space-y-2 sm:text-right">
                          <StatusBadge tone={getStatusTone(invitation.status)}>
                            {invitationStatusLabels[invitation.status] ??
                              invitation.status}
                          </StatusBadge>
                          {invitation.acceptedAt ? (
                            <p className="text-sm text-muted-foreground">
                              Acceptee le {formatDate(invitation.acceptedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Actions sensibles"
          description="L'archivage conserve l'historique. La suppression efface le logement et ses donnees liees."
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {!isArchived ? (
            <SpotlightCard tone="warning">
              <article className="h-full rounded-xl border border-chart-4/60 bg-chart-4/14 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="space-y-3">
                  <StatusBadge tone="warning">Recommande</StatusBadge>
                  <h3 className="text-lg font-semibold tracking-normal text-foreground">
                    Archiver le logement
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Le logement ne sera plus actif dans votre gestion courante,
                    mais son historique restera consultable. Cette option est
                    recommandee si le logement a deja vecu dans RentFlow.
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    L&apos;archivage est bloque si des contrats actifs ou
                    suspendus existent.
                  </p>
                </div>
                <form action={archiveAction} className="mt-5">
                  <button
                    className={buttonVariants({ variant: "outline" })}
                    type="submit"
                  >
                    Archiver le logement
                  </button>
                </form>
              </article>
            </SpotlightCard>
          ) : (
            <SpotlightCard tone="default">
              <InfoAlert title="Logement deja archive" tone="warning">
                Le logement est deja archive : son historique reste consultable,
                sans suppression physique.
              </InfoAlert>
            </SpotlightCard>
          )}

          <SpotlightCard tone="danger">
            <article className="h-full rounded-xl border border-destructive/70 bg-destructive/18 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="space-y-3">
                <StatusBadge tone="danger">Irreversible</StatusBadge>
                <h3 className="text-lg font-semibold tracking-normal text-foreground">
                  Suppression definitive
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Cette action supprime definitivement le logement de RentFlow.
                  Les contrats, invitations, paiements, quittances, depenses et
                  autres donnees liees a ce logement peuvent aussi etre
                  supprimes. Cette action est irreversible.
                </p>
              </div>
              <form action={deleteAction} className="mt-5 space-y-3">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-foreground"
                    htmlFor="delete-property-confirmation"
                  >
                    Tapez SUPPRIMER pour confirmer
                  </label>
                  <input
                    autoComplete="off"
                    className="h-10 w-full rounded-lg border border-destructive/50 bg-background px-3 text-sm outline-none focus-visible:border-destructive focus-visible:ring-3 focus-visible:ring-destructive/30"
                    id="delete-property-confirmation"
                    name="confirmation"
                    placeholder="SUPPRIMER"
                    type="text"
                  />
                </div>
                <button
                  className={buttonVariants({ variant: "destructive" })}
                  type="submit"
                >
                  Supprimer definitivement
                </button>
              </form>
            </article>
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
