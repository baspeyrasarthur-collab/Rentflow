import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Plus,
  ReceiptText,
  Repeat2,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  InfoAlert,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";

import { DemoActionPill, type DemoActionPillTone } from "../demo-action-pill";
import { demoDashboardData } from "../demo-data";
import { DemoSpotlightCard } from "../demo-spotlight-card";

const financeActionIcons: Record<string, ReactNode> = {
  "Ajouter une depense": <Plus className="size-5" />,
  "Ajouter une depense recurrente": <Repeat2 className="size-5" />,
  "Generer les depenses recurrentes du mois": <Repeat2 className="size-5" />,
  "Exporter mes finances": <FileText className="size-5" />,
};

const financeActionTones: Record<string, DemoActionPillTone> = {
  "Ajouter une depense": "success",
  "Ajouter une depense recurrente": "info",
  "Generer les depenses recurrentes du mois": "warning",
  "Exporter mes finances": "default",
};

function getRemainingRentInCents(property: {
  expectedRentInCents: number;
  collectedRentInCents: number;
}) {
  return Math.max(
    property.expectedRentInCents - property.collectedRentInCents,
    0,
  );
}

function getCashFlowInCents(property: {
  collectedRentInCents: number;
  outgoingAmountInCents: number;
}) {
  return property.collectedRentInCents - property.outgoingAmountInCents;
}

function formatDemoSignedMoney(amountInCents: number) {
  const formattedAmount = formatMoney(Math.abs(amountInCents));

  return amountInCents < 0 ? `-${formattedAmount}` : `+${formattedAmount}`;
}

function formatDemoOutgoingMoney(amountInCents: number) {
  return `-${formatMoney(Math.abs(amountInCents))}`;
}

function getCashFlowTone(amountInCents: number) {
  return amountInCents < 0 ? "danger" : "success";
}

function getCashFlowCardClassName(amountInCents: number) {
  return amountInCents < 0
    ? "h-full border-destructive/75 bg-destructive/24 shadow-destructive/15"
    : "h-full border-primary/80 bg-primary/30 shadow-primary/20";
}

function getCashFlowBubbleClassName(amountInCents: number) {
  return amountInCents < 0
    ? "border-destructive/65 bg-destructive/18 text-destructive"
    : "border-primary/70 bg-primary/22 text-primary";
}

export default function DemoFinancesPage() {
  const { summary } = demoDashboardData;
  const cashFlowTone = getCashFlowTone(summary.cashFlowInCents);

  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="Démo publique - données fictives"
        title="Finances"
        description="Visualisez les entrées, sorties et le cash-flow estimé de biens fictifs."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo"
            >
              Retour démo
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/pricing"
            >
              Voir les plans
            </Link>
            <Link className={buttonVariants()} href="/sign-up">
              Créer un compte
            </Link>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeader
          description={`Indicateurs fictifs du mois de ${demoDashboardData.monthLabel}.`}
          title="Résumé financier"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<BarChart3 className="size-5" />}
              label="Loyers attendus"
              value={formatMoney(summary.expectedRentInCents)}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<CheckCircle2 className="size-5" />}
              label="Loyers encaissés"
              value={formatMoney(summary.collectedRentInCents)}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<WalletCards className="size-5" />}
              label="Reste à encaisser"
              value={formatMoney(summary.remainingRentInCents)}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="danger">
            <StatCard
              className="h-full border-destructive/70 bg-destructive/24 shadow-destructive/15"
              icon={<FileText className="size-5" />}
              label="Sorties"
              value={formatMoney(summary.outgoingAmountInCents)}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone={cashFlowTone}>
            <StatCard
              className={getCashFlowCardClassName(summary.cashFlowInCents)}
              icon={<BarChart3 className="size-5" />}
              label="Cash-flow estimé"
              value={formatDemoSignedMoney(summary.cashFlowInCents)}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <DemoSpotlightCard tone="info">
        <InfoAlert title="Lecture du mois">
          Cette page reprend l&apos;esprit de la page Finances owner avec des
          données fictives. Les emprunts restent déclaratifs : aucun intérêt ni
          amortissement n&apos;est calculé automatiquement.
        </InfoAlert>
      </DemoSpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          description="Actions fictives qui montrent ce que la page connectée rend accessible."
          title="À vérifier ce mois"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <DemoSpotlightCard href="/sign-up" tone="warning">
            <ActionCard
              className="h-full"
              description="Des loyers attendus ne sont pas encore confirmés comme reçus."
              icon={<WalletCards className="size-5" />}
              title={`${summary.watchPaymentsCount} paiement(s) à surveiller`}
              tone="warning"
              value={summary.watchPaymentsCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard href="/sign-up" tone="success">
            <ActionCard
              className="h-full"
              description="Les dépenses récurrentes du mois peuvent être générées explicitement."
              icon={<Repeat2 className="size-5" />}
              title="Dépenses récurrentes"
              tone="success"
              value={summary.recurringExpensesCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard href="/sign-up" tone="info">
            <ActionCard
              className="h-full"
              description="Une quittance fictive est disponible ou prête à être générée."
              icon={<ReceiptText className="size-5" />}
              title="Quittances"
              tone="info"
              value={summary.availableReceiptsCount}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Même lecture que dans l'app connectée, mais sans requête base."
          title="Vue par bien"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoDashboardData.properties.map((property) => (
            <DemoSpotlightCard key={property.id} tone="info">
              <article className="h-full rounded-xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold tracking-normal">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city} - {property.type}
                    </p>
                  </div>
                  <StatusBadge
                    tone={property.statusTone as "success" | "info" | "warning"}
                  >
                    {property.status}
                  </StatusBadge>
                </div>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Loyers attendus</dt>
                    <dd className="font-medium">
                      {formatMoney(property.expectedRentInCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Loyers encaissés</dt>
                    <dd className="font-medium">
                      {formatMoney(property.collectedRentInCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Reste à encaisser</dt>
                    <dd className="font-medium">
                      {formatMoney(getRemainingRentInCents(property))}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Sorties</dt>
                    <dd className="font-medium">
                      {formatMoney(property.outgoingAmountInCents)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-3">
                    <dt className="text-muted-foreground">Cash-flow estimé</dt>
                    <dd className="font-medium">
                      {formatDemoSignedMoney(getCashFlowInCents(property))}
                    </dd>
                  </div>
                </dl>
              </article>
            </DemoSpotlightCard>
          ))}
        </div>

        <DemoSpotlightCard tone={cashFlowTone}>
          <div
            className={`flex flex-col gap-2 rounded-xl border px-5 py-4 shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between ${getCashFlowBubbleClassName(summary.cashFlowInCents)}`}
          >
            <p className="text-base font-semibold tracking-normal">
              Cash-flow total estimé ={" "}
              <span>{formatDemoSignedMoney(summary.cashFlowInCents)}</span>
            </p>
            <p className="text-sm text-foreground/75">
              Somme des loyers encaissés moins les sorties du mois.
            </p>
          </div>
        </DemoSpotlightCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Paiements fictifs qui illustrent les échéances à suivre."
          title="Paiements à surveiller"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {demoDashboardData.watchPayments.map((payment) => (
            <DemoSpotlightCard key={payment.id} tone="warning">
              <article className="h-full rounded-xl border border-chart-4/45 bg-chart-4/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold tracking-normal">
                      {payment.propertyName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.city} - {payment.label} - {payment.dueLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatMoney(payment.amountInCents)}
                    </p>
                    <StatusBadge className="mt-2" tone="warning">
                      {payment.status}
                    </StatusBadge>
                  </div>
                </div>
              </article>
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Les frais RentFlow restent séparés des Expense dans l'app réelle."
          title="Sorties"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <DemoSpotlightCard tone="success">
            <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <h3 className="font-semibold tracking-normal">
                Dépenses récurrentes fictives
              </h3>
              <div className="mt-4 divide-y">
                {demoDashboardData.recurringExpenses.map((expense) => (
                  <div
                    className="flex items-start justify-between gap-4 py-3 text-sm"
                    key={expense.id}
                  >
                    <div>
                      <p className="font-medium">{expense.label}</p>
                      <p className="mt-1 text-muted-foreground">
                        {expense.propertyName}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatMoney(expense.amountInCents)}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </DemoSpotlightCard>

          <DemoSpotlightCard tone="warning">
            <article className="h-full rounded-xl border border-destructive/45 bg-destructive/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <h3 className="font-semibold tracking-normal">
                Sorties par catégorie
              </h3>
              <div className="mt-4 divide-y">
                {demoDashboardData.expenseCategories.map((category) => (
                  <div
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                    key={category.id}
                  >
                    <span className="text-muted-foreground">
                      {category.label}
                    </span>
                    <span className="font-medium">
                      {formatMoney(category.amountInCents)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </DemoSpotlightCard>
        </div>

        <DemoSpotlightCard tone="danger">
          <div className="flex flex-col gap-2 rounded-xl border border-destructive/70 bg-destructive/20 px-5 py-4 text-destructive shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base font-semibold tracking-normal">
              Total des sorties ={" "}
              <span>
                {formatDemoOutgoingMoney(summary.outgoingAmountInCents)}
              </span>
            </p>
            <p className="text-sm text-foreground/75">
              Somme des dépenses et frais pris en compte dans le mois.
            </p>
          </div>
        </DemoSpotlightCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Raccourcis fictifs vers les actions clés."
          title="Actions rapides"
        />
        <div className="flex flex-wrap gap-3">
          {demoDashboardData.financeActions.map((action) => (
            <DemoActionPill
              icon={financeActionIcons[action]}
              key={action}
              label={action}
              tone={financeActionTones[action] ?? "default"}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
