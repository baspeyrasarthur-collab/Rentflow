import { formatMoney } from "@/lib/money";
import { getAdminDashboardData } from "@/server/admin/dashboard";
import { DEFAULT_LOCALE } from "@/server/config/app";

const roleLabels: Record<string, string> = {
  OWNER: "Proprietaire",
  TENANT: "Locataire",
  ADMIN: "Admin",
};

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archive",
  SUSPENDED: "Suspendu",
};

const paymentTypeLabels: Record<string, string> = {
  RENT: "Loyer",
  CHARGES: "Charges",
  DEPOSIT: "Depot",
  ONE_OFF_EXPENSE: "Frais ponctuel",
};

const paymentStatusLabels: Record<string, string> = {
  PLANNED: "Prevu",
  PENDING: "En attente",
  PROCESSING: "En traitement",
  SUCCEEDED: "Reussi",
  FAILED: "Echoue",
  CANCELED: "Annule",
  REFUNDED: "Rembourse",
  DISPUTED: "Conteste",
};

const identityStatusLabels: Record<string, string> = {
  NOT_STARTED: "Non demarree",
  PENDING: "En attente",
  VERIFIED: "Verifiee",
  FAILED: "Echouee",
  REQUIRES_REVIEW: "A revoir",
};

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getWebhookStatus(webhook: {
  processedAt: Date | null;
  failedAt: Date | null;
}) {
  if (webhook.failedAt) {
    return "failed";
  }

  if (webhook.processedAt) {
    return "processed";
  }

  return "pending";
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
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

export default async function AdminIndexPage() {
  const dashboard = await getAdminDashboardData();
  const { stats } = dashboard;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          RentFlow
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Dashboard admin
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            Vue globale en lecture seule des utilisateurs, logements, paiements,
            webhooks et verifications.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={stats.totalUsers} />
        <StatCard label="Proprietaires" value={stats.ownerUsers} />
        <StatCard label="Locataires" value={stats.tenantUsers} />
        <StatCard label="Logements" value={stats.totalProperties} />
        <StatCard label="Logements actifs" value={stats.activeProperties} />
        <StatCard label="Contrats actifs" value={stats.activeContracts} />
        <StatCard label="Paiements" value={stats.totalPayments} />
        <StatCard label="Paiements reussis" value={stats.succeededPayments} />
        <StatCard label="Paiements echoues" value={stats.failedPayments} />
        <StatCard
          label="Encaisse total"
          value={formatMoney(stats.collectedAmountInCents)}
        />
        <StatCard
          label="Commissions"
          value={formatMoney(stats.commissionAmountInCents)}
        />
        <StatCard label="Mandats acceptes" value={stats.acceptedMandates} />
        <StatCard
          label="Quittances disponibles"
          value={stats.availableReceipts}
        />
        <StatCard label="Webhooks a traiter" value={stats.webhookIssues} />
        <StatCard label="KYC a surveiller" value={stats.identityReviews} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Derniers utilisateurs
          </h2>
          {dashboard.recentUsers.length === 0 ? (
            <EmptyList label="Aucun utilisateur." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dashboard.recentUsers.map((user) => (
                <article
                  key={user.id}
                  className="grid gap-2 p-4 text-sm sm:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]"
                >
                  <span className="font-medium">{user.email}</span>
                  <span>{roleLabels[user.role] ?? user.role}</span>
                  <span>{formatDate(user.createdAt)}</span>
                  <span>{user.disabledAt ? "Desactive" : "Actif"}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Derniers logements
          </h2>
          {dashboard.recentProperties.length === 0 ? (
            <EmptyList label="Aucun logement." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dashboard.recentProperties.map((property) => (
                <article key={property.id} className="space-y-2 p-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{property.name}</p>
                      <p className="text-muted-foreground">{property.city}</p>
                    </div>
                    <span>
                      {propertyStatusLabels[property.status] ?? property.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Proprietaire {property.ownerProfile.user.email} - Colocation{" "}
                    {property.isColocation ? "oui" : "non"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Derniers paiements
          </h2>
          {dashboard.recentPayments.length === 0 ? (
            <EmptyList label="Aucun paiement." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dashboard.recentPayments.map((payment) => (
                <article key={payment.id} className="space-y-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {paymentTypeLabels[payment.type] ?? payment.type} -
                        {paymentStatusLabels[payment.status] ?? payment.status}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Echeance {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatMoney(payment.amountInCents, payment.currency)}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Proprietaire {payment.ownerProfile.user.email} - Locataire{" "}
                    {payment.tenantProfile.user.email}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Derniers webhooks
          </h2>
          {dashboard.recentWebhooks.length === 0 ? (
            <EmptyList label="Aucun webhook." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dashboard.recentWebhooks.map((webhook) => (
                <article
                  key={webhook.id}
                  className="grid gap-2 p-4 text-sm sm:grid-cols-[1fr_1fr_0.8fr]"
                >
                  <div>
                    <p className="font-medium">{webhook.provider}</p>
                    <p className="text-muted-foreground">{webhook.eventType}</p>
                  </div>
                  <div className="text-muted-foreground">
                    <p>Processed {formatDate(webhook.processedAt)}</p>
                    <p>Failed {formatDate(webhook.failedAt)}</p>
                  </div>
                  <span>{getWebhookStatus(webhook)}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4 xl:col-span-2">
          <h2 className="text-xl font-semibold tracking-normal">
            Verifications identite a surveiller
          </h2>
          {dashboard.identityVerificationsToReview.length === 0 ? (
            <EmptyList label="Aucune verification a surveiller." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {dashboard.identityVerificationsToReview.map((verification) => (
                <article
                  key={verification.id}
                  className="grid gap-2 p-4 text-sm sm:grid-cols-[1.5fr_1fr_1fr_1fr]"
                >
                  <span className="font-medium">{verification.user.email}</span>
                  <span>{verification.provider}</span>
                  <span>
                    {identityStatusLabels[verification.status] ??
                      verification.status}
                  </span>
                  <span>{formatDate(verification.startedAt)}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
