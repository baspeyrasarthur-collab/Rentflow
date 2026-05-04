import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerPropertyById } from "@/server/owner/properties";

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
      {label}
    </div>
  );
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

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Detail logement
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {property.name}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Vue en lecture seule du logement et de ses elements rattaches.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/owner/properties"
          >
            Retour logements
          </Link>
          <Link
            className={buttonVariants()}
            href={`/owner/properties/${property.id}/edit`}
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem
          label="Statut"
          value={propertyStatusLabels[property.status]}
        />
        <InfoItem
          label="Type"
          value={propertyTypeLabels[property.propertyType]}
        />
        <InfoItem label="Meuble" value={property.furnished ? "Oui" : "Non"} />
        <InfoItem
          label="Colocation"
          value={property.isColocation ? "Oui" : "Non"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold tracking-normal">
            Informations principales
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="font-medium">{property.addressLine1}</dd>
            </div>
            {property.addressLine2 ? (
              <div>
                <dt className="text-muted-foreground">Complement</dt>
                <dd className="font-medium">{property.addressLine2}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Ville</dt>
              <dd className="font-medium">
                {property.postalCode} {property.city}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pays</dt>
              <dd className="font-medium">{property.country}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Surface</dt>
              <dd className="font-medium">
                {property.surfaceAreaSqm
                  ? `${property.surfaceAreaSqm} m2`
                  : "Non renseignee"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold tracking-normal">Suivi</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoItem
              label="Contrats"
              value={property._count.rentalContracts}
            />
            <InfoItem label="Paiements" value={property._count.payments} />
            <InfoItem label="Quittances" value={property._count.receipts} />
            <InfoItem label="Invitations" value={property._count.invitations} />
          </div>
          <dl className="mt-4 grid gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Cree le</dt>
              <dd className="font-medium">{formatDate(property.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mis a jour le</dt>
              <dd className="font-medium">{formatDate(property.updatedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-normal">
            Contrats rattaches
          </h2>
          {property.rentalContracts.length === 0 ? (
            <EmptyList label="Aucun contrat rattache pour le moment." />
          ) : (
            <div className="divide-y rounded-lg border">
              {property.rentalContracts.map((contract) => (
                <article className="space-y-1 p-4 text-sm" key={contract.id}>
                  <p className="font-medium">
                    {contractTypeLabels[contract.contractType] ??
                      contract.contractType}
                  </p>
                  <p className="text-muted-foreground">
                    Statut {contract.status} - Jour {contract.paymentDayOfMonth}
                  </p>
                  <p className="text-muted-foreground">
                    {formatMoney(contract.totalRentAmountInCents)} loyer,{" "}
                    {formatMoney(contract.totalChargesAmountInCents)} charges
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-normal">
            Paiements recents
          </h2>
          {property.payments.length === 0 ? (
            <EmptyList label="Aucun paiement rattache pour le moment." />
          ) : (
            <div className="divide-y rounded-lg border">
              {property.payments.map((payment) => (
                <article className="space-y-1 p-4 text-sm" key={payment.id}>
                  <p className="font-medium">
                    {payment.type} - {payment.status}
                  </p>
                  <p className="text-muted-foreground">
                    {formatMoney(payment.amountInCents)} dus le{" "}
                    {formatDate(payment.dueDate)}
                  </p>
                  <p className="text-muted-foreground">
                    Paiement le{" "}
                    {payment.paidAt ? formatDate(payment.paidAt) : "non recu"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-normal">
            Invitations recentes
          </h2>
          {property.invitations.length === 0 ? (
            <EmptyList label="Aucune invitation rattachee pour le moment." />
          ) : (
            <div className="divide-y rounded-lg border">
              {property.invitations.map((invitation) => (
                <article className="space-y-1 p-4 text-sm" key={invitation.id}>
                  <p className="font-medium">
                    {invitation.tenantFirstName} {invitation.tenantLastName}
                  </p>
                  <p className="text-muted-foreground">
                    {invitation.tenantEmail}
                  </p>
                  <p className="text-muted-foreground">
                    {invitation.status} - expire le{" "}
                    {formatDate(invitation.expiresAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
