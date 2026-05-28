import Link from "next/link";
import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  FileSpreadsheet,
  Home,
  WalletCards,
} from "lucide-react";

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
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import {
  getDefaultOwnerFinanceExportPeriod,
  getOwnerFinanceExportData,
  parseOwnerFinanceExportPeriodFromSearchParams,
  type OwnerFinanceExportPeriod,
} from "@/server/owner/finance-export";

type OwnerFinancesExportPageProps = {
  searchParams?: Promise<{
    month?: string | string[];
    periodType?: string | string[];
    year?: string | string[];
  }>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPeriodSearchParams(params: {
  month?: string | string[];
  periodType?: string | string[];
  year?: string | string[];
}) {
  const searchParams = new URLSearchParams();
  const periodType = getSingleParam(params.periodType);
  const month = getSingleParam(params.month);
  const year = getSingleParam(params.year);

  if (periodType) {
    searchParams.set("periodType", periodType);
  }

  if (month) {
    searchParams.set("month", month);
  }

  if (year) {
    searchParams.set("year", year);
  }

  return searchParams;
}

async function getExportPeriodForPage(
  searchParams?: OwnerFinancesExportPageProps["searchParams"],
) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const hasPeriodInput =
    !!getSingleParam(resolvedSearchParams.periodType) ||
    !!getSingleParam(resolvedSearchParams.month) ||
    !!getSingleParam(resolvedSearchParams.year);

  if (!hasPeriodInput) {
    return getDefaultOwnerFinanceExportPeriod();
  }

  try {
    return parseOwnerFinanceExportPeriodFromSearchParams(
      getPeriodSearchParams(resolvedSearchParams),
    );
  } catch {
    return getDefaultOwnerFinanceExportPeriod();
  }
}

async function getExportDataForPage(period: OwnerFinanceExportPeriod) {
  try {
    return await getOwnerFinanceExportData(period);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getDownloadParams(period: OwnerFinanceExportPeriod) {
  const params = new URLSearchParams({
    periodType: period.periodType,
  });

  if (period.periodType === "month") {
    params.set("month", period.month);
  } else {
    params.set("year", period.year);
  }

  return params.toString();
}

function getCsvDownloadHref(period: OwnerFinanceExportPeriod) {
  return `/owner/finances/export/download?${getDownloadParams(period)}`;
}

function getXlsxDownloadHref(period: OwnerFinanceExportPeriod) {
  return `/owner/finances/export/download-xlsx?${getDownloadParams(period)}`;
}

function getFormDefaults(period: OwnerFinanceExportPeriod) {
  const fallback = getDefaultOwnerFinanceExportPeriod();
  const fallbackMonth = fallback.periodType === "month" ? fallback.month : "";
  const fallbackYear = fallback.filenameToken.slice(0, 4);

  return {
    month: period.periodType === "month" ? period.month : fallbackMonth,
    year: period.periodType === "year" ? period.year : fallbackYear,
  };
}

function getCashFlowTone(amountInCents: number) {
  return amountInCents < 0 ? "danger" : "success";
}

export default async function OwnerFinancesExportPage({
  searchParams,
}: OwnerFinancesExportPageProps) {
  const period = await getExportPeriodForPage(searchParams);
  const exportData = await getExportDataForPage(period);
  const csvDownloadHref = getCsvDownloadHref(period);
  const xlsxDownloadHref = getXlsxDownloadHref(period);
  const formDefaults = getFormDefaults(period);
  const cashFlowTone = getCashFlowTone(
    exportData.summary.estimatedCashFlowInCents,
  );

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Finances"
        title="Exporter mes finances"
        description="Téléchargez un fichier Excel clair avec les mouvements financiers connus par RentFlow."
        actions={
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/owner/finances"
          >
            Retour aux finances
          </Link>
        }
      />

      <InfoAlert title="Export à vérifier">
        Cet export est préparé à partir des données connues de RentFlow. Il doit
        être vérifié avant tout usage comptable ou fiscal officiel.
      </InfoAlert>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SpotlightCard tone="info">
          <section className="h-full rounded-2xl border border-ring/35 bg-ring/8 p-5 text-card-foreground shadow-sm shadow-black/10">
            <div className="flex items-start gap-3">
              <div className="rounded-xl border border-ring/45 bg-ring/18 p-2 text-ring">
                <FileSpreadsheet className="size-5" />
              </div>
              <div>
                <h2 className="font-semibold tracking-normal text-foreground">
                  Préparer l&apos;export Excel
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Choisissez une période, vérifiez l&apos;aperçu, puis
                  téléchargez un classeur lisible, filtrable et prêt à partager
                  avec un comptable.
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  L&apos;export Excel est recommandé pour une lecture propre, le
                  tri et le partage. Le CSV reste disponible en format brut.
                </p>
              </div>
            </div>

            <form action="/owner/finances/export" className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Période
                  <select
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    defaultValue={period.periodType}
                    name="periodType"
                  >
                    <option value="month">Mois</option>
                    <option value="year">Année</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Mois
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    defaultValue={formDefaults.month}
                    name="month"
                    type="month"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-foreground">
                  Année
                  <input
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    defaultValue={formDefaults.year}
                    min="2000"
                    name="year"
                    type="number"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className={buttonVariants({ variant: "outline" })}
                  type="submit"
                >
                  Actualiser l&apos;aperçu
                </button>
                <Link className={buttonVariants()} href={xlsxDownloadHref}>
                  <ArrowDownToLine className="mr-2 size-4" />
                  Télécharger l&apos;export Excel
                </Link>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href={csvDownloadHref}
                >
                  Télécharger le CSV
                </Link>
              </div>
            </form>
          </section>
        </SpotlightCard>

        <section className="space-y-4">
          <SectionHeader
            title="Aperçu de l'export"
            description={`Période sélectionnée : ${period.label}.`}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SpotlightCard tone="info">
              <StatCard
                className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
                icon={<WalletCards className="size-5" />}
                label="Loyers confirmés"
                value={formatMoney(exportData.summary.confirmedRentInCents)}
              />
            </SpotlightCard>
            <SpotlightCard tone="danger">
              <StatCard
                className="h-full border-destructive/70 bg-destructive/24 shadow-destructive/15"
                label="Sorties connues"
                value={formatMoney(exportData.summary.outgoingAmountInCents)}
              />
            </SpotlightCard>
            <SpotlightCard tone={cashFlowTone}>
              <StatCard
                className={cn(
                  "h-full",
                  cashFlowTone === "success"
                    ? "border-primary/80 bg-primary/30 shadow-primary/20"
                    : "border-destructive/75 bg-destructive/24 shadow-destructive/15",
                )}
                icon={<BarChart3 className="size-5" />}
                label="Cash-flow estimé"
                value={formatSignedMoney(
                  exportData.summary.estimatedCashFlowInCents,
                )}
              />
            </SpotlightCard>
            <SpotlightCard tone="info">
              <StatCard
                className="h-full border-ring/55 bg-ring/18 shadow-ring/10"
                icon={<Home className="size-5" />}
                label="Biens inclus"
                value={exportData.summary.propertiesCount}
              />
            </SpotlightCard>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-background/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Période
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays className="size-4 text-ring" />
                {period.label}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/55 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lignes exportées
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {exportData.summary.rowsCount}
              </p>
            </div>
          </div>
        </section>
      </div>

      {exportData.summary.rowsCount === 0 ? (
        <EmptyState
          description="Le fichier contiendra l'en-tête, la période et l'avertissement de vérification."
          action={
            <Link className={buttonVariants()} href={xlsxDownloadHref}>
              Télécharger l&apos;export Excel vide
            </Link>
          }
          title="Aucune donnée financière à exporter pour cette période."
        />
      ) : (
        <section className="space-y-4">
          <SectionHeader
            title="Mouvements inclus"
            description="Les loyers confirmés, paiements suivis, déclarations locataire et sorties connues seront distingués dans l'export."
          />
          <div className="grid gap-3">
            {exportData.rows.slice(0, 6).map((row) => (
              <div
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-background/55 p-4 shadow-sm shadow-black/5 sm:flex-row sm:items-center sm:justify-between"
                key={`${row.source}-${row.internalId}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.category}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.propertyName} · {row.description}
                  </p>
                </div>
                <StatusBadge tone={row.netInCents < 0 ? "danger" : "info"}>
                  {row.netInCents === 0
                    ? "Suivi"
                    : formatSignedMoney(row.netInCents)}
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
