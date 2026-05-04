import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getOwnerDashboardData } from "@/server/owner/dashboard";

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

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

export default async function OwnerIndexPage() {
  const dashboard = await getOwnerDashboardData();

  if (!dashboard.ownerProfile || !dashboard.stats) {
    return (
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          RentFlow
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Profil proprietaire non initialise
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Votre compte a acces a cet espace proprietaire, mais aucun profil
          proprietaire RentFlow reste rattache a cet utilisateur pour le moment.
        </p>
      </section>
    );
  }

  const { stats, properties } = dashboard;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          RentFlow
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Dashboard proprietaire
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Vue en lecture seule des logements, paiements et commissions du
              mois courant.
            </p>
          </div>
          <Link
            className={buttonVariants({ className: "w-fit" })}
            href="/owner/properties"
          >
            Voir les logements
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Logements" value={stats.totalProperties} />
        <StatCard label="Logements actifs" value={stats.activeProperties} />
        <StatCard label="Contrats actifs" value={stats.activeContracts} />
        <StatCard
          label="Paiements du mois"
          value={stats.currentMonthPayments}
        />
        <StatCard
          label="Paiements reussis"
          value={stats.currentMonthSucceededPayments}
        />
        <StatCard
          label="Paiements echoues"
          value={stats.currentMonthFailedPayments}
        />
        <StatCard
          label="Encaisse ce mois"
          value={formatMoney(stats.collectedAmountInCents)}
        />
        <StatCard
          label="Commissions ce mois"
          value={formatMoney(stats.platformCommissionAmountInCents)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">
              Derniers logements
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Liste limitee aux logements rattaches a votre profil proprietaire.
            </p>
          </div>
          {properties.length > 0 ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Voir tous les logements
            </Link>
          ) : null}
        </div>

        {properties.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold">Aucun logement</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Aucun logement reste rattache a ce profil pour le moment.
            </p>
            <Button className="mt-4" disabled>
              Ajouter un logement bientot disponible
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground lg:grid">
              <span>Nom</span>
              <span>Ville</span>
              <span>Type</span>
              <span>Statut</span>
              <span>Colocation</span>
              <span>Contrats</span>
              <span>Paiements</span>
            </div>
            <div className="divide-y">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr] lg:gap-4"
                >
                  <div>
                    <p className="font-medium">{property.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground lg:hidden">
                      {property.city}
                    </p>
                  </div>
                  <span className="hidden lg:block">{property.city}</span>
                  <span>
                    {propertyTypeLabels[property.propertyType] ??
                      property.propertyType}
                  </span>
                  <span>
                    {propertyStatusLabels[property.status] ?? property.status}
                  </span>
                  <span>{property.isColocation ? "Oui" : "Non"}</span>
                  <span>{property._count.rentalContracts}</span>
                  <span>{property._count.payments}</span>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
