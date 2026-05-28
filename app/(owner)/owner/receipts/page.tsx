import Link from "next/link";
import { FileText, Home, ReceiptText, Send } from "lucide-react";

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
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerReceiptsOverview } from "@/server/owner/receipts-overview";
import { buildReceiptPdfFilename } from "@/server/receipts/pdf-data";

const receiptStatusLabels: Record<string, string> = {
  REQUESTED: "Demandee",
  GENERATED: "Generee",
  SENT: "Envoyee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTenantLabel(receipt: {
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  return (
    [receipt.tenantProfile.user.firstName, receipt.tenantProfile.user.lastName]
      .filter(Boolean)
      .join(" ") || receipt.tenantProfile.user.email
  );
}

function getReceiptStatusTone(status: string) {
  if (status === "GENERATED" || status === "SENT") {
    return "success" as const;
  }

  if (status === "REQUESTED") {
    return "warning" as const;
  }

  if (status === "CANCELED") {
    return "muted" as const;
  }

  return "info" as const;
}

async function getReceiptsForPage() {
  try {
    return await getOwnerReceiptsOverview();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerReceiptsPage() {
  const receipts = await getReceiptsForPage();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Quittances"
        title="Quittances"
        description="Suivez les demandes de quittance et les documents disponibles pour vos locataires."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/payments"
            >
              Voir les paiements
            </Link>
            <Link className={buttonVariants()} href="/owner/properties">
              Voir les biens
            </Link>
          </>
        }
      />

      <SpotlightCard tone="warning">
        <InfoAlert title="Regle de generation" tone="warning">
          Une quittance complete doit etre generee uniquement apres reception
          complete du loyer et des charges.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Resume quittances"
          description="Demandes et documents disponibles pour vos biens."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<ReceiptText className="size-5" />}
              label="Demandes en attente"
              value={receipts.summary.requestedReceipts}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<FileText className="size-5" />}
              label="Quittances generees"
              value={receipts.summary.generatedReceipts}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<Send className="size-5" />}
              label="Quittances envoyees"
              value={receipts.summary.sentReceipts}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/55 bg-ring/18 shadow-ring/10"
              icon={<Home className="size-5" />}
              label="Logements concernes"
              value={receipts.summary.propertiesWithReceipts}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur les quittances"
          description="Demandes a traiter depuis le detail contrat."
        />
        {receipts.summary.requestedReceipts === 0 ? (
          <EmptyState
            title="Aucune demande en attente"
            description="Les demandes locataires apparaitront ici."
          />
        ) : (
          <SpotlightCard tone="warning">
            <ActionCard
              title={`${receipts.summary.requestedReceipts} demande(s) de quittance`}
              description="Des locataires attendent une quittance. Ouvrez le contrat concerne pour utiliser le workflow existant."
              href="/owner/contracts"
              actionLabel="Voir les contrats"
              tone="warning"
            />
          </SpotlightCard>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Demandes en attente"
          description="Quittances demandees par les locataires, sans generation automatique ici."
        />
        {receipts.requestedReceipts.length === 0 ? (
          <EmptyState
            title="Aucune demande"
            description="Aucune demande de quittance n'est en attente."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {receipts.requestedReceipts.map((receipt) => (
              <SpotlightCard key={receipt.id} tone="warning">
                <article className="h-full rounded-xl border border-chart-4/55 bg-chart-4/14 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {receipt.property.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getTenantLabel(receipt)} -{" "}
                        {formatDate(receipt.periodStart)} au{" "}
                        {formatDate(receipt.periodEnd)}
                      </p>
                      <div className="mt-3">
                        <StatusBadge
                          tone={getReceiptStatusTone(receipt.status)}
                        >
                          {receiptStatusLabels[receipt.status] ??
                            receipt.status}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="space-y-3 sm:text-right">
                      <p className="font-semibold text-foreground">
                        {formatMoney(
                          receipt.totalAmountInCents,
                          receipt.currency,
                        )}
                      </p>
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        href={`/owner/properties/${receipt.property.id}/contracts/${receipt.rentalContract.id}?focus=receipt-${receipt.id}`}
                      >
                        Traiter la demande
                      </Link>
                    </div>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Quittances disponibles"
          description="Documents generes ou envoyes, avec lien PDF existant."
        />
        {receipts.availableReceipts.length === 0 ? (
          <EmptyState
            title="Aucune quittance disponible"
            description="Les quittances generees apparaitront ici avec leur lien PDF."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {receipts.availableReceipts.map((receipt) => {
              const filename = buildReceiptPdfFilename({
                propertyName: receipt.property.name,
                periodStart: receipt.periodStart,
                totalAmountInCents: receipt.totalAmountInCents,
                currency: receipt.currency,
              });

              return (
                <SpotlightCard
                  href={`/receipts/${receipt.id}/pdf`}
                  key={receipt.id}
                  tone="success"
                >
                  <article className="h-full rounded-xl border border-primary/50 bg-primary/12 p-5 text-card-foreground shadow-sm shadow-black/10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {receipt.property.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {filename}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Locataire : {getTenantLabel(receipt)}
                        </p>
                      </div>
                      <StatusBadge tone={getReceiptStatusTone(receipt.status)}>
                        {receiptStatusLabels[receipt.status] ?? receipt.status}
                      </StatusBadge>
                    </div>
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
