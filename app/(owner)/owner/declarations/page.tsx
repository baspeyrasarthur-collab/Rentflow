import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  HelpCircle,
  Home,
  ReceiptText,
  UserRound,
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
import {
  getDefaultOwnerDeclarationsYear,
  getOwnerDeclarationsOverview,
  parseOwnerDeclarationsYearParam,
} from "@/server/owner/declarations";

type OwnerDeclarationsPageProps = {
  searchParams?: Promise<{
    focus?: string | string[];
    year?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getDeclarationsForPage(year?: number | null) {
  try {
    return await getOwnerDeclarationsOverview(year);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function buildYearOptions(selectedYear: number) {
  const defaultYear = getDefaultOwnerDeclarationsYear();

  return Array.from(
    new Set([defaultYear - 1, defaultYear, defaultYear + 1, selectedYear]),
  ).sort((first, second) => second - first);
}

function getFiscalBadgeTone(furnished: boolean) {
  return furnished ? "warning" : "info";
}

function DeclarationHelpItem({
  children,
  sourceHref,
  sourceLabel,
  title,
}: {
  children: string;
  sourceHref: string;
  sourceLabel: string;
  title: string;
}) {
  return (
    <details className="group rounded-xl border border-ring/30 bg-ring/8 p-4 text-sm text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/55 hover:bg-ring/12">
      <summary className="cursor-pointer list-none font-semibold tracking-normal text-foreground">
        <span className="inline-flex items-center gap-2">
          <HelpCircle className="size-4 text-ring" />
          {title}
        </span>
      </summary>
      <div className="mt-3 space-y-3 text-muted-foreground">
        <p>{children}</p>
        <a
          className="inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/80"
          href={sourceHref}
          rel="noreferrer"
          target="_blank"
        >
          Source officielle : {sourceLabel}
        </a>
      </div>
    </details>
  );
}

export default async function OwnerDeclarationsPage({
  searchParams,
}: OwnerDeclarationsPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedYear = parseOwnerDeclarationsYearParam(
    getSearchParamValue(resolvedSearchParams?.year),
  );
  const focus = getSearchParamValue(resolvedSearchParams?.focus);
  const isMissingDataFocus = focus === "missing-data";
  const declarations = await getDeclarationsForPage(selectedYear);
  const { personalInfoMissingFields, signals, summary } = declarations;
  const yearOptions = buildYearOptions(declarations.selectedYear);
  const missingActions = [
    {
      visible: summary.propertiesCount === 0,
      title: "Aucun logement connu",
      description:
        "Ajoutez vos logements pour préparer ensuite les revenus, occupations et informations utiles.",
      href: "/owner/properties/new",
      actionLabel: "Ajouter un logement",
      icon: <Home className="size-5" />,
      tone: "info" as const,
    },
    {
      visible: personalInfoMissingFields.length > 0,
      title: "Informations personnelles utiles a completer",
      description: `Champs manquants : ${personalInfoMissingFields
        .map((field) => field.label)
        .join(
          ", ",
        )}. Ces informations aident RentFlow a preparer vos donnees fiscales, a verifier avant toute declaration officielle.`,
      href: "/owner/account?focus=personal-info",
      actionLabel: "Completer mes informations",
      icon: <UserRound className="size-5" />,
      tone: "info" as const,
    },
    {
      visible: summary.preparedRentalIncomeInCents === 0,
      title: "Aucun paiement confirmé trouvé pour cette année",
      description:
        "Le montant préparé utilise uniquement les loyers confirmés comme reçus avec une date d'encaissement dans l'année.",
      href: "/owner/payments",
      actionLabel: "Voir les paiements",
      icon: <WalletCards className="size-5" />,
      tone: "info" as const,
    },
    {
      visible: summary.expensesToReviewInCents > 0,
      title: "Dépenses enregistrées à vérifier",
      description:
        "Certaines dépenses sont enregistrées, mais RentFlow ne les déduit pas automatiquement.",
      href: "/owner/finances",
      actionLabel: "Voir les finances",
      icon: <ReceiptText className="size-5" />,
      tone: "warning" as const,
    },
  ].filter((action) => action.visible);
  const personalizedAdvice = [
    {
      visible: signals.hasHighExpenseRatio,
      title: "Piste à vérifier : dépenses importantes",
      description:
        "Vos dépenses enregistrées semblent importantes par rapport à vos loyers. Il peut être utile de comparer votre régime fiscal avec un professionnel.",
      tone: "warning" as const,
    },
    {
      visible: signals.hasFurnishedProperties,
      title: "Piste à vérifier : logements marqués meublés",
      description:
        "Certains logements sont marqués meublés dans RentFlow. Vérifiez s'ils relèvent bien de la location meublée au sens fiscal.",
      tone: "info" as const,
    },
    {
      visible: signals.hasMultipleProperties,
      title: "Piste à vérifier : plusieurs biens",
      description:
        "Avec plusieurs biens, il peut être utile de vérifier l'organisation la plus adaptée avec un professionnel. Une structure dédiée comme une SCI peut être un sujet à comparer selon votre situation.",
      tone: "info" as const,
    },
  ].filter((advice) => advice.visible);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Fiscalité"
        title="Déclarations"
        description="Préparez les montants et informations utiles pour vos déclarations locatives."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Voir les finances
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Voir les logements
            </Link>
          </>
        }
      />

      <article className="rounded-2xl border border-ring/70 bg-ring/20 p-6 text-card-foreground shadow-xl shadow-ring/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-ring/90 hover:shadow-2xl hover:shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <StatusBadge tone="info">
              Année {declarations.selectedYear}
            </StatusBadge>
            <div>
              <h2 className="text-2xl font-semibold tracking-normal text-foreground">
                Montant préparé à vérifier :{" "}
                {formatMoney(summary.preparedRentalIncomeInCents)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Ce montant est calculé à partir des données connues dans
                RentFlow sur votre profil. Il doit être vérifié avant toute
                déclaration officielle.
              </p>
            </div>
          </div>

          <form className="rounded-xl border border-border/80 bg-background/45 p-4">
            <label
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              htmlFor="year"
            >
              Année à préparer
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={declarations.selectedYear}
                id="year"
                name="year"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                className={buttonVariants({ variant: "outline", size: "sm" })}
                type="submit"
              >
                Afficher
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-ring/35 bg-ring/12 p-4">
            <p className="text-sm text-muted-foreground">Paiements inclus</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary.paymentsIncludedCount}
            </p>
          </div>
          <div className="rounded-xl border border-primary/35 bg-primary/12 p-4">
            <p className="text-sm text-muted-foreground">Logements concernés</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary.propertiesWithIncome}
            </p>
          </div>
          <div className="rounded-xl border border-chart-4/45 bg-chart-4/14 p-4">
            <p className="text-sm text-muted-foreground">
              Paiements non confirmés
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {summary.paymentsNotConfirmedCount}
            </p>
          </div>
        </div>
      </article>

      <SpotlightCard tone="warning">
        <InfoAlert title="À vérifier avant toute déclaration" tone="warning">
          <p>
            RentFlow prépare les montants et informations utiles à vérifier
            avant votre déclaration. La déclaration finale se fait sur
            impots.gouv.fr ou avec un professionnel si nécessaire.
          </p>
        </InfoAlert>
      </SpotlightCard>

      {missingActions.length > 0 || isMissingDataFocus ? (
        <SpotlightCard tone={isMissingDataFocus ? "warning" : "info"}>
          <section
            className={cn(
              "space-y-4 rounded-xl border border-transparent p-4 transition-all duration-300",
              isMissingDataFocus
                ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
                : "bg-card/40",
            )}
            id="missing-data"
          >
            <SectionHeader
              title="Données à compléter"
              description="Les points qui limitent encore la précision de la préparation."
            />
            {isMissingDataFocus ? (
              <InfoAlert title="Action ciblee" tone="warning">
                Action ciblee : completez les informations manquantes pour
                preparer un montant plus fiable a verifier.
              </InfoAlert>
            ) : null}
            {missingActions.length === 0 ? (
              <InfoAlert tone="success">
                Les données principales connues dans RentFlow sont prêtes à être
                vérifiées.
              </InfoAlert>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {missingActions.map((action) => (
                  <ActionCard
                    actionLabel={action.actionLabel}
                    className="h-full"
                    description={action.description}
                    href={action.href}
                    icon={action.icon}
                    key={action.title}
                    title={action.title}
                    tone={action.tone}
                  />
                ))}
              </div>
            )}
          </section>
        </SpotlightCard>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Détail par logement"
          description="Montants préparés par bien, sans déduction automatique des dépenses."
        />

        {declarations.propertyBreakdown.length === 0 ? (
          <EmptyState
            title="Aucun logement à analyser"
            description="Ajoutez un premier logement pour préparer les montants et informations utiles."
            action={
              <Link className={buttonVariants()} href="/owner/properties/new">
                Ajouter un logement
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {declarations.propertyBreakdown.map((property) => (
              <article
                className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/60"
                key={property.propertyId}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-normal text-foreground">
                      {property.propertyName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}
                    </p>
                  </div>
                  <StatusBadge tone={getFiscalBadgeTone(property.furnished)}>
                    {property.fiscalStatusMessage}
                  </StatusBadge>
                </div>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <p className="text-muted-foreground">Loyers confirmés</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatMoney(property.incomeInCents)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-chart-4/40 bg-chart-4/12 p-3">
                    <p className="text-muted-foreground">Dépenses à vérifier</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatMoney(property.expensesInCents)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-ring/35 bg-ring/10 p-3">
                    <p className="text-muted-foreground">Paiements inclus</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {property.paymentsIncludedCount}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Dépenses enregistrées à vérifier"
          description="Ces dépenses restent séparées du montant préparé."
        />
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<ReceiptText className="size-5" />}
              label="Dépenses enregistrées à vérifier"
              value={formatMoney(summary.expensesToReviewInCents)}
              hint="Non déduites automatiquement du montant préparé."
            />
          </SpotlightCard>

          <SpotlightCard tone="warning">
            <article className="h-full rounded-xl border border-chart-4/45 bg-chart-4/10 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-chart-4/60">
              <p className="text-sm leading-6 text-muted-foreground">
                Ces dépenses peuvent être utiles selon votre régime fiscal.
                RentFlow ne les déduit pas automatiquement du montant préparé.
              </p>
              {declarations.expenseCategories.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Aucune dépense non annulée n&apos;est enregistrée sur cette
                  année.
                </p>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {declarations.expenseCategories.map((category) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm"
                      key={category.category}
                    >
                      <span className="text-muted-foreground">
                        {category.label}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(category.amountInCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Conseils personnalisés"
          description="Des pistes prudentes, affichées seulement quand RentFlow détecte un signal utile."
        />
        <details className="group rounded-xl border border-ring/35 bg-ring/8 p-4 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/55">
          <summary className="cursor-pointer list-none font-semibold tracking-normal text-foreground">
            Voir les conseils personnalisés
          </summary>
          <div className="mt-4">
            {personalizedAdvice.length === 0 ? (
              <InfoAlert tone="success">
                Aucun conseil personnalisé prioritaire pour le moment.
              </InfoAlert>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                {personalizedAdvice.map((advice) => (
                  <article
                    className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/60"
                    key={advice.title}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-ring/50 bg-ring/20 text-ring">
                        <AlertTriangle className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {advice.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {advice.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </details>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Comment déclarer ?"
          description="Repères courts à vérifier sur les sources officielles."
        />
        <SpotlightCard tone="info">
          <div className="grid gap-3 rounded-xl border border-ring/25 bg-ring/6 p-3 lg:grid-cols-2">
            <DeclarationHelpItem
              sourceHref="https://www.impots.gouv.fr/particulier/location-vide-de-meubles"
              sourceLabel="impots.gouv.fr"
              title="Location nue"
            >
              Les loyers d&apos;une location non meublée relèvent généralement
              des revenus fonciers. Vérifiez le régime applicable sur
              impots.gouv.fr.
            </DeclarationHelpItem>
            <DeclarationHelpItem
              sourceHref="https://www.service-public.fr/particuliers/vosdroits/F32744"
              sourceLabel="service-public.fr"
              title="Location meublée"
            >
              Les revenus de location meublée relèvent généralement des BIC et
              de la déclaration complémentaire 2042-C-PRO. Vérifiez selon votre
              situation.
            </DeclarationHelpItem>
            <DeclarationHelpItem
              sourceHref="https://www.impots.gouv.fr/gerer-mes-biens-immobiliers"
              sourceLabel="impots.gouv.fr"
              title="Déclaration d'occupation"
            >
              Les changements d&apos;occupation doivent être vérifiés dans le
              service Gérer mes biens immobiliers.
            </DeclarationHelpItem>
            <DeclarationHelpItem
              sourceHref="https://www.service-public.fr/particuliers/vosdroits/F59"
              sourceLabel="service-public.fr"
              title="Taxe foncière"
            >
              La taxe foncière peut être utile à examiner selon votre situation
              et votre régime. Vérifiez les règles applicables avant toute
              déclaration.
            </DeclarationHelpItem>
            <DeclarationHelpItem
              sourceHref="https://www.impots.gouv.fr/particulier/je-declare-mes-locations"
              sourceLabel="impots.gouv.fr"
              title="SCI / cas complexes"
            >
              SCI, indivision, LMNP réel, meublé touristique et situations
              complexes doivent être vérifiés avec les sources officielles ou un
              professionnel.
            </DeclarationHelpItem>
          </div>
        </SpotlightCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Synthèse de préparation"
          description="Ce que RentFlow sait préparer aujourd'hui, sans déclaration officielle."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<FileText className="size-5" />}
              label="Année préparée"
              value={declarations.selectedYear}
            />
          </SpotlightCard>
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/24 shadow-primary/15"
              icon={<CheckCircle2 className="size-5" />}
              label="Logements avec revenus"
              value={summary.propertiesWithIncome}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<WalletCards className="size-5" />}
              label="Paiements non confirmés"
              value={summary.paymentsNotConfirmedCount}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/55 bg-ring/16"
              icon={<Building2 className="size-5" />}
              label="Logements connus"
              value={summary.propertiesCount}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Actions rapides"
          description="Raccourcis vers les prochaines actions du parcours owner."
        />
        <SpotlightCard tone="default">
          <div className="rounded-xl border border-border bg-card/45 p-4">
            <OwnerQuickActions />
          </div>
        </SpotlightCard>
      </section>
    </section>
  );
}
