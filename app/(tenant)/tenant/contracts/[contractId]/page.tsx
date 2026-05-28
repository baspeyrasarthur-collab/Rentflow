import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { buildReceiptPdfFilename } from "@/server/receipts/pdf-data";
import { getTenantContractDetail } from "@/server/tenant/contracts";

const contractTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  COLOCATION: "Colocation",
};

const colocationModeLabels: Record<string, string> = {
  NONE: "Aucune",
  SINGLE_LEASE: "Bail unique",
  LINKED_LEASES: "Baux separes",
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

const contractTenantStatusLabels: Record<string, string> = {
  INVITED: "Invite",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Fin demandee",
  TERMINATED: "Termine",
};

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  OTHER: "Autre",
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

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "Non renseignee";
}

function labelFor(labels: Record<string, string>, value: string) {
  return labels[value] ?? value;
}

function getStatusTone(status: string) {
  if (status === "ACTIVE" || status === "SUCCEEDED" || status === "SENT") {
    return "success" as const;
  }

  if (status === "FAILED" || status === "DISPUTED" || status === "SUSPENDED") {
    return "danger" as const;
  }

  if (
    status === "DRAFT" ||
    status === "PLANNED" ||
    status === "PENDING" ||
    status === "REQUESTED" ||
    status === "TERMINATION_REQUESTED"
  ) {
    return "warning" as const;
  }

  if (
    status === "TERMINATED" ||
    status === "ARCHIVED" ||
    status === "CANCELED" ||
    status === "REFUNDED"
  ) {
    return "muted" as const;
  }

  return "info" as const;
}

function getOwnerDisplayName(
  contract: Awaited<ReturnType<typeof getTenantContractDetail>>,
) {
  const ownerUser = contract.ownerProfile.user;
  const name = [ownerUser.firstName, ownerUser.lastName]
    .filter(Boolean)
    .join(" ");

  return name || ownerUser.email;
}

function ContractPropertyImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="relative min-h-52 overflow-hidden rounded-xl border border-primary/35 bg-gradient-to-br from-primary/35 via-ring/15 to-background shadow-xl shadow-black/15">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Photo du logement ${name}`}
          className="h-full min-h-52 w-full object-cover transition-transform duration-500 hover:scale-105"
          src={imageUrl}
        />
      ) : (
        <>
          <div className="absolute inset-x-10 bottom-0 h-32 rounded-t-3xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
          <div className="absolute bottom-10 right-10 h-20 w-32 rounded-t-xl border border-white/10 bg-white/10" />
          <div className="absolute bottom-5 left-5 text-sm font-medium text-muted-foreground">
            Photo du logement
          </div>
        </>
      )}
    </div>
  );
}

async function getContractForPage(contractId: string) {
  try {
    return await getTenantContractDetail(contractId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function TenantContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const contract = await getContractForPage(contractId);

  if (!contract) {
    notFound();
  }

  const contractTenant = contract.contractTenants[0] ?? null;
  const totalMonthlyAmountInCents =
    contract.totalRentAmountInCents + contract.totalChargesAmountInCents;
  const tenantMonthlyAmountInCents = contractTenant
    ? contractTenant.rentShareAmountInCents +
      contractTenant.chargesShareAmountInCents
    : totalMonthlyAmountInCents;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Contrat"
        title={contract.property.name || "Detail du contrat"}
        description="Consultez les informations de votre contrat en lecture seule."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/tenant"
          >
            Retour espace locataire
          </Link>
        }
      />

      <InfoAlert title="Lecture seule" tone="info">
        <p>
          Cette page est en lecture seule. Contactez votre proprietaire si une
          information doit etre corrigee.
        </p>
      </InfoAlert>

      {contractTenant?.status === "TERMINATED" ? (
        <InfoAlert title="Contrat termine" tone="info">
          <p>
            Votre proprietaire a mis fin au contrat. L&apos;historique reste
            consultable.
          </p>
        </InfoAlert>
      ) : null}

      {contractTenant?.status === "TERMINATION_REQUESTED" ? (
        <InfoAlert title="Demande de fin en cours" tone="warning">
          <p>
            Votre demande de fin de contrat est en attente de traitement par le
            proprietaire.
          </p>
        </InfoAlert>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Resume du contrat"
          description="Les informations principales du contrat rattache a votre espace."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Contrat"
            value={labelFor(contractTypeLabels, contract.contractType)}
            hint={labelFor(contractStatusLabels, contract.status)}
          />
          <StatCard
            label="Rattachement"
            value={
              contractTenant
                ? labelFor(contractTenantStatusLabels, contractTenant.status)
                : "Non rattache"
            }
            hint="Statut locataire"
          />
          <StatCard
            label="Total mensuel"
            value={formatMoney(totalMonthlyAmountInCents, contract.currency)}
            hint="Loyer + charges du contrat"
          />
          <StatCard
            label="Votre part"
            value={formatMoney(
              tenantMonthlyAmountInCents,
              contractTenant?.currency ?? contract.currency,
            )}
            hint="Montant rattache a votre profil"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="h-full rounded-xl border border-primary/35 bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/20">
          <SectionHeader
            title="Logement"
            description="Le bien concerne par ce contrat."
          />
          <div className="mt-5">
            <ContractPropertyImage
              imageUrl={contract.property.imageUrl}
              name={contract.property.name}
            />
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Nom</dt>
              <dd className="mt-1 font-medium text-foreground">
                {contract.property.name}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd className="mt-1 font-medium text-foreground">
                {labelFor(propertyTypeLabels, contract.property.propertyType)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="mt-1 font-medium text-foreground">
                {contract.property.addressLine1}
                {contract.property.addressLine2
                  ? `, ${contract.property.addressLine2}`
                  : ""}
                , {contract.property.postalCode} {contract.property.city},{" "}
                {contract.property.country}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Surface</dt>
              <dd className="mt-1 font-medium text-foreground">
                {contract.property.surfaceAreaSqm
                  ? `${contract.property.surfaceAreaSqm} m2`
                  : "Non renseignee"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Meuble</dt>
              <dd className="mt-1 font-medium text-foreground">
                {contract.property.furnished ? "Oui" : "Non"}
              </dd>
            </div>
          </dl>
        </article>

        <SpotlightCard tone="info">
          <article className="h-full rounded-xl border border-ring/35 bg-card p-5 text-card-foreground shadow-sm shadow-black/10">
            <SectionHeader
              title="Proprietaire"
              description="Contact administratif visible dans RentFlow."
            />
            <dl className="mt-5 grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {getOwnerDisplayName(contract)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {contract.ownerProfile.user.email}
                </dd>
              </div>
            </dl>
          </article>
        </SpotlightCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <SpotlightCard tone="warning">
          <article className="h-full rounded-xl border border-chart-4/35 bg-card p-5 text-card-foreground shadow-sm shadow-black/10">
            <SectionHeader
              title="Montants"
              description="Les montants sont affiches en euros, stockes en centimes."
            />
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Loyer</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatMoney(
                    contract.totalRentAmountInCents,
                    contract.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Charges</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatMoney(
                    contract.totalChargesAmountInCents,
                    contract.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total mensuel</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatMoney(totalMonthlyAmountInCents, contract.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Depot de garantie</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatMoney(
                    contract.depositAmountInCents,
                    contract.currency,
                  )}
                </dd>
              </div>
            </dl>
          </article>
        </SpotlightCard>

        <SpotlightCard tone="default">
          <article className="h-full rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-black/10">
            <SectionHeader
              title="Dates importantes"
              description="Les jalons connus du contrat."
            />
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Date de debut</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatDate(contract.startDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date de fin</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatOptionalDate(contract.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Jour de paiement</dt>
                <dd className="mt-1 font-medium text-foreground">
                  Jour {contract.paymentDayOfMonth}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Colocation</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {contract.property.isColocation
                    ? labelFor(colocationModeLabels, contract.colocationMode)
                    : "Non"}
                </dd>
              </div>
              {contractTenant ? (
                <>
                  <div>
                    <dt className="text-muted-foreground">
                      Debut rattachement
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatDate(contractTenant.startDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fin rattachement</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatOptionalDate(contractTenant.endDate)}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </article>
        </SpotlightCard>
      </section>

      {contractTenant?.roomLabel ? (
        <InfoAlert title="Chambre rattachee" tone="info">
          <p>{contractTenant.roomLabel}</p>
        </InfoAlert>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Paiements lies"
          description="Les derniers paiements rattaches a ce contrat."
        />
        {contract.payments.length === 0 ? (
          <EmptyState
            title="Aucun paiement rattache"
            description="Les paiements attendus apparaitront ici lorsqu'ils seront crees."
          />
        ) : (
          <div className="grid gap-3">
            {contract.payments.map((payment) => (
              <article
                className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm shadow-black/10"
                key={payment.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {labelFor(paymentTypeLabels, payment.type)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Echeance {formatDate(payment.dueDate)}
                      {payment.paidAt
                        ? ` - paye le ${formatDate(payment.paidAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="space-y-2 sm:text-right">
                    <p className="font-semibold text-foreground">
                      {formatMoney(payment.amountInCents, payment.currency)}
                    </p>
                    <StatusBadge tone={getStatusTone(payment.status)}>
                      {labelFor(paymentStatusLabels, payment.status)}
                    </StatusBadge>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Quittances liees"
          description="Les dernieres quittances et recus disponibles."
        />
        {contract.receipts.length === 0 ? (
          <EmptyState
            title="Aucune quittance rattachee"
            description="Les quittances generees par votre proprietaire apparaitront ici."
          />
        ) : (
          <div className="grid gap-3">
            {contract.receipts.map((receipt) => {
              const filename = buildReceiptPdfFilename({
                propertyName: contract.property.name,
                periodStart: receipt.periodStart,
                totalAmountInCents: receipt.totalAmountInCents,
                currency: receipt.currency,
              });

              return (
                <Link
                  className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm shadow-black/10 transition-colors hover:bg-muted"
                  href={`/receipts/${receipt.id}/pdf`}
                  key={receipt.id}
                >
                  <span className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <span>
                      <span className="block font-medium text-foreground">
                        {labelFor(receiptTypeLabels, receipt.type)}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {filename}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Periode {formatDate(receipt.periodStart)} -{" "}
                        {formatDate(receipt.periodEnd)}
                      </span>
                    </span>
                    <span className="space-y-2 sm:text-right">
                      <span className="block font-semibold text-foreground">
                        {formatMoney(
                          receipt.totalAmountInCents,
                          receipt.currency,
                        )}
                      </span>
                      <StatusBadge tone={getStatusTone(receipt.status)}>
                        {labelFor(receiptStatusLabels, receipt.status)}
                      </StatusBadge>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
