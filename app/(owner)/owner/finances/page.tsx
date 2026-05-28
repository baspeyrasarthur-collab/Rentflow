import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  FileText,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
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
import {
  addOwnerFinanceMonths,
  formatOwnerFinanceMonthParam,
  getOwnerFinancesData,
} from "@/server/owner/finances";

type OwnerFinancesPageProps = {
  searchParams?: Promise<{
    month?: string | string[];
    startMonth?: string | string[];
    endMonth?: string | string[];
    recurringCreated?: string | string[];
    recurringSkipped?: string | string[];
    recurringEligible?: string | string[];
  }>;
};

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

const expenseStatusLabels: Record<string, string> = {
  PLANNED: "En attente",
  PENDING: "En attente",
  PAID: "Payee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFinanceSignedMoney(amountInCents: number) {
  const formattedAmount = formatMoney(Math.abs(amountInCents));

  return amountInCents < 0 ? `-${formattedAmount}` : `+${formattedAmount}`;
}

function formatFinanceOutgoingMoney(amountInCents: number) {
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

async function getFinancesForPage(params: {
  month?: string;
  startMonth?: string;
  endMonth?: string;
}) {
  try {
    return await getOwnerFinancesData(params);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getMonthParam(month: string | string[] | undefined) {
  return Array.isArray(month) ? month[0] : month;
}

function getPeriodLabel(start: Date, end: Date) {
  const inclusiveEnd = addOwnerFinanceMonths(end, -1);

  if (
    start.getFullYear() === inclusiveEnd.getFullYear() &&
    start.getMonth() === inclusiveEnd.getMonth()
  ) {
    return formatMonth(start);
  }

  return `${formatMonth(start)} - ${formatMonth(inclusiveEnd)}`;
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseNonNegativeIntegerParam(value: string | string[] | undefined) {
  const rawValue = getSearchParamValue(value);

  if (!rawValue || !/^\d+$/.test(rawValue)) {
    return null;
  }

  const parsedValue = Number(rawValue);

  return Number.isSafeInteger(parsedValue) ? parsedValue : null;
}

function buildRecurringGenerationFeedback(
  searchParams: Awaited<OwnerFinancesPageProps["searchParams"]>,
) {
  const hasFeedbackParams =
    searchParams?.recurringCreated !== undefined ||
    searchParams?.recurringSkipped !== undefined ||
    searchParams?.recurringEligible !== undefined;

  if (!hasFeedbackParams) {
    return null;
  }

  const createdCount = parseNonNegativeIntegerParam(
    searchParams?.recurringCreated,
  );
  const skippedCount = parseNonNegativeIntegerParam(
    searchParams?.recurringSkipped,
  );
  const totalEligibleRules = parseNonNegativeIntegerParam(
    searchParams?.recurringEligible,
  );

  if (
    createdCount === null ||
    skippedCount === null ||
    totalEligibleRules === null
  ) {
    return {
      message: "Generation des depenses recurrentes terminee.",
      details:
        "Cette action peut etre relancee sans creer de doublon pour ce mois.",
    };
  }

  if (totalEligibleRules === 0) {
    return {
      message: "Aucune regle recurrente active a generer pour ce mois.",
      details:
        "Cette action peut etre relancee sans creer de doublon pour ce mois.",
    };
  }

  if (createdCount > 0) {
    return {
      message: `${createdCount} depense(s) recurrente(s) generee(s) pour ce mois.`,
      details:
        "Cette action peut etre relancee sans creer de doublon pour ce mois.",
    };
  }

  if (skippedCount > 0) {
    return {
      message: "Les depenses recurrentes de ce mois avaient deja ete generees.",
      details:
        "Cette action peut etre relancee sans creer de doublon pour ce mois.",
    };
  }

  return {
    message: "Aucune depense recurrente n'a ete generee pour ce mois.",
    details:
      "Cette action peut etre relancee sans creer de doublon pour ce mois.",
  };
}

function getPaymentStatusTone(status: string) {
  if (status === "FAILED" || status === "DISPUTED") {
    return "danger" as const;
  }

  if (status === "SUCCEEDED") {
    return "success" as const;
  }

  return "warning" as const;
}

function getExpenseStatusTone(status: string) {
  if (status === "PAID") {
    return "success" as const;
  }

  if (status === "CANCELED") {
    return "muted" as const;
  }

  return "info" as const;
}

export default async function OwnerFinancesPage({
  searchParams,
}: OwnerFinancesPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedMonthInput = getMonthParam(resolvedSearchParams?.month);
  const startMonthInput = getMonthParam(resolvedSearchParams?.startMonth);
  const endMonthInput = getMonthParam(resolvedSearchParams?.endMonth);
  const finances = await getFinancesForPage({
    month: selectedMonthInput,
    startMonth: startMonthInput,
    endMonth: endMonthInput,
  });
  const recurringGenerationFeedback =
    buildRecurringGenerationFeedback(resolvedSearchParams);
  const { summary } = finances;
  const previousMonthParam = formatOwnerFinanceMonthParam(
    addOwnerFinanceMonths(finances.periodStart, -1),
  );
  const selectedMonthParam = formatOwnerFinanceMonthParam(finances.periodStart);
  const currentMonthParam = formatOwnerFinanceMonthParam(new Date());
  const periodEndMonthParam = formatOwnerFinanceMonthParam(
    addOwnerFinanceMonths(finances.periodEnd, -1),
  );
  const nextMonthParam = formatOwnerFinanceMonthParam(
    addOwnerFinanceMonths(finances.periodStart, 1),
  );
  const cashFlowTone = getCashFlowTone(summary.cashFlowInCents);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="RentFlow"
        title="Finances"
        description="Suivez les entrees, sorties et le cash-flow estime de vos biens."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances/expenses/new"
            >
              Ajouter une depense
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances/recurring-expenses/new"
            >
              Ajouter une depense recurrente
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances/recurring-expenses"
            >
              Voir les depenses recurrentes
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Periode selectionnee</p>
          <p className="text-lg font-semibold tracking-normal text-foreground">
            {getPeriodLabel(finances.periodStart, finances.periodEnd)}
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <nav
            aria-label="Navigation par mois"
            className="flex flex-wrap gap-2"
          >
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={`/owner/finances?month=${previousMonthParam}`}
            >
              Mois precedent
            </Link>
            <Link
              className={buttonVariants({
                variant:
                  selectedMonthParam === currentMonthParam &&
                  selectedMonthParam === periodEndMonthParam
                    ? "secondary"
                    : "outline",
                size: "sm",
              })}
              href={`/owner/finances?month=${currentMonthParam}`}
            >
              Mois courant
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={`/owner/finances?month=${nextMonthParam}`}
            >
              Mois suivant
            </Link>
          </nav>
          <form className="flex flex-wrap items-end gap-2" method="get">
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="startMonth"
              >
                Debut
              </label>
              <input
                className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={selectedMonthParam}
                id="startMonth"
                name="startMonth"
                type="month"
              />
            </div>
            <div className="space-y-1">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="endMonth"
              >
                Fin
              </label>
              <input
                className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={periodEndMonthParam}
                id="endMonth"
                name="endMonth"
                type="month"
              />
            </div>
            <button
              className={buttonVariants({ variant: "outline", size: "sm" })}
              type="submit"
            >
              Appliquer
            </button>
          </form>
        </div>
      </div>

      {recurringGenerationFeedback ? (
        <InfoAlert title={recurringGenerationFeedback.message} tone="success">
          <p>{recurringGenerationFeedback.details}</p>
        </InfoAlert>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Resume financier"
          description="Les indicateurs principaux du mois selectionne."
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/owner/payments"
            >
              Modifier mes loyers
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<BarChart3 className="size-5" />}
              label="Loyers attendus"
              value={formatMoney(summary.expectedRentInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<CheckCircle2 className="size-5" />}
              label="Loyers encaisses"
              value={formatMoney(summary.collectedRentInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<WalletCards className="size-5" />}
              label="Reste a encaisser"
              value={formatMoney(summary.remainingRentInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone="danger">
            <StatCard
              className="h-full border-destructive/70 bg-destructive/24 shadow-destructive/15"
              icon={<FileText className="size-5" />}
              label="Sorties"
              value={formatMoney(summary.outgoingAmountInCents)}
            />
          </SpotlightCard>
          <SpotlightCard tone={cashFlowTone}>
            <StatCard
              className={getCashFlowCardClassName(summary.cashFlowInCents)}
              icon={<BarChart3 className="size-5" />}
              label="Cash-flow estime"
              value={formatFinanceSignedMoney(summary.cashFlowInCents)}
              hint="Loyers encaisses moins sorties du mois."
            />
          </SpotlightCard>
        </div>
      </section>

      <SpotlightCard tone={cashFlowTone}>
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border px-5 py-4 shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between",
            getCashFlowBubbleClassName(summary.cashFlowInCents),
          )}
        >
          <p className="text-base font-semibold tracking-normal">
            Cash-flow total estime ={" "}
            <span>{formatFinanceSignedMoney(summary.cashFlowInCents)}</span>
          </p>
          <p className="text-sm text-foreground/75">
            Somme des loyers encaisses moins les sorties du mois.
          </p>
        </div>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Vue par bien"
          description="Synthese du mois selectionne, limitee aux biens rattaches a votre profil proprietaire."
        />

        {finances.properties.length === 0 ? (
          <EmptyState
            title="Aucun bien rattache"
            description="Ajoutez un logement pour commencer a suivre les loyers, sorties et cash-flow."
            action={
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/owner/properties/new"
              >
                Ajouter un logement
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {finances.properties.map((property) => (
              <SpotlightCard
                key={property.propertyId}
                tone={getCashFlowTone(property.cashFlowInCents)}
              >
                <article
                  className={cn(
                    "h-full rounded-xl border p-5 text-card-foreground shadow-sm shadow-black/10",
                    property.cashFlowInCents < 0
                      ? "border-destructive/45 bg-destructive/10"
                      : "border-primary/45 bg-primary/10",
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold tracking-normal text-foreground">
                        {property.propertyName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {property.city}
                      </p>
                    </div>
                    <StatusBadge
                      tone={
                        property.cashFlowInCents >= 0 ? "success" : "danger"
                      }
                    >
                      Cash-flow{" "}
                      {formatFinanceSignedMoney(property.cashFlowInCents)}
                    </StatusBadge>
                  </div>
                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Loyers attendus</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(property.expectedRentInCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Loyers encaisses</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(property.collectedRentInCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reste a encaisser</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(property.remainingRentInCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sorties</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(property.outgoingAmountInCents)}
                      </p>
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
          title="Paiements a surveiller"
          description="Paiements de loyer du mois selectionne dont l'echeance est passee et qui ne sont pas encaisses."
        />

        {finances.watchPayments.length === 0 ? (
          <EmptyState
            title="Aucun paiement a surveiller"
            description="Aucun paiement du mois selectionne n'est en retard ou en attente de confirmation."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {finances.watchPayments.map((payment) => (
              <SpotlightCard key={payment.id} tone="warning">
                <article className="h-full rounded-xl border border-chart-4/55 bg-chart-4/14 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {payment.propertyName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {payment.city} - echeance {formatDate(payment.dueDate)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-foreground">
                      {formatMoney(payment.amountInCents, payment.currency)}
                    </p>
                  </div>
                  <div className="mt-4">
                    <StatusBadge tone={getPaymentStatusTone(payment.status)}>
                      {paymentStatusLabels[payment.status] ?? payment.status}
                    </StatusBadge>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-6">
        <SectionHeader
          title="Sorties"
          description="Depenses enregistrees et recurrences prevues, hors frais RentFlow."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner/finances/expenses/new"
              >
                Ajouter une depense
              </Link>
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner/finances/recurring-expenses/new"
              >
                Ajouter une depense recurrente
              </Link>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SpotlightCard tone="danger">
            <StatCard
              className="h-full border-destructive/65 bg-destructive/20 shadow-destructive/10"
              label="Total des sorties enregistrees"
              value={formatMoney(finances.outflows.otherExpensesInCents)}
              hint="Depenses en attente ou payees sur la periode."
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<Repeat2 className="size-5" />}
              label="Recurrences prevues"
              value={formatMoney(
                finances.outflows.recurringPlannedAmountInCents,
              )}
              hint="Regles actives sans occurrence generee pour la periode."
            />
          </SpotlightCard>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <details className="group rounded-xl border border-chart-4/35 bg-chart-4/8 p-4 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-chart-4/55">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-1 pr-8">
                <span className="font-semibold tracking-normal text-foreground">
                  Sorties par categorie
                </span>
                <span className="text-sm leading-6 text-muted-foreground">
                  Classement des depenses saisies, hors frais RentFlow.
                </span>
              </div>
            </summary>
            <div className="mt-4">
              {finances.outflows.expenseCategories.length > 0 ? (
                <SpotlightCard tone="warning">
                  <div className="divide-y overflow-hidden rounded-xl border border-chart-4/45 bg-chart-4/10 text-card-foreground shadow-sm shadow-black/10">
                    {finances.outflows.expenseCategories.map((category) => (
                      <div
                        className="flex items-center justify-between gap-4 p-4 text-sm"
                        key={category.category}
                      >
                        <span className="text-muted-foreground">
                          {category.label}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatMoney(category.amountInCents)}
                        </span>
                      </div>
                    ))}
                  </div>
                </SpotlightCard>
              ) : (
                <EmptyState
                  title="Aucune categorie a afficher"
                  description="Aucune depense proprietaire n'est enregistree sur ce mois."
                />
              )}
            </div>
          </details>

          <details className="group rounded-xl border border-chart-4/35 bg-chart-4/8 p-4 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-chart-4/55">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-1 pr-8">
                <span className="font-semibold tracking-normal text-foreground">
                  Depenses detaillees
                </span>
                <span className="text-sm leading-6 text-muted-foreground">
                  Liste des depenses ponctuelles ou recurrentes generees pour le
                  mois.
                </span>
              </div>
            </summary>
            <div className="mt-4">
              {finances.outflows.expenses.length === 0 ? (
                <EmptyState
                  title="Aucune depense enregistree"
                  description="Ajoutez une depense ou generez les occurrences recurrentes du mois si besoin."
                />
              ) : (
                <div className="space-y-3">
                  {finances.outflows.expenses.map((expense) => (
                    <SpotlightCard key={expense.id} tone="warning">
                      <article className="space-y-3 rounded-xl border border-chart-4/40 bg-chart-4/10 p-4 text-sm text-card-foreground shadow-sm shadow-black/10">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold tracking-normal text-foreground">
                              {expense.label}
                            </h3>
                            <p className="mt-1 text-muted-foreground">
                              {expense.propertyName} -{" "}
                              {formatDate(expense.dueDate)}
                            </p>
                          </div>
                          <p className="shrink-0 font-semibold text-foreground">
                            {formatMoney(
                              expense.amountInCents,
                              expense.currency,
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="muted">
                            {expense.categoryLabel}
                          </StatusBadge>
                          <StatusBadge
                            tone={getExpenseStatusTone(expense.status)}
                          >
                            {expenseStatusLabels[expense.status] ??
                              expense.status}
                          </StatusBadge>
                        </div>
                        <Link
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                          })}
                          href={`/owner/finances/expenses/${expense.id}/edit`}
                        >
                          Modifier
                        </Link>
                      </article>
                    </SpotlightCard>
                  ))}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="space-y-4 pt-2">
          <SectionHeader
            title="Recurrences prevues"
            description="Regles actives visibles sur la periode, sans generation automatique."
          />
          {finances.outflows.recurringPlanned.length === 0 ? (
            <EmptyState
              title="Aucune recurrence prevue"
              description="Les regles recurrentes deja generees sont comptees dans les sorties enregistrees."
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {finances.outflows.recurringPlanned.map((recurring) => (
                <SpotlightCard key={recurring.id} tone="warning">
                  <article className="space-y-3 rounded-xl border border-chart-4/45 bg-chart-4/12 p-4 text-sm text-card-foreground shadow-sm shadow-black/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {recurring.label}
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                          {recurring.propertyName} -{" "}
                          {formatDate(recurring.dueDate)}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold text-foreground">
                        {formatMoney(
                          recurring.amountInCents,
                          recurring.currency,
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="warning">
                        Recurrence prevue
                      </StatusBadge>
                      <StatusBadge tone="muted">
                        {recurring.categoryLabel}
                      </StatusBadge>
                    </div>
                  </article>
                </SpotlightCard>
              ))}
            </div>
          )}
        </div>
      </section>

      <SpotlightCard tone="danger">
        <div className="flex flex-col gap-2 rounded-xl border border-destructive/70 bg-destructive/20 px-5 py-4 text-destructive shadow-sm shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold tracking-normal">
            Total des sorties ={" "}
            <span>
              {formatFinanceOutgoingMoney(summary.outgoingAmountInCents)}
            </span>
          </p>
          <p className="text-sm text-foreground/75">
            Somme des depenses et recurrences prevues prises en compte dans la
            periode.
          </p>
        </div>
      </SpotlightCard>

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
