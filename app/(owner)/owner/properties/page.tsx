import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
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

async function getPropertiesForPage() {
  try {
    return await listOwnerProperties();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerPropertiesPage() {
  const properties = await getPropertiesForPage();

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Logements
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Mes logements
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Liste en lecture seule des logements rattaches a votre profil
              proprietaire.
            </p>
          </div>
          <Link
            className={buttonVariants({ className: "w-fit" })}
            href="/owner/properties/new"
          >
            Ajouter un logement
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <h2 className="text-lg font-semibold">Aucun logement</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Aucun logement reste rattache a votre profil proprietaire pour le
            moment. La creation sera ajoutee dans une prochaine etape validee.
          </p>
          <Link
            className={buttonVariants({ className: "mt-4" })}
            href="/owner/properties/new"
          >
            Ajouter un logement
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {properties.length} logement{properties.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/owner"
              >
                Retour dashboard
              </Link>
              <Link className={buttonVariants()} href="/owner/properties/new">
                Ajouter un logement
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr_0.7fr_0.8fr_0.7fr_0.7fr_0.9fr_0.6fr] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground xl:grid">
              <span>Nom</span>
              <span>Adresse</span>
              <span>Type</span>
              <span>Statut</span>
              <span>Meuble</span>
              <span>Colocation</span>
              <span>Contrats</span>
              <span>Paiements</span>
              <span>Mis a jour</span>
              <span>Voir</span>
            </div>
            <div className="divide-y">
              {properties.map((property) => (
                <article
                  className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1.4fr_1.6fr_0.8fr_0.8fr_0.7fr_0.8fr_0.7fr_0.7fr_0.9fr_0.6fr] xl:gap-4"
                  key={property.id}
                >
                  <div>
                    <Link
                      className="font-medium underline-offset-4 hover:underline"
                      href={`/owner/properties/${property.id}`}
                    >
                      {property.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground xl:hidden">
                      {formatShortAddress(property)}
                    </p>
                  </div>
                  <span className="hidden text-muted-foreground xl:block">
                    {formatShortAddress(property)}
                  </span>
                  <span>
                    {propertyTypeLabels[property.propertyType] ??
                      property.propertyType}
                  </span>
                  <span>
                    {propertyStatusLabels[property.status] ?? property.status}
                  </span>
                  <span>{property.furnished ? "Oui" : "Non"}</span>
                  <span>{property.isColocation ? "Oui" : "Non"}</span>
                  <span>{property._count.rentalContracts}</span>
                  <span>{property._count.payments}</span>
                  <span>{formatDate(property.updatedAt)}</span>
                  <Link
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    href={`/owner/properties/${property.id}`}
                  >
                    Voir
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
