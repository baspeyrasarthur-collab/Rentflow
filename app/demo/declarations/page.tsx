import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileText,
  HelpCircle,
  ReceiptText,
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

type Tone = "default" | "success" | "info" | "warning" | "danger";

const declarationActionIcons: Record<string, ReactNode> = {
  "Verifier les revenus": <CheckCircle2 className="size-5" />,
  "Completer les donnees": <FileText className="size-5" />,
  "Voir les finances": <WalletCards className="size-5" />,
  "Exporter mes finances": <ReceiptText className="size-5" />,
};

const declarationActionTones: Record<string, DemoActionPillTone> = {
  "Verifier les revenus": "success",
  "Completer les donnees": "warning",
  "Voir les finances": "info",
  "Exporter mes finances": "default",
};

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

export default function DemoDeclarationsPage() {
  const { declarations } = demoDashboardData;

  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="Demo publique - donnees fictives"
        title="Declarations"
        description="Preparez les montants et informations utiles pour vos declarations locatives, sans calcul fiscal officiel."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo/finances"
            >
              Voir les finances
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo/properties"
            >
              Voir les logements
            </Link>
            <Link className={buttonVariants()} href="/sign-up">
              Creer un compte
            </Link>
          </>
        }
      />

      <DemoSpotlightCard tone="info">
        <article className="rounded-2xl border border-ring/70 bg-ring/20 p-6 text-card-foreground shadow-xl shadow-ring/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <StatusBadge tone="info">
                Annee {declarations.selectedYear}
              </StatusBadge>
              <div>
                <h2 className="text-2xl font-semibold tracking-normal text-foreground">
                  Montant prepare a verifier :{" "}
                  {formatMoney(declarations.preparedRentalIncomeInCents)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Ce montant est calcule a partir des donnees fictives connues
                  dans RentFlow. Il doit etre verifie avant toute declaration
                  officielle.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/45 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Annee affichee
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {declarations.selectedYear}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-ring/35 bg-ring/12 p-4">
              <p className="text-sm text-muted-foreground">Paiements inclus</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {declarations.paymentsIncludedCount}
              </p>
            </div>
            <div className="rounded-xl border border-primary/35 bg-primary/12 p-4">
              <p className="text-sm text-muted-foreground">
                Logements concernes
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {declarations.propertiesWithIncome}
              </p>
            </div>
            <div className="rounded-xl border border-chart-4/45 bg-chart-4/14 p-4">
              <p className="text-sm text-muted-foreground">
                Paiements non confirmes
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {declarations.paymentsNotConfirmedCount}
              </p>
            </div>
          </div>
        </article>
      </DemoSpotlightCard>

      <InfoAlert title="A verifier avant toute declaration" tone="warning">
        RentFlow prepare les montants et informations utiles a verifier avant
        votre declaration. La declaration finale se fait sur impots.gouv.fr ou
        avec un professionnel si necessaire.
      </InfoAlert>

      <section className="space-y-4">
        <SectionHeader
          title="Donnees a completer"
          description="Les points fictifs qui limitent encore la precision de la preparation."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {declarations.missingData.map((action) => (
            <DemoSpotlightCard key={action.id} tone={action.tone as Tone}>
              <ActionCard
                actionLabel="Creer un compte"
                className="h-full"
                description={action.description}
                href="/sign-up"
                icon={<Building2 className="size-5" />}
                title={action.title}
                tone={action.tone as Tone}
              />
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Detail par logement"
          description="Montants fictifs par bien, sans deduction automatique des depenses."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {declarations.propertyBreakdown.map((property) => (
            <DemoSpotlightCard key={property.id} tone="info">
              <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-normal text-foreground">
                      {property.propertyName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property.city}
                    </p>
                  </div>
                  <StatusBadge tone={property.furnished ? "warning" : "info"}>
                    {property.fiscalStatusMessage}
                  </StatusBadge>
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                    <p className="text-muted-foreground">Loyers confirmes</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {formatMoney(property.incomeInCents)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-chart-4/40 bg-chart-4/12 p-3">
                    <p className="text-muted-foreground">Depenses a verifier</p>
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
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Depenses enregistrees a verifier"
          description="Ces depenses fictives restent separees du montant prepare."
        />
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <DemoSpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<ReceiptText className="size-5" />}
              label="Depenses a verifier"
              value={formatMoney(declarations.expensesToReviewInCents)}
              hint="Non deduites automatiquement du montant prepare."
            />
          </DemoSpotlightCard>

          <DemoSpotlightCard tone="warning">
            <article className="h-full rounded-xl border border-chart-4/45 bg-chart-4/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <p className="text-sm leading-6 text-muted-foreground">
                Ces depenses peuvent etre utiles selon votre regime fiscal.
                RentFlow ne les deduit pas automatiquement du montant prepare.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {declarations.expenseCategories.map((category) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm"
                    key={category.id}
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
            </article>
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Conseils personnalises a verifier"
          description="Pistes prudentes, jamais des promesses d'economie fiscale."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {declarations.advice.map((advice) => (
            <DemoSpotlightCard key={advice.id} tone={advice.tone as Tone}>
              <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
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
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Comment declarer ?"
          description="Reperes courts a verifier sur les sources officielles."
        />
        <div className="grid gap-3 lg:grid-cols-2">
          <DeclarationHelpItem
            sourceHref="https://www.impots.gouv.fr/particulier/location-vide-de-meubles"
            sourceLabel="impots.gouv.fr"
            title="Location nue"
          >
            Les loyers d&apos;une location non meublee relevent generalement des
            revenus fonciers. Verifiez le regime applicable sur impots.gouv.fr.
          </DeclarationHelpItem>
          <DeclarationHelpItem
            sourceHref="https://www.service-public.fr/particuliers/vosdroits/F32744"
            sourceLabel="service-public.fr"
            title="Location meublee"
          >
            Les revenus de location meublee relevent generalement des BIC et de
            la declaration complementaire 2042-C-PRO. Verifiez selon votre
            situation.
          </DeclarationHelpItem>
          <DeclarationHelpItem
            sourceHref="https://www.impots.gouv.fr/gerer-mes-biens-immobiliers"
            sourceLabel="impots.gouv.fr"
            title="Declaration d'occupation"
          >
            Les changements d&apos;occupation doivent etre verifies dans le
            service Gerer mes biens immobiliers.
          </DeclarationHelpItem>
          <DeclarationHelpItem
            sourceHref="https://www.service-public.fr/particuliers/vosdroits/F59"
            sourceLabel="service-public.fr"
            title="Taxe fonciere"
          >
            La taxe fonciere peut etre utile a examiner selon votre situation et
            votre regime. Verifiez les regles applicables avant toute
            declaration.
          </DeclarationHelpItem>
          <DeclarationHelpItem
            sourceHref="https://www.impots.gouv.fr/particulier/je-declare-mes-locations"
            sourceLabel="impots.gouv.fr"
            title="SCI / cas complexes"
          >
            SCI, indivision, LMNP reel, meuble touristique et situations
            complexes doivent etre verifies avec les sources officielles ou un
            professionnel.
          </DeclarationHelpItem>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Synthese de preparation"
          description="Ce que la demo illustre sans declaration officielle."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<FileText className="size-5" />}
              label="Annee preparee"
              value={declarations.selectedYear}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/24 shadow-primary/15"
              icon={<CheckCircle2 className="size-5" />}
              label="Logements avec revenus"
              value={declarations.propertiesWithIncome}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<WalletCards className="size-5" />}
              label="Paiements non confirmes"
              value={declarations.paymentsNotConfirmedCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/55 bg-ring/16"
              icon={<Building2 className="size-5" />}
              label="Logements connus"
              value={demoDashboardData.summary.propertyCount}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Raccourcis fictifs vers les actions cles."
          title="Actions rapides"
        />
        <div className="flex flex-wrap gap-3">
          {demoDashboardData.declarationActions.map((action) => (
            <DemoActionPill
              icon={declarationActionIcons[action]}
              key={action}
              label={action}
              tone={declarationActionTones[action] ?? "default"}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
