import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  WalletCards,
} from "lucide-react";

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
import { getOwnerPaymentsOverview } from "@/server/owner/payments-overview";

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

const paymentDeclarationLabels: Record<string, string> = {
  PAID_EXTERNALLY: "Le locataire declare avoir paye ce loyer.",
  NOT_PAID_YET: "Le locataire indique ne pas avoir encore paye.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPaymentStatusTone(status: string) {
  if (status === "SUCCEEDED") {
    return "success" as const;
  }

  if (status === "FAILED" || status === "DISPUTED") {
    return "danger" as const;
  }

  if (status === "CANCELED" || status === "REFUNDED") {
    return "muted" as const;
  }

  return "warning" as const;
}

function getPaymentSpotlightTone(status: string) {
  const tone = getPaymentStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

function getPaymentModeLabel(payment: {
  provider: string | null;
  providerPaymentId: string | null;
}) {
  if (payment.provider === null && payment.providerPaymentId === null) {
    return "Paiement externe suivi";
  }

  return payment.provider ?? "Provider externe";
}

function getTenantLabel(payment: {
  contractTenant: {
    invitedEmail: string | null;
    invitedFirstName: string | null;
    invitedLastName: string | null;
  } | null;
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  const tenantName = [
    payment.tenantProfile.user.firstName,
    payment.tenantProfile.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const invitedName = payment.contractTenant
    ? [
        payment.contractTenant.invitedFirstName,
        payment.contractTenant.invitedLastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    tenantName ||
    invitedName ||
    payment.contractTenant?.invitedEmail ||
    payment.tenantProfile.user.email
  );
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getPaymentsForPage() {
  try {
    return await getOwnerPaymentsOverview();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ focus?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams?.focus);
  const payments = await getPaymentsForPage();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Paiements"
        title="Paiements"
        description="Suivez les loyers attendus, les paiements declares et les receptions a confirmer."
        actions={
          <>
            <Link
              className={buttonVariants({
                className: "shadow-lg shadow-primary/15",
              })}
              href="/owner/payments/new"
            >
              Ajouter un loyer
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Voir les finances
            </Link>
          </>
        }
      />

      <SpotlightCard tone="warning">
        <InfoAlert title="Declaration et reception" tone="warning">
          Une declaration locataire ne confirme pas le paiement. La reception
          reelle reste validee par le proprietaire.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title={`Resume - ${formatMonth(payments.periodStart)}`}
          description="Lecture du mois courant, sans modifier les statuts de paiement."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<WalletCards className="size-5" />}
              label="Loyers attendus"
              value={formatMoney(payments.summary.expectedRentInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<CheckCircle2 className="size-5" />}
              label="Encaisses"
              value={formatMoney(payments.summary.collectedRentInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<AlertTriangle className="size-5" />}
              label="A surveiller"
              value={payments.summary.watchPayments}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/15"
              icon={<Clock className="size-5" />}
              label="Declares payes"
              value={payments.summary.declaredPaidExternalPayments}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur les paiements"
          description="Signaux a traiter depuis les workflows existants."
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/owner/payments/new"
            >
              <Plus className="size-4" />
              Ajouter un loyer a encaisser
            </Link>
          }
        />
        {payments.summary.declaredPaidExternalPayments === 0 &&
        payments.summary.watchPayments === 0 ? (
          <EmptyState
            title="Aucune action prioritaire"
            description="Les loyers declares payes ou en retard apparaitront ici."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {payments.summary.declaredPaidExternalPayments > 0 ? (
              <SpotlightCard tone="warning">
                <ActionCard
                  title={`${payments.summary.declaredPaidExternalPayments} loyer(s) declares payes`}
                  description="Des locataires indiquent avoir paye. Confirmez uniquement depuis le workflow contrat apres reception reelle."
                  href="/owner/contracts"
                  actionLabel="Voir les contrats"
                  tone="warning"
                />
              </SpotlightCard>
            ) : null}
            {payments.summary.watchPayments > 0 ? (
              <SpotlightCard tone="danger">
                <ActionCard
                  title={`${payments.summary.watchPayments} paiement(s) a surveiller`}
                  description="Des loyers attendus ne sont pas encore confirmes comme recus."
                  href="/owner/finances"
                  actionLabel="Voir les finances"
                  tone="danger"
                />
              </SpotlightCard>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Liste des paiements"
          description="Derniers loyers suivis, avec declarations locataire si disponibles."
        />
        {payments.payments.length === 0 ? (
          <EmptyState
            title="Aucun paiement"
            description="Les paiements attendus apparaitront ici quand ils seront crees depuis un contrat."
          />
        ) : (
          <div className="grid gap-4">
            {payments.payments.map((payment) => {
              const latestDeclaration = payment.declarations[0] ?? null;
              const isFocusedPayment = focus === `payment-${payment.id}`;

              return (
                <SpotlightCard
                  className={isFocusedPayment ? "ring-2 ring-chart-4/35" : ""}
                  key={payment.id}
                  tone={getPaymentSpotlightTone(payment.status)}
                >
                  <article
                    className={cn(
                      "rounded-xl border border-chart-4/35 bg-chart-4/8 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300",
                      isFocusedPayment
                        ? "border-chart-4/80 bg-chart-4/12 shadow-lg shadow-chart-4/10"
                        : "",
                    )}
                    id={`payment-${payment.id}`}
                  >
                    {isFocusedPayment ? (
                      <div className="mb-3">
                        <StatusBadge tone="warning">Action ciblee</StatusBadge>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {payment.property.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {payment.property.city} - {getTenantLabel(payment)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Echeance {formatDate(payment.dueDate)} -{" "}
                          {getPaymentModeLabel(payment)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusBadge
                            tone={getPaymentStatusTone(payment.status)}
                          >
                            {paymentStatusLabels[payment.status] ??
                              payment.status}
                          </StatusBadge>
                          {latestDeclaration ? (
                            <StatusBadge
                              tone={
                                latestDeclaration.declarationType ===
                                "PAID_EXTERNALLY"
                                  ? "warning"
                                  : "info"
                              }
                            >
                              {latestDeclaration.declarationType ===
                              "PAID_EXTERNALLY"
                                ? "Declare paye"
                                : "Pas encore"}
                            </StatusBadge>
                          ) : null}
                        </div>
                      </div>
                      <div className="space-y-3 lg:text-right">
                        <p className="text-xl font-semibold tracking-normal text-foreground">
                          {formatMoney(payment.amountInCents, payment.currency)}
                        </p>
                        <Link
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                          href={`/owner/properties/${payment.property.id}/contracts/${payment.rentalContract.id}`}
                        >
                          Voir le contrat
                        </Link>
                      </div>
                    </div>
                    {latestDeclaration ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {
                          paymentDeclarationLabels[
                            latestDeclaration.declarationType
                          ]
                        }{" "}
                        Declaration du{" "}
                        {formatDate(latestDeclaration.declaredAt)}.
                      </p>
                    ) : null}
                  </article>
                </SpotlightCard>
              );
            })}
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
