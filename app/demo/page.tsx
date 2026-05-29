import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Home,
  KeyRound,
  Plus,
  ReceiptText,
  Repeat2,
  Send,
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
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import { DemoActionPill, type DemoActionPillTone } from "./demo-action-pill";
import { demoDashboardData } from "./demo-data";
import { DemoSpotlightCard } from "./demo-spotlight-card";

type DemoPageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
  }>;
};

type DemoMode = "owner" | "tenant";
type Tone = "default" | "success" | "info" | "warning" | "danger";
type BadgeTone = Tone | "muted";

const priorityIcons: Record<string, ReactNode> = {
  declared_paid: <WalletCards className="size-5" />,
  receipt: <ReceiptText className="size-5" />,
  late_payment: <FileText className="size-5" />,
  recurring_expenses: <Repeat2 className="size-5" />,
};

const quickActionIcons: Record<string, ReactNode> = {
  "Ajouter un logement": <Plus className="size-5" />,
  "Ajouter une depense": <FileText className="size-5" />,
  "Voir les finances": <BarChart3 className="size-5" />,
  "Generer une quittance": <ReceiptText className="size-5" />,
};

const quickActionTones: Record<string, DemoActionPillTone> = {
  "Ajouter un logement": "info",
  "Ajouter une depense": "success",
  "Voir les finances": "default",
  "Generer une quittance": "warning",
};

const demoToneSurfaceClasses: Record<Tone, string> = {
  default: "border-primary/35 bg-primary/8",
  success: "border-primary/45 bg-primary/12",
  info: "border-ring/45 bg-ring/12",
  warning: "border-chart-4/50 bg-chart-4/12",
  danger: "border-destructive/50 bg-destructive/12",
};

const propertyVisualClasses: Record<string, string> = {
  river: "from-primary/35 via-ring/15 to-background",
  studio: "from-chart-4/30 via-primary/10 to-background",
  house: "from-ring/30 via-secondary/35 to-background",
};

const tenantDemoActions = [
  {
    id: "declare-rent",
    title: "Déclarer mon loyer comme payé",
    description:
      "Cette action apparaît avant l'échéance. Le propriétaire devra confirmer la réception.",
    value: "980 €",
    tone: "warning",
    icon: <WalletCards className="size-5" />,
    actionLabel: "Créer un compte",
  },
  {
    id: "receipt-ready",
    title: "Quittance disponible",
    description:
      "La quittance de mai est prête et restera disponible dans l'historique.",
    value: "1",
    tone: "info",
    icon: <ReceiptText className="size-5" />,
    actionLabel: "Voir la démo",
  },
  {
    id: "request-answer",
    title: "Réponse propriétaire",
    description:
      "Votre demande de document a été traitée. Confirmez quand c'est clair.",
    value: "Fait",
    tone: "success",
    icon: <Send className="size-5" />,
    actionLabel: "Créer un compte",
  },
] as const;

const tenantRecentPayments = [
  {
    label: "Loyer juin",
    amount: "980 €",
    status: "À déclarer bientôt",
    tone: "warning",
  },
  {
    label: "Loyer mai",
    amount: "980 €",
    status: "Confirmé par le propriétaire",
    tone: "success",
  },
  {
    label: "Charges avril",
    amount: "120 €",
    status: "Déclaré payé",
    tone: "info",
  },
] as const;

function getDemoMode(mode?: string | string[]): DemoMode {
  const resolvedMode = Array.isArray(mode) ? mode[0] : mode;

  return resolvedMode === "tenant" ? "tenant" : "owner";
}

function ModeSwitch({ mode }: { mode: DemoMode }) {
  const targetMode = mode === "owner" ? "tenant" : "owner";
  const label =
    mode === "owner" ? "Voir l'espace locataire" : "Voir l'espace propriétaire";

  return (
    <Link
      className={buttonVariants({ variant: "outline" })}
      href={targetMode === "tenant" ? "/demo?mode=tenant" : "/demo"}
    >
      {mode === "owner" ? (
        <KeyRound className="size-4" />
      ) : (
        <Building2 className="size-4" />
      )}
      {label}
    </Link>
  );
}

function DemoHeader({ mode }: { mode: DemoMode }) {
  return (
    <PageHeader
      eyebrow="Démo publique - données fictives"
      title={
        mode === "owner"
          ? "Tableau de bord propriétaire démo"
          : "Espace locataire démo"
      }
      description={
        mode === "owner"
          ? "Voici comment RentFlow guide un propriétaire avec des données fictives."
          : "Voici comment RentFlow guide un locataire avec un logement, un contrat et des actions fictives."
      }
      actions={
        <>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            <ArrowLeft className="size-4" />
            Retour présentation
          </Link>
          <ModeSwitch mode={mode} />
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/sign-in"
          >
            Se connecter
          </Link>
          <Link className={buttonVariants()} href="/sign-up">
            Créer un compte
          </Link>
        </>
      }
    />
  );
}

function PropertyVisual({
  alt,
  imageSrc,
  variant,
}: {
  alt: string;
  imageSrc?: string;
  variant: string;
}) {
  if (imageSrc) {
    return (
      <div className="relative h-32 overflow-hidden bg-muted">
        <Image
          alt={alt}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={imageSrc}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-background/10 to-transparent" />
        <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/45 text-primary backdrop-blur-sm">
          <Building2 className="size-5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-32 overflow-hidden bg-gradient-to-br",
        propertyVisualClasses[variant] ?? propertyVisualClasses.river,
      )}
    >
      <div className="absolute inset-x-6 bottom-0 h-16 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
      <div className="absolute right-6 top-6 size-16 rounded-full border border-white/10 bg-white/10" />
      <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/35 text-primary">
        <Building2 className="size-5" />
      </div>
    </div>
  );
}

function OwnerDemoContent() {
  const { summary } = demoDashboardData;

  return (
    <>
      <DemoSpotlightCard tone="info">
        <InfoAlert title="Démo publique">
          Données fictives, lecture seule, aucune action réelle. Les boutons de
          la démo redirigent vers la création de compte.
        </InfoAlert>
      </DemoSpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="À faire maintenant"
          description="Les priorités qu'un propriétaire verrait remonter dans RentFlow."
        />
        <div className="grid gap-4 xl:grid-cols-4">
          {demoDashboardData.priorityActions.map((action) => (
            <DemoSpotlightCard
              href="/sign-up"
              key={action.id}
              tone={action.tone as Tone}
            >
              <ActionCard
                className="h-full"
                description={action.description}
                icon={priorityIcons[action.id]}
                title={action.title}
                tone={action.tone as Tone}
                value={action.value}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {action.actionLabel}
                  <ArrowRight className="size-4" />
                </span>
              </ActionCard>
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/demo/finances"
            >
              Voir les finances
            </Link>
          }
          description={`Vue fictive du mois de ${demoDashboardData.monthLabel}.`}
          title="Récapitulatif du mois"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              label="À encaisser"
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
          <DemoSpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/80 bg-primary/30 shadow-primary/20"
              icon={<BarChart3 className="size-5" />}
              label="Cash-flow estimé"
              value={formatSignedMoney(summary.cashFlowInCents)}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/demo/properties"
            >
              Voir tous les biens
            </Link>
          }
          description="Trois logements fictifs avec les signaux essentiels."
          title="Mes biens"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoDashboardData.properties.map((property) => (
            <Link
              className="group block h-full overflow-hidden rounded-xl border border-primary/35 bg-primary/8 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/65 hover:bg-primary/10 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/sign-up"
              key={property.id}
            >
              <PropertyVisual
                alt={`${property.name} - ${property.city}`}
                imageSrc={property.imageSrc}
                variant={property.visualVariant}
              />
              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-normal">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city} - {property.type} -{" "}
                      {property.surfaceLabel}
                    </p>
                  </div>
                  <StatusBadge tone={property.statusTone as BadgeTone}>
                    {property.status}
                  </StatusBadge>
                </div>

                <dl className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Contrats</dt>
                    <dd className="mt-1 font-medium">
                      {property.contractsCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">À suivre</dt>
                    <dd className="mt-1 font-medium">
                      {property.watchPaymentsCount}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quittances</dt>
                    <dd className="mt-1 font-medium">
                      {property.availableReceiptsCount}
                    </dd>
                  </div>
                </dl>

                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                  Tester avec mon compte
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Trois événements fictifs pour illustrer le fil de suivi."
          title="Activité récente"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoDashboardData.recentActivity.map((activity) => (
            <DemoSpotlightCard key={activity.id} tone={activity.tone as Tone}>
              <article
                className={cn(
                  "h-full rounded-xl border p-5 text-card-foreground shadow-sm shadow-black/10",
                  demoToneSurfaceClasses[activity.tone as Tone],
                )}
              >
                <StatusBadge tone={activity.tone as BadgeTone}>
                  {activity.when}
                </StatusBadge>
                <h3 className="mt-4 font-semibold tracking-normal">
                  {activity.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activity.description}
                </p>
              </article>
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Raccourcis fictifs vers les actions clés."
          title="Actions rapides"
        />
        <div className="flex flex-wrap gap-3">
          {demoDashboardData.quickActions.map((action) => (
            <DemoActionPill
              icon={quickActionIcons[action]}
              key={action}
              label={action}
              tone={quickActionTones[action] ?? "default"}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function TenantPropertyPreview() {
  return (
    <Link
      className="group block overflow-hidden rounded-xl border border-ring/35 bg-ring/8 shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-ring/65 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      href="/sign-up"
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-ring/25 via-primary/10 to-background">
        <div className="absolute inset-x-8 bottom-0 h-20 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/25 transition duration-500 group-hover:scale-105" />
        <div className="absolute left-6 top-6 flex size-12 items-center justify-center rounded-xl border border-white/15 bg-background/40 text-ring">
          <Home className="size-5" />
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-normal">
              Studio Canal Saint-Martin
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Paris - Contrat actif - paiement le 5
            </p>
          </div>
          <StatusBadge tone="success">Actif</StatusBadge>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Loyer</p>
            <p className="mt-1 font-medium">860 €</p>
          </div>
          <div>
            <p className="text-muted-foreground">Charges</p>
            <p className="mt-1 font-medium">120 €</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="mt-1 font-medium">980 €</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ring">
          Voir le contrat dans mon espace
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

function TenantDemoContent() {
  return (
    <>
      <DemoSpotlightCard tone="info">
        <InfoAlert title="Démo publique">
          Données locataires fictives, lecture seule. Les boutons sensibles de
          la démo vous invitent à créer un compte pour tester RentFlow.
        </InfoAlert>
      </DemoSpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="À faire maintenant"
          description="Les actions importantes que RentFlow ferait remonter côté locataire."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {tenantDemoActions.map((action) => (
            <DemoSpotlightCard
              href="/sign-up"
              key={action.id}
              tone={action.tone as Tone}
            >
              <ActionCard
                className="h-full"
                description={action.description}
                icon={action.icon}
                title={action.title}
                tone={action.tone as Tone}
                value={action.value}
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {action.actionLabel}
                  <ArrowRight className="size-4" />
                </span>
              </ActionCard>
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeader
            title="Mon logement"
            description="Un aperçu compact du logement et du contrat actif."
          />
          <TenantPropertyPreview />
        </div>

        <div className="space-y-4">
          <SectionHeader
            title="Paiements récents"
            description="Des statuts clairs sans confondre déclaration et réception."
          />
          <div className="space-y-3">
            {tenantRecentPayments.map((payment) => (
              <DemoSpotlightCard
                key={payment.label}
                tone={payment.tone as Tone}
              >
                <article
                  className={cn(
                    "rounded-xl border p-4 shadow-sm shadow-black/10",
                    demoToneSurfaceClasses[payment.tone as Tone],
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium tracking-normal">
                        {payment.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {payment.status}
                      </p>
                    </div>
                    <p className="font-semibold">{payment.amount}</p>
                  </div>
                </article>
              </DemoSpotlightCard>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DemoSpotlightCard tone="info">
          <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5">
            <ReceiptText className="size-5 text-ring" />
            <h3 className="mt-4 font-semibold tracking-normal">Quittances</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              PDFs disponibles, demandes en cours et historique consultable.
            </p>
          </article>
        </DemoSpotlightCard>
        <DemoSpotlightCard href="/sign-up" tone="success">
          <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5">
            <Send className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold tracking-normal">
              Demandes au propriétaire
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Créez une demande simple, puis suivez sa réponse dans RentFlow.
            </p>
          </article>
        </DemoSpotlightCard>
        <DemoSpotlightCard tone="default">
          <article className="h-full rounded-xl border border-white/10 bg-card/70 p-5">
            <FileText className="size-5 text-primary" />
            <h3 className="mt-4 font-semibold tracking-normal">
              Ancien contrat
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Les contrats terminés restent visibles, séparés du logement actif.
            </p>
          </article>
        </DemoSpotlightCard>
      </section>
    </>
  );
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = getDemoMode(resolvedSearchParams?.mode);

  return (
    <section className="space-y-10">
      <DemoHeader mode={mode} />
      {mode === "owner" ? <OwnerDemoContent /> : <TenantDemoContent />}
    </section>
  );
}
