import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  Plus,
  ReceiptText,
  Send,
  UserPlus,
  WalletCards,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import { demoAppData } from "./demo-data";

type DemoMode = "owner" | "tenant";
type OwnerDemoPage =
  | "dashboard"
  | "properties"
  | "property-detail"
  | "contracts"
  | "payments"
  | "receipts"
  | "finances"
  | "declarations"
  | "tenants";
type TenantDemoPage = "dashboard" | "contract" | "requests" | "account";
type BadgeTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted";
type CardTone = "default" | "success" | "info" | "warning" | "danger";

type DemoPageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
    page?: string | string[];
  }>;
};

const ownerPages = new Set<OwnerDemoPage>([
  "dashboard",
  "properties",
  "property-detail",
  "contracts",
  "payments",
  "receipts",
  "finances",
  "declarations",
  "tenants",
]);

const tenantPages = new Set<TenantDemoPage>([
  "dashboard",
  "contract",
  "requests",
  "account",
]);

const ownerQuickActions = [
  {
    label: "Ajouter un logement",
    href: "/sign-up",
    icon: <Plus className="size-5" />,
    tone: "info",
  },
  {
    label: "Mettre à jour les loyers",
    href: "/demo?mode=owner&page=payments",
    icon: <WalletCards className="size-5" />,
    tone: "warning",
  },
  {
    label: "Générer une quittance",
    href: "/demo?mode=owner&page=receipts",
    icon: <ReceiptText className="size-5" />,
    tone: "success",
  },
  {
    label: "Modifier les contrats",
    href: "/demo?mode=owner&page=contracts",
    icon: <FileText className="size-5" />,
    tone: "default",
  },
  {
    label: "Inviter un locataire",
    href: "/demo?mode=owner&page=tenants",
    icon: <UserPlus className="size-5" />,
    tone: "info",
  },
  {
    label: "Exporter mes finances",
    href: "/demo?mode=owner&page=finances",
    icon: <BarChart3 className="size-5" />,
    tone: "default",
  },
] as const;

const tenantQuickActions = [
  {
    label: "Détails contrat",
    href: "/demo?mode=tenant&page=contract",
    icon: <FileText className="size-5" />,
    tone: "info",
  },
  {
    label: "Mettre fin à un contrat",
    href: "/sign-up",
    icon: <KeyRound className="size-5" />,
    tone: "warning",
  },
  {
    label: "Déclarer un loyer payé",
    href: "/sign-up",
    icon: <WalletCards className="size-5" />,
    tone: "success",
  },
  {
    label: "Demande propriétaire",
    href: "/demo?mode=tenant&page=requests",
    icon: <Send className="size-5" />,
    tone: "default",
  },
] as const;

function getOne(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getDemoMode(mode?: string | string[]): DemoMode {
  return getOne(mode) === "tenant" ? "tenant" : "owner";
}

function getOwnerPage(page?: string | string[]): OwnerDemoPage {
  const resolvedPage = getOne(page);

  return resolvedPage && ownerPages.has(resolvedPage as OwnerDemoPage)
    ? (resolvedPage as OwnerDemoPage)
    : "dashboard";
}

function getTenantPage(page?: string | string[]): TenantDemoPage {
  const resolvedPage = getOne(page);

  return resolvedPage && tenantPages.has(resolvedPage as TenantDemoPage)
    ? (resolvedPage as TenantDemoPage)
    : "dashboard";
}

function getPageTitle(mode: DemoMode, page: OwnerDemoPage | TenantDemoPage) {
  if (mode === "tenant") {
    const tenantTitles: Record<TenantDemoPage, string> = {
      account: "Mon compte",
      contract: "Détail du contrat",
      dashboard: "Tableau de bord locataire",
      requests: "Demandes au propriétaire",
    };

    return tenantTitles[page as TenantDemoPage];
  }

  const ownerTitles: Record<OwnerDemoPage, string> = {
    contracts: "Contrats",
    dashboard: "Tableau de bord propriétaire",
    declarations: "Déclarations",
    finances: "Finances",
    payments: "Paiements",
    properties: "Biens",
    "property-detail": "Détail logement",
    receipts: "Quittances",
    tenants: "Locataires",
  };

  return ownerTitles[page as OwnerDemoPage];
}

function DemoHeader({
  mode,
  page,
}: {
  mode: DemoMode;
  page: OwnerDemoPage | TenantDemoPage;
}) {
  const switchHref =
    mode === "owner"
      ? "/demo?mode=tenant&page=dashboard"
      : "/demo?mode=owner&page=dashboard";
  const switchLabel =
    mode === "owner" ? "Voir la démo locataire" : "Voir la démo propriétaire";

  return (
    <PageHeader
      eyebrow="Démo — données fictives"
      title={getPageTitle(mode, page)}
      description="Cette démo reprend l'apparence des vraies pages RentFlow avec des données fictives et des actions simulées."
      actions={
        <>
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            <ArrowLeft className="size-4" />
            Retour présentation
          </Link>
          <Link
            className={cn(
              buttonVariants(),
              "gap-2 bg-gradient-to-r from-primary to-ring shadow-lg shadow-primary/20",
            )}
            href={switchHref}
          >
            <ArrowLeftRight className="size-4" />
            {switchLabel}
          </Link>
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

function DemoNotice() {
  return (
    <InfoAlert title="Démo — données fictives">
      Les actions sont simulées. Aucun paiement, aucune quittance, aucune
      invitation et aucune donnée réelle ne sont créés depuis cette démo.
    </InfoAlert>
  );
}

function PropertyImage({
  alt,
  imageSrc,
  compact = false,
}: {
  alt: string;
  imageSrc: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        compact ? "h-36" : "h-48",
      )}
    >
      <Image
        alt={alt}
        className="object-cover transition duration-500 group-hover:scale-105"
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        src={imageSrc}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/55 via-background/5 to-transparent" />
    </div>
  );
}

function QuickActionGrid({
  actions,
}: {
  actions: ReadonlyArray<{
    href: string;
    icon: ReactNode;
    label: string;
    tone: CardTone;
  }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {actions.map((action) => (
        <ActionCard
          actionLabel={
            action.href === "/sign-up"
              ? "Action simulée"
              : "Ouvrir dans la démo"
          }
          description={
            action.href === "/sign-up"
              ? "Action simulée — créez un compte pour l'utiliser avec vos données."
              : "Navigation interne dans la démo."
          }
          href={action.href}
          icon={action.icon}
          key={action.label}
          title={action.label}
          tone={action.tone}
        />
      ))}
    </div>
  );
}

function PaymentRow({
  payment,
}: {
  payment: (typeof demoAppData.owner.payments)[number];
}) {
  return (
    <SpotlightCard tone={payment.statusTone as CardTone}>
      <article className="h-full rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusBadge tone={payment.statusTone as BadgeTone}>
              {payment.status}
            </StatusBadge>
            <h3 className="mt-3 font-semibold tracking-normal">
              {payment.label} - {payment.propertyName}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {payment.tenantName} - échéance {payment.dueDate} - {payment.kind}
            </p>
          </div>
          <p className="text-xl font-semibold">
            {formatMoney(payment.amountInCents)}
          </p>
        </div>
      </article>
    </SpotlightCard>
  );
}

function OwnerDashboardDemo() {
  const { owner } = demoAppData;

  return (
    <>
      <DemoNotice />

      <section className="space-y-4">
        <SectionHeader
          title="À faire maintenant"
          description="Les actions prioritaires remontent comme dans le vrai dashboard owner."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <ActionCard
            actionLabel="Ouvrir les paiements"
            description="Hugo Bernard a déclaré un loyer payé. Confirmez seulement après réception réelle."
            href="/demo?mode=owner&page=payments"
            icon={<WalletCards className="size-5" />}
            title="Paiement à confirmer"
            tone="warning"
            value={1}
          />
          <ActionCard
            actionLabel="Ouvrir les quittances"
            description="Une quittance demandée attend une génération fictive."
            href="/demo?mode=owner&page=receipts"
            icon={<ReceiptText className="size-5" />}
            title="Quittance à générer"
            tone="info"
            value={1}
          />
          <ActionCard
            actionLabel="Ouvrir la demande"
            description="Une demande locataire ouverte attend une réponse."
            href="/demo?mode=owner&page=tenants"
            icon={<Send className="size-5" />}
            title="Demande locataire"
            tone="success"
            value={3}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Récapitulatif du mois"
          description={`Vue fictive du mois de ${owner.monthLabel}.`}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<CheckCircle2 className="size-5" />}
            label="Loyers confirmés"
            value={formatMoney(owner.summary.confirmedRentInCents)}
          />
          <StatCard
            icon={<WalletCards className="size-5" />}
            label="À encaisser"
            value={formatMoney(owner.summary.pendingRentInCents)}
          />
          <StatCard
            icon={<FileText className="size-5" />}
            label="Sorties connues"
            value={formatMoney(owner.summary.outgoingInCents)}
          />
          <StatCard
            icon={<BarChart3 className="size-5" />}
            label="Cash-flow estimé"
            value={formatSignedMoney(owner.summary.cashFlowInCents)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/demo?mode=owner&page=properties"
            >
              Voir tous les biens
            </Link>
          }
          title="Mes biens"
          description="Les cards logement reprennent le comportement de l'app : bloc cliquable, image sans spotlight, zoom conservé."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.properties.map((property) => (
            <Link
              className="group block h-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/55 hover:shadow-xl hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/demo?mode=owner&page=property-detail"
              key={property.id}
            >
              <PropertyImage
                alt={`${property.name} - ${property.city}`}
                compact
                imageSrc={property.imageSrc}
              />
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-normal">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city} - {property.type} - {property.surface}
                    </p>
                  </div>
                  <StatusBadge tone={property.statusTone as BadgeTone}>
                    {property.status}
                  </StatusBadge>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Voir détail
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Actions rapides" />
        <QuickActionGrid actions={ownerQuickActions} />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Activité récente" />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.recentActivity.map((activity) => (
            <SpotlightCard key={activity} tone="info">
              <article className="h-full rounded-xl border border-ring/35 bg-ring/10 p-5">
                <CheckCircle2 className="size-5 text-ring" />
                <p className="mt-3 font-medium">{activity}</p>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </section>
    </>
  );
}

function OwnerPropertiesDemo() {
  const { owner } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader
          action={
            <Link className={buttonVariants()} href="/sign-up">
              Ajouter un logement
            </Link>
          }
          title="Liste des biens"
          description="Trois logements fictifs, avec image, statut, loyer et chemin vers le détail."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.properties.map((property) => (
            <Link
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/45 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/demo?mode=owner&page=property-detail"
              key={property.id}
            >
              <PropertyImage alt={property.name} imageSrc={property.imageSrc} />
              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{property.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {property.address} - {property.city}
                    </p>
                  </div>
                  <StatusBadge tone={property.statusTone as BadgeTone}>
                    {property.status}
                  </StatusBadge>
                </div>
                <dl className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Loyer</dt>
                    <dd className="font-medium">
                      {formatMoney(property.rentInCents)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Charges</dt>
                    <dd className="font-medium">
                      {formatMoney(property.chargesInCents)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quittances</dt>
                    <dd className="font-medium">{property.receiptsReady}</dd>
                  </div>
                </dl>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function OwnerPropertyDetailDemo() {
  const property = demoAppData.owner.properties[0];

  return (
    <>
      <DemoNotice />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="group overflow-hidden rounded-xl border bg-card shadow-sm">
          <PropertyImage alt={property.name} imageSrc={property.imageSrc} />
          <div className="space-y-4 p-5">
            <StatusBadge tone={property.statusTone as BadgeTone}>
              {property.status}
            </StatusBadge>
            <h2 className="text-2xl font-semibold tracking-normal">
              {property.name}
            </h2>
            <p className="text-muted-foreground">
              {property.address} - {property.city}
            </p>
          </div>
        </article>
        <section className="space-y-4">
          <SectionHeader title="Synthèse logement" />
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Type" value={property.type} />
            <StatCard label="Surface" value={property.surface} />
            <StatCard label="Fiscalité" value={property.fiscalType} />
            <StatCard
              label="Total mensuel"
              value={formatMoney(
                property.rentInCents + property.chargesInCents,
              )}
            />
          </div>
        </section>
      </section>
      <section className="space-y-4">
        <SectionHeader title="Contrats liés" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionCard
            actionLabel="Voir contrats"
            description="Bail habitation meublé - locataire Léa Martin - lecture fictive."
            href="/demo?mode=owner&page=contracts"
            icon={<FileText className="size-5" />}
            title="Contrat actif"
            tone="success"
          />
          <ActionCard
            actionLabel="Suivre paiements"
            description="Paiements récents et quittances du logement."
            href="/demo?mode=owner&page=payments"
            icon={<WalletCards className="size-5" />}
            title="Paiements récents"
            tone="info"
          />
        </div>
      </section>
    </>
  );
}

function OwnerContractsDemo() {
  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader title="Contrats actifs et brouillons" />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoAppData.owner.properties.map((property) => (
            <SpotlightCard key={property.id} tone="info">
              <article className="h-full rounded-xl border bg-card p-5">
                <StatusBadge tone={property.statusTone as BadgeTone}>
                  {property.status}
                </StatusBadge>
                <h3 className="mt-4 font-semibold">{property.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {property.contracts} contrat(s) - {property.type}
                </p>
                <Link
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-5",
                  )}
                  href="/sign-up"
                >
                  Action simulée
                </Link>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </section>
    </>
  );
}

function OwnerPaymentsDemo() {
  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader
          title="Paiements"
          description="Un paiement déclaré payé n'est pas compte comme reçu tant que le propriétaire ne confirme pas."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {demoAppData.owner.payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      </section>
    </>
  );
}

function OwnerReceiptsDemo() {
  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader title="Quittances" />
        <div className="grid gap-4 lg:grid-cols-3">
          {demoAppData.owner.receipts.map((receipt) => (
            <ActionCard
              actionLabel={
                receipt.status === "Demandée" ? "Générer (démo)" : "Voir"
              }
              description={`${receipt.tenantName} - ${receipt.propertyName} - ${receipt.month}`}
              href={
                receipt.status === "Demandée"
                  ? "/sign-up"
                  : "/demo?mode=owner&page=receipts"
              }
              icon={<ReceiptText className="size-5" />}
              key={receipt.id}
              title={receipt.status}
              tone={receipt.statusTone as CardTone}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function OwnerFinancesDemo() {
  const { owner } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader title="Résumé financier" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Loyers confirmés"
            value={formatMoney(owner.summary.confirmedRentInCents)}
          />
          <StatCard
            label="Sorties connues"
            value={formatMoney(owner.summary.outgoingInCents)}
          />
          <StatCard
            label="Cash-flow estimé"
            value={formatSignedMoney(owner.summary.cashFlowInCents)}
          />
          <StatCard
            label="Biens inclus"
            value={owner.summary.propertiesCount}
          />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">
            Sorties par catégorie
          </summary>
          <div className="mt-4 divide-y">
            {owner.expenses.map((expense) => (
              <div
                className="flex items-center justify-between py-3 text-sm"
                key={expense.id}
              >
                <span>{expense.category}</span>
                <span className="font-medium">
                  {formatMoney(expense.amountInCents)}
                </span>
              </div>
            ))}
          </div>
        </details>
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">
            Dépenses détaillées
          </summary>
          <div className="mt-4 divide-y">
            {owner.expenses.map((expense) => (
              <div
                className="flex items-center justify-between py-3 text-sm"
                key={expense.id}
              >
                <span>{expense.label}</span>
                <span className="font-medium">
                  {formatMoney(expense.amountInCents)}
                </span>
              </div>
            ))}
          </div>
        </details>
      </section>
    </>
  );
}

function OwnerDeclarationsDemo() {
  const { declarations } = demoAppData.owner;

  return (
    <>
      <DemoNotice />
      <InfoAlert title="Préparation fiscale fictive" tone="warning">
        RentFlow aide à préparer des données à vérifier, mais ne génère pas de
        déclaration officielle.
      </InfoAlert>
      <section className="space-y-4">
        <SectionHeader title="Données à compléter" />
        <div className="grid gap-4 lg:grid-cols-2">
          {declarations.missingItems.map((item) => (
            <ActionCard
              actionLabel="Voir le logement"
              description="Lien direct fictif vers l'endroit où corriger la donnée dans l'app réelle."
              href="/demo?mode=owner&page=property-detail"
              icon={<Building2 className="size-5" />}
              key={item}
              title={item}
              tone="warning"
            />
          ))}
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <StatCard
          label={`Montant préparé ${declarations.year}`}
          value={formatMoney(declarations.preparedIncomeInCents)}
        />
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">
            Conseils personnalisés
          </summary>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {declarations.advice.map((advice) => (
              <li key={advice}>{advice}</li>
            ))}
          </ul>
        </details>
      </section>
    </>
  );
}

function OwnerTenantsDemo() {
  const { owner } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader title="Locataires actifs et demandes" />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.tenants.map((tenant) => (
            <SpotlightCard key={tenant.id} tone={tenant.statusTone as CardTone}>
              <article className="h-full rounded-xl border bg-card p-5">
                <StatusBadge tone={tenant.statusTone as BadgeTone}>
                  {tenant.status}
                </StatusBadge>
                <h3 className="mt-4 font-semibold">{tenant.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tenant.email}
                </p>
                <p className="mt-3 text-sm">
                  {tenant.propertyName} - {formatMoney(tenant.rentInCents)}
                </p>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <SectionHeader title="Demandes locataires" />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.tenantRequests.map((request) => (
            <ActionCard
              actionLabel="Fait / Refusé (démo)"
              description={`${request.tenantName} - ${request.propertyName} - ${request.category}`}
              href="/sign-up"
              icon={<Wrench className="size-5" />}
              key={request.id}
              title={request.title}
              tone={request.statusTone as CardTone}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function TenantDashboardDemo() {
  const { tenant } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="space-y-4">
        <SectionHeader title="À faire maintenant" />
        <div className="grid gap-4 lg:grid-cols-3">
          {tenant.actions.map((action) => (
            <ActionCard
              actionLabel="Action simulée"
              description={action.description}
              href="/sign-up"
              icon={<WalletCards className="size-5" />}
              key={action.id}
              title={action.title}
              tone={action.tone as CardTone}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeader title="Mon logement" />
          <Link
            className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-primary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/demo?mode=tenant&page=contract"
          >
            <PropertyImage
              alt={tenant.property.name}
              compact
              imageSrc={tenant.property.imageSrc}
            />
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {tenant.property.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tenant.property.city} - propriétaire {tenant.ownerName}
                  </p>
                </div>
                <StatusBadge tone={tenant.property.statusTone as BadgeTone}>
                  {tenant.property.status}
                </StatusBadge>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Loyer</p>
                  <p className="font-medium">
                    {formatMoney(tenant.contract.rentInCents)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Charges</p>
                  <p className="font-medium">
                    {formatMoney(tenant.contract.chargesInCents)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {formatMoney(
                      tenant.contract.rentInCents +
                        tenant.contract.chargesInCents,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
        <section className="space-y-4">
          <SectionHeader title="Actions rapides" />
          <QuickActionGrid actions={tenantQuickActions} />
        </section>
      </section>
      <TenantPaymentsAndReceipts />
    </>
  );
}

function TenantPaymentsAndReceipts() {
  const { tenant } = demoAppData;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <SectionHeader title="Paiements récents" />
        <div className="space-y-3">
          {tenant.payments.map((payment) => (
            <SpotlightCard key={payment.id} tone={payment.tone as CardTone}>
              <article className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{payment.label}</h3>
                    <StatusBadge
                      className="mt-2"
                      tone={payment.tone as BadgeTone}
                    >
                      {payment.status}
                    </StatusBadge>
                  </div>
                  <p className="font-semibold">
                    {formatMoney(payment.amountInCents)}
                  </p>
                </div>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <SectionHeader title="Quittances" />
        <div className="space-y-3">
          {tenant.receipts.map((receipt) => (
            <SpotlightCard key={receipt.id} tone={receipt.tone as CardTone}>
              <article className="rounded-xl border bg-card p-4">
                <h3 className="font-medium">Quittance {receipt.month}</h3>
                <StatusBadge className="mt-2" tone={receipt.tone as BadgeTone}>
                  {receipt.status}
                </StatusBadge>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function TenantContractDemo() {
  const { tenant } = demoAppData;
  const total = tenant.contract.rentInCents + tenant.contract.chargesInCents;

  return (
    <>
      <DemoNotice />
      <InfoAlert title="Lecture seule">
        Cette page simule le détail contrat locataire. Aucun bouton de
        modification n&apos;est disponible.
      </InfoAlert>
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="group overflow-hidden rounded-xl border bg-card">
          <PropertyImage
            alt={tenant.property.name}
            imageSrc={tenant.property.imageSrc}
          />
          <div className="space-y-3 p-5">
            <h2 className="text-2xl font-semibold">Détail du contrat</h2>
            <p className="text-muted-foreground">
              {tenant.property.name} - {tenant.property.city}
            </p>
          </div>
        </article>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Loyer"
            value={formatMoney(tenant.contract.rentInCents)}
          />
          <StatCard
            label="Charges"
            value={formatMoney(tenant.contract.chargesInCents)}
          />
          <StatCard label="Total mensuel" value={formatMoney(total)} />
          <StatCard
            label="Dépôt de garantie"
            value={formatMoney(tenant.contract.depositInCents)}
          />
          <StatCard label="Debut" value={tenant.contract.startDate} />
          <StatCard label="Paiement le" value={tenant.contract.paymentDay} />
        </div>
      </section>
      <TenantPaymentsAndReceipts />
    </>
  );
}

function TenantRequestsDemo() {
  const { tenant } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border bg-card p-5">
          <h2 className="text-xl font-semibold">Nouvelle demande</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Formulaire fictif : l&apos;envoi réel est disponible après création
            du compte.
          </p>
          <div className="mt-5 grid gap-3">
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              Sujet : Problème ou question
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              Type de demande : Document, paiement, travaux...
            </div>
            <div className="min-h-24 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Message de démonstration.
            </div>
            <Link className={buttonVariants()} href="/sign-up">
              Envoyer la demande (démo)
            </Link>
          </div>
        </article>
        <section className="space-y-4">
          <SectionHeader title="Demandes au propriétaire" />
          {tenant.requests.map((request) => (
            <SpotlightCard key={request.id} tone={request.tone as CardTone}>
              <article className="rounded-xl border bg-card p-5">
                <StatusBadge tone={request.tone as BadgeTone}>
                  {request.status}
                </StatusBadge>
                <h3 className="mt-3 font-semibold">{request.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.category}
                </p>
              </article>
            </SpotlightCard>
          ))}
        </section>
      </section>
    </>
  );
}

function TenantAccountDemo() {
  const { tenant } = demoAppData;

  return (
    <>
      <DemoNotice />
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl border bg-primary/16 text-xl font-semibold text-primary">
              LM
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">Mon compte</h2>
              <p className="truncate text-sm text-muted-foreground">
                lea.martin@example.test
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold">Informations personnelles</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Facultatives dans l&apos;app réelle, non modifiables dans la démo.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="Prénom" value="Léa" />
            <StatCard label="Nom" value="Martin" />
            <StatCard label="Espace" value="Locataire" />
            <StatCard label="Propriétaire" value={tenant.ownerName} />
          </div>
        </article>
      </section>
    </>
  );
}

function renderOwnerPage(page: OwnerDemoPage) {
  switch (page) {
    case "properties":
      return <OwnerPropertiesDemo />;
    case "property-detail":
      return <OwnerPropertyDetailDemo />;
    case "contracts":
      return <OwnerContractsDemo />;
    case "payments":
      return <OwnerPaymentsDemo />;
    case "receipts":
      return <OwnerReceiptsDemo />;
    case "finances":
      return <OwnerFinancesDemo />;
    case "declarations":
      return <OwnerDeclarationsDemo />;
    case "tenants":
      return <OwnerTenantsDemo />;
    case "dashboard":
    default:
      return <OwnerDashboardDemo />;
  }
}

function renderTenantPage(page: TenantDemoPage) {
  switch (page) {
    case "contract":
      return <TenantContractDemo />;
    case "requests":
      return <TenantRequestsDemo />;
    case "account":
      return <TenantAccountDemo />;
    case "dashboard":
    default:
      return <TenantDashboardDemo />;
  }
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = getDemoMode(resolvedSearchParams?.mode);
  const page =
    mode === "owner"
      ? getOwnerPage(resolvedSearchParams?.page)
      : getTenantPage(resolvedSearchParams?.page);

  return (
    <section className="space-y-10">
      <DemoHeader mode={mode} page={page} />
      {mode === "owner"
        ? renderOwnerPage(page as OwnerDemoPage)
        : renderTenantPage(page as TenantDemoPage)}
    </section>
  );
}
