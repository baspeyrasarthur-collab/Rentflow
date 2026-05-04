import { formatMoney } from "@/lib/money";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getTenantDashboardData } from "@/server/tenant/dashboard";

const contractTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  COLOCATION: "Colocation",
};

const contractTenantStatusLabels: Record<string, string> = {
  INVITED: "Invite",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Fin demandee",
  TERMINATED: "Termine",
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

const receiptTypeLabels: Record<string, string> = {
  RECEIPT: "Recu",
  RENT_RECEIPT: "Quittance",
};

const receiptStatusLabels: Record<string, string> = {
  REQUESTED: "Demandee",
  GENERATED: "Generee",
  SENT: "Envoyee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-5 text-card-foreground">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
    </div>
  );
}

export default async function TenantIndexPage() {
  const dashboard = await getTenantDashboardData();

  if (!dashboard.tenantProfile || !dashboard.stats) {
    return (
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          RentFlow
        </p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Profil locataire non initialise
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Votre compte a acces a cet espace locataire, mais aucun profil
          locataire RentFlow reste rattache a cet utilisateur pour le moment.
        </p>
      </section>
    );
  }

  const { stats, contractTenants, recentPayments, recentReceipts } = dashboard;

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          RentFlow
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Dashboard locataire
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            Vue en lecture seule de vos locations, paiements, mandats et
            quittances.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Rattachements actifs"
          value={stats.activeContractTenants}
        />
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
          label="Paye ce mois"
          value={formatMoney(stats.paidAmountInCents)}
        />
        <StatCard label="Mandats acceptes" value={stats.acceptedMandates} />
        <StatCard
          label="Quittances disponibles"
          value={stats.availableReceipts}
        />
        <StatCard
          label="Invitations en attente"
          value={stats.pendingInvitations}
        />
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Locations rattachees
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Liste limitee aux contrats rattaches a votre profil locataire.
          </p>
        </div>

        {contractTenants.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-card-foreground">
            <h3 className="text-lg font-semibold">Aucune location</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Une invitation proprietaire sera necessaire pour rejoindre une
              location dans RentFlow.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contractTenants.map((contractTenant) => (
              <article
                key={contractTenant.id}
                className="rounded-lg border bg-card p-5 text-card-foreground"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {contractTenant.rentalContract.property.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {contractTenant.rentalContract.property.city}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Paiement le{" "}
                    {contractTenant.rentalContract.paymentDayOfMonth}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Contrat</dt>
                    <dd className="mt-1 font-medium">
                      {contractTypeLabels[
                        contractTenant.rentalContract.contractType
                      ] ?? contractTenant.rentalContract.contractType}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Colocation</dt>
                    <dd className="mt-1 font-medium">
                      {contractTenant.rentalContract.property.isColocation
                        ? "Oui"
                        : "Non"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Chambre</dt>
                    <dd className="mt-1 font-medium">
                      {contractTenant.roomLabel ?? "Non renseignee"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Statut</dt>
                    <dd className="mt-1 font-medium">
                      {contractTenantStatusLabels[contractTenant.status] ??
                        contractTenant.status}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Loyer mensuel</dt>
                    <dd className="mt-1 font-medium">
                      {formatMoney(
                        contractTenant.rentShareAmountInCents,
                        contractTenant.currency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      Charges mensuelles
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatMoney(
                        contractTenant.chargesShareAmountInCents,
                        contractTenant.currency,
                      )}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Paiements recents
          </h2>
          {recentPayments.length === 0 ? (
            <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
              Aucun paiement recent.
            </div>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {recentPayments.map((payment) => (
                <article key={payment.id} className="space-y-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{payment.property.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {paymentTypeLabels[payment.type] ?? payment.type} -
                        {paymentStatusLabels[payment.status] ?? payment.status}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatMoney(payment.amountInCents, payment.currency)}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Echeance {formatDate(payment.dueDate)}
                    {payment.paidAt
                      ? ` - Paye le ${formatDate(payment.paidAt)}`
                      : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">
            Quittances recentes
          </h2>
          {recentReceipts.length === 0 ? (
            <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
              Aucune quittance recente.
            </div>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {recentReceipts.map((receipt) => (
                <article key={receipt.id} className="space-y-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{receipt.property.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {receiptTypeLabels[receipt.type] ?? receipt.type} -
                        {receiptStatusLabels[receipt.status] ?? receipt.status}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatMoney(
                        receipt.totalAmountInCents,
                        receipt.currency,
                      )}
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Periode {formatDate(receipt.periodStart)} -{" "}
                    {formatDate(receipt.periodEnd)}
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
