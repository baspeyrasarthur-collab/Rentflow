import { InfoAlert, PageHeader } from "@/components/ui/rentflow";
import { OwnerDashboardView } from "@/components/owner/owner-dashboard-view";
import { getOwnerDashboardData } from "@/server/owner/dashboard";
import { getOwnerNextActions } from "@/server/owner/next-actions";

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

  return (
    <OwnerDashboardView
      addPropertyHref="/owner/properties/new"
      allPropertiesHref="/owner/properties"
      financeHref="/owner/finances"
      nextActions={nextActionsResult.actions.slice(0, 4)}
      properties={dashboard.properties.map((property) => ({
        id: property.id,
        href: `/owner/properties/${property.id}`,
        name: property.name,
        city: property.city,
        imageUrl: property.imageUrl,
        propertyType: property.propertyType,
        status: property.status,
        isColocation: property.isColocation,
        rentalContractsCount: property._count.rentalContracts,
        paymentsCount: property._count.payments,
      }))}
      recentActivity={dashboard.recentActivity}
      stats={dashboard.stats}
    />
  );
}
