import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  FileText,
  Plus,
  ReceiptText,
  UserPlus,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import { OwnerDashboardView } from "@/components/owner/owner-dashboard-view";
import {
  TenantDashboardView,
  type TenantDashboardContractTenant,
  type TenantDashboardDeclarablePayment,
  type TenantDashboardPayment,
  type TenantDashboardReceipt,
  type TenantDashboardRequestedReceipt,
  type TenantDashboardStats,
  type TenantDashboardTenantRequest,
} from "@/components/tenant/tenant-dashboard-view";
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
import {
  DemoInlinePanel,
  DemoSimulatedAction,
  DemoTenantRequestComposer,
} from "./demo-interactions";

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
    label: "Mettre Ã  jour les loyers",
    href: "/demo?mode=owner&page=payments",
    icon: <WalletCards className="size-5" />,
    tone: "warning",
  },
  {
    label: "GÃ©nÃ©rer une quittance",
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
      contract: "DÃ©tail du contrat",
      dashboard: "Tableau de bord locataire",
      requests: "Demandes au propriÃ©taire",
    };

    return tenantTitles[page as TenantDemoPage];
  }

  const ownerTitles: Record<OwnerDemoPage, string> = {
    contracts: "Contrats",
    dashboard: "Tableau de bord propriÃ©taire",
    declarations: "DÃ©clarations",
    finances: "Finances",
    payments: "Paiements",
    properties: "Biens",
    "property-detail": "DÃ©tail logement",
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
  return (
    <PageHeader
      eyebrow="DÃ©mo"
      title={getPageTitle(mode, page)}
      description="DonnÃ©es fictives, actions simulÃ©es et parcours proche de l'app rÃ©elle."
      actions={
        <>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/sign-in"
          >
            Se connecter
          </Link>
          <Link className={buttonVariants()} href="/sign-up">
            CrÃ©er un compte
          </Link>
        </>
      }
    />
  );
}

function DemoNotice() {
  return (
    <InfoAlert title="DÃ©mo â€” donnÃ©es fictives">
      Les actions sont simulÃ©es. Aucun paiement, aucune quittance, aucune
      invitation et aucune donnÃ©e rÃ©elle ne sont crÃ©Ã©s depuis cette dÃ©mo.
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
              ? "Action simulÃ©e"
              : "Ouvrir dans la dÃ©mo"
          }
          description={
            action.href === "/sign-up"
              ? "Action simulÃ©e â€” crÃ©ez un compte pour l'utiliser avec vos donnÃ©es."
              : "Navigation interne dans la dÃ©mo."
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
              {payment.tenantName} - Ã©chÃ©ance {payment.dueDate} -{" "}
              {payment.kind}
            </p>
          </div>
          <p className="text-xl font-semibold">
            {formatMoney(payment.amountInCents)}
          </p>
        </div>
        {payment.status === "Déclaré payé" ? (
          <div className="mt-5">
            <DemoSimulatedAction
              confirmLabel="Confirmer fictivement la rÃ©ception du loyer ?"
              doneLabel="RÃ©ception confirmÃ©e dans la dÃ©mo"
              label="Confirmer la rÃ©ception"
              tone="warning"
            />
          </div>
        ) : null}
        {payment.status === "Prévu" ? (
          <div className="mt-5">
            <DemoInlinePanel
              title="DÃ©tail fictif du paiement prÃ©vu"
              triggerLabel="Voir dÃ©tail"
            >
              Le paiement reste prÃ©vu dans la dÃ©mo. Le vrai suivi se fait dans
              l&apos;espace propriÃ©taire connectÃ©.
            </DemoInlinePanel>
          </div>
        ) : null}
      </article>
    </SpotlightCard>
  );
}

function OwnerDashboardDemo() {
  const { owner } = demoAppData;

  return (
    <OwnerDashboardView
      addPropertyHref="/sign-up"
      allPropertiesHref="/demo?mode=owner&page=properties"
      financeHref="/demo?mode=owner&page=finances"
      nextActions={[
        {
          id: "demo-payment-declared",
          title: "Paiement Ã  confirmer",
          description:
            "Hugo Bernard a dÃ©clarÃ© un loyer payÃ©. Confirmez seulement aprÃ¨s rÃ©ception rÃ©elle.",
          href: "/demo?mode=owner&page=payments",
          status: "PARTIAL",
          tone: "warning",
          action: (
            <DemoSimulatedAction
              confirmLabel="Simuler la confirmation du loyer dÃ©clarÃ© payÃ© ?"
              doneLabel="Paiement confirmÃ©"
              label="Confirmer un loyer dÃ©clarÃ© payÃ©"
              tone="warning"
            />
          ),
        },
        {
          id: "demo-receipt-requested",
          title: "Quittance Ã  gÃ©nÃ©rer",
          description:
            "Une quittance demandÃ©e attend une gÃ©nÃ©ration fictive.",
          href: "/demo?mode=owner&page=receipts",
          status: "TODO",
          tone: "info",
          action: (
            <DemoSimulatedAction
              confirmLabel="Simuler la gÃ©nÃ©ration de la quittance demandÃ©e ?"
              doneLabel="Quittance gÃ©nÃ©rÃ©e"
              label="GÃ©nÃ©rer une quittance demandÃ©e"
              tone="success"
            />
          ),
        },
        {
          id: "demo-tenant-request",
          title: "Demande locataire",
          description: "Une demande locataire ouverte attend une rÃ©ponse.",
          href: "/demo?mode=owner&page=tenants",
          status: "TODO",
          tone: "success",
          action: (
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/demo?mode=owner&page=tenants"
            >
              RÃ©pondre Ã  une demande locataire
            </Link>
          ),
        },
      ]}
      notice={<DemoNotice />}
      properties={owner.properties.map((property) => ({
        id: property.id,
        href: "/demo?mode=owner&page=property-detail",
        name: property.name,
        city: property.city,
        imageUrl: property.imageSrc,
        propertyType: property.type,
        status: property.status,
        statusTone: property.statusTone as BadgeTone,
        isColocation: false,
        rentalContractsCount: property.contracts,
        paymentsCount: property.paymentsToReview,
      }))}
      quickActions={<QuickActionGrid actions={ownerQuickActions} />}
      recentActivity={owner.recentActivity.map((activity) => ({
        id: activity,
        title: activity,
        description: "ActivitÃ© fictive dans la dÃ©mo RentFlow.",
      }))}
      stats={{
        currentMonthSucceededPayments: 1,
        remainingRentAmountInCents: owner.summary.pendingRentInCents,
        collectedAmountInCents: owner.summary.confirmedRentInCents,
        outgoingAmountInCents: owner.summary.outgoingInCents,
        cashFlowAmountInCents: owner.summary.cashFlowInCents,
      }}
    />
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
          description="Trois logements fictifs, avec image, statut, loyer et chemin vers le dÃ©tail."
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
          <SectionHeader title="SynthÃ¨se logement" />
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Type" value={property.type} />
            <StatCard label="Surface" value={property.surface} />
            <StatCard label="FiscalitÃ©" value={property.fiscalType} />
            <StatCard
              label="Total mensuel"
              value={formatMoney(
                property.rentInCents + property.chargesInCents,
              )}
            />
          </div>
        </section>
      </section>
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Photo du logement</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload fictif : la vraie app conserve une photo optionnelle par
                bien.
              </p>
            </div>
            <StatusBadge tone="info">Simulation</StatusBadge>
          </div>
          <div className="mt-4">
            <DemoSimulatedAction
              doneLabel="Photo remplacÃ©e dans la dÃ©mo"
              label="Ajouter/remplacer photo"
              tone="success"
            />
          </div>
        </article>
        <div className="grid gap-4">
          <article className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-semibold">Adresse</h2>
              <DemoInlinePanel
                title="Edition fictive de l'adresse"
                triggerLabel="Modifier les informations"
              >
                Le formulaire rÃ©el permet de corriger l&apos;adresse du
                logement. Dans la dÃ©mo, ce panneau confirme seulement le
                parcours.
              </DemoInlinePanel>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Adresse</dt>
                <dd className="font-medium">{property.address}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ville</dt>
                <dd className="font-medium">{property.city}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pays</dt>
                <dd className="font-medium">France</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Code postal</dt>
                <dd className="font-medium">75010</dd>
              </div>
            </dl>
          </article>
          <article className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-semibold">CaractÃ©ristiques</h2>
              <DemoInlinePanel
                title="Edition fictive des caractÃ©ristiques"
                triggerLabel="Modifier les caractÃ©ristiques"
              >
                Surface, type, fiscalitÃ© et statut peuvent Ãªtre vÃ©rifiÃ©s
                dans le vrai formulaire. Cette action reste locale Ã  la dÃ©mo.
              </DemoInlinePanel>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Statut</dt>
                <dd className="font-medium">{property.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="font-medium">{property.type}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Surface</dt>
                <dd className="font-medium">{property.surface}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">MeublÃ©</dt>
                <dd className="font-medium">Oui</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Colocation</dt>
                <dd className="font-medium">Non</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">FiscalitÃ©</dt>
                <dd className="font-medium">{property.fiscalType}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>
      <section className="space-y-4">
        <SectionHeader title="Contrats liÃ©s" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ActionCard
            actionLabel="Voir contrats"
            description="Bail habitation meublÃ© - locataire LÃ©a Martin - lecture fictive."
            href="/demo?mode=owner&page=contracts"
            icon={<FileText className="size-5" />}
            title="Contrat actif"
            tone="success"
          />
          <ActionCard
            actionLabel="Suivre paiements"
            description="Paiements rÃ©cents et quittances du logement."
            href="/demo?mode=owner&page=payments"
            icon={<WalletCards className="size-5" />}
            title="Paiements rÃ©cents"
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
                <div className="mt-5 grid gap-3">
                  <DemoInlinePanel
                    title="Modification fictive du contrat"
                    triggerLabel="Modifier le contrat"
                  >
                    Le vrai formulaire de contrat sera disponible aprÃ¨s
                    crÃ©ation du compte. Ici, aucune donnÃ©e n&apos;est
                    enregistrÃ©e.
                  </DemoInlinePanel>
                  <DemoSimulatedAction
                    doneLabel="Invitation fictive envoyÃ©e"
                    label="Inviter un locataire"
                  />
                  <DemoSimulatedAction
                    confirmLabel="Simuler la fin de ce contrat ?"
                    doneLabel="Contrat dÃ©placÃ© dans les terminÃ©s"
                    label="Mettre fin au contrat"
                    tone="warning"
                  />
                </div>
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
          description="Un paiement dÃ©clarÃ© payÃ© n'est pas compte comme reÃ§u tant que le propriÃ©taire ne confirme pas."
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
            <SpotlightCard
              key={receipt.id}
              tone={receipt.statusTone as CardTone}
            >
              <article className="h-full rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <StatusBadge tone={receipt.statusTone as BadgeTone}>
                      {receipt.status}
                    </StatusBadge>
                    <h3 className="mt-3 font-semibold">{receipt.tenantName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {receipt.propertyName} - {receipt.month}
                    </p>
                  </div>
                  <ReceiptText className="size-5 text-primary" />
                </div>
                <div className="mt-5">
                  {receipt.status === "Demandée" ? (
                    <DemoSimulatedAction
                      confirmLabel="Simuler la gÃ©nÃ©ration de cette quittance ?"
                      doneLabel="Quittance gÃ©nÃ©rÃ©e"
                      label="GÃ©nÃ©rer la quittance"
                      tone="success"
                    />
                  ) : (
                    <DemoInlinePanel
                      title="AperÃ§u PDF fictif"
                      triggerLabel="Ouvrir PDF"
                    >
                      La dÃ©mo n&apos;ouvre pas de PDF rÃ©el. CrÃ©ez un compte
                      pour gÃ©nÃ©rer des quittances avec vos donnÃ©es.
                    </DemoInlinePanel>
                  )}
                </div>
              </article>
            </SpotlightCard>
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
        <SectionHeader title="RÃ©sumÃ© financier" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Loyers confirmÃ©s"
            value={formatMoney(owner.summary.confirmedRentInCents)}
          />
          <StatCard
            label="Sorties connues"
            value={formatMoney(owner.summary.outgoingInCents)}
          />
          <StatCard
            label="Cash-flow estimÃ©"
            value={formatSignedMoney(owner.summary.cashFlowInCents)}
          />
          <StatCard
            label="Biens inclus"
            value={owner.summary.propertiesCount}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <DemoSimulatedAction
            doneLabel="Export fictif prÃ©parÃ©"
            label="Exporter mes finances"
            tone="success"
          />
          <DemoInlinePanel
            title="Ajout fictif d'une dÃ©pense"
            triggerLabel="Ajouter une dÃ©pense"
          >
            Les dÃ©penses rÃ©elles restent liÃ©es aux biens du propriÃ©taire et
            ne sont pas modifiÃ©es dans la dÃ©mo. Les frais RentFlow ne sont pas
            inclus comme dÃ©penses locatives.
          </DemoInlinePanel>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">
            Sorties par catÃ©gorie
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
            DÃ©penses dÃ©taillÃ©es
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
      <InfoAlert title="PrÃ©paration fiscale fictive" tone="warning">
        RentFlow aide Ã  prÃ©parer des donnÃ©es Ã  vÃ©rifier, mais ne gÃ©nÃ¨re
        pas de dÃ©claration officielle.
      </InfoAlert>
      <section className="space-y-4">
        <SectionHeader title="DonnÃ©es Ã  complÃ©ter" />
        <div className="grid gap-4 lg:grid-cols-2">
          {declarations.missingItems.map((item) => (
            <ActionCard
              actionLabel="ComplÃ©ter ce logement"
              description="Lien direct fictif vers l'endroit oÃ¹ corriger la donnÃ©e dans l'app rÃ©elle."
              href="/demo?mode=owner&page=property-detail"
              icon={<Building2 className="size-5" />}
              key={item}
              title={item}
              tone="warning"
            />
          ))}
          <ActionCard
            actionLabel="CrÃ©er un compte"
            description="Les informations personnelles fiscales restent facultatives et ne sont pas obligatoires dans la dÃ©mo."
            href="/sign-up"
            icon={<UserPlus className="size-5" />}
            title="ComplÃ©ter mes informations"
            tone="info"
          />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <StatCard
          label={`Montant prÃ©parÃ© ${declarations.year}`}
          value={formatMoney(declarations.preparedIncomeInCents)}
        />
        <details className="rounded-xl border bg-card p-5">
          <summary className="cursor-pointer font-semibold">
            Conseils personnalisÃ©s
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
        <SectionHeader
          action={
            <DemoInlinePanel
              title="Invitation fictive"
              triggerLabel="Inviter un locataire"
            >
              L&apos;invitation rÃ©elle est envoyÃ©e depuis l&apos;espace
              propriÃ©taire connectÃ©. Ici, l&apos;action reste simulÃ©e.
            </DemoInlinePanel>
          }
          title="Demandes locataires"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {owner.tenantRequests.map((request) => (
            <SpotlightCard
              key={request.id}
              tone={request.statusTone as CardTone}
            >
              <article className="h-full rounded-xl border bg-card p-5 shadow-sm">
                <StatusBadge tone={request.statusTone as BadgeTone}>
                  {request.status}
                </StatusBadge>
                <h3 className="mt-3 font-semibold">{request.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {request.tenantName} - {request.propertyName} -{" "}
                  {request.category}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <DemoSimulatedAction
                    confirmLabel="Marquer cette demande comme traitÃ©e ?"
                    doneLabel="Demande traitÃ©e"
                    label="Fait"
                    tone="success"
                  />
                  <DemoSimulatedAction
                    confirmLabel="Refuser fictivement cette demande ?"
                    doneLabel="Demande refusÃ©e"
                    label="RefusÃ©"
                    tone="danger"
                  />
                </div>
              </article>
            </SpotlightCard>
          ))}
        </div>
      </section>
    </>
  );
}

function TenantDashboardDemo() {
  const { tenant } = demoAppData;
  const totalRentInCents =
    tenant.contract.rentInCents + tenant.contract.chargesInCents;
  const ownerUser = {
    email: "arthur@example.test",
    firstName: "Arthur",
    lastName: "B.",
  };
  const primaryRental: TenantDashboardContractTenant = {
    id: "demo-contract-tenant-canal",
    roomLabel: null,
    rentShareAmountInCents: tenant.contract.rentInCents,
    chargesShareAmountInCents: tenant.contract.chargesInCents,
    depositShareAmountInCents: tenant.contract.depositInCents,
    currency: tenant.contract.currency,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    endDate: new Date("2027-02-28T00:00:00.000Z"),
    status: "ACTIVE",
    rentalContract: {
      id: tenant.contract.id,
      contractType: "INDIVIDUAL",
      status: "ACTIVE",
      paymentDayOfMonth: tenant.contract.paymentDay,
      ownerProfile: {
        user: ownerUser,
      },
      property: {
        name: tenant.property.name,
        city: tenant.property.city,
        propertyType: "APARTMENT",
        isColocation: false,
        imageUrl: tenant.property.imageSrc,
      },
    },
    paymentMandates: [],
  };
  const formerRental: TenantDashboardContractTenant = {
    id: "demo-contract-tenant-former",
    roomLabel: null,
    rentShareAmountInCents: 72000,
    chargesShareAmountInCents: 9000,
    depositShareAmountInCents: 72000,
    currency: tenant.contract.currency,
    startDate: new Date("2025-01-01T00:00:00.000Z"),
    endDate: new Date("2025-12-31T00:00:00.000Z"),
    status: "TERMINATED",
    rentalContract: {
      id: "demo-former-contract",
      contractType: "INDIVIDUAL",
      status: "TERMINATED",
      paymentDayOfMonth: 5,
      ownerProfile: {
        user: ownerUser,
      },
      property: {
        name: tenant.formerContract.propertyName,
        city: tenant.formerContract.city,
        propertyType: "APARTMENT",
        isColocation: false,
        imageUrl: tenant.property.imageSrc,
      },
    },
    paymentMandates: [],
  };
  const declarablePayment: TenantDashboardDeclarablePayment = {
    id: "demo-payment-june",
    rentalContractId: tenant.contract.id,
    contractTenantId: primaryRental.id,
    tenantProfileId: "demo-tenant-profile",
    provider: null,
    providerPaymentId: null,
    type: "RENT",
    status: "PLANNED",
    amountInCents: totalRentInCents,
    currency: tenant.contract.currency,
    dueDate: new Date("2026-06-05T00:00:00.000Z"),
    declarations: [],
    property: {
      name: tenant.property.name,
    },
  };
  const confirmedPayment: TenantDashboardPayment = {
    id: "demo-payment-may",
    rentalContractId: tenant.contract.id,
    contractTenantId: primaryRental.id,
    tenantProfileId: "demo-tenant-profile",
    provider: null,
    providerPaymentId: null,
    type: "RENT",
    status: "SUCCEEDED",
    amountInCents: totalRentInCents,
    currency: tenant.contract.currency,
    dueDate: new Date("2026-05-05T00:00:00.000Z"),
    paidAt: new Date("2026-05-04T00:00:00.000Z"),
    declarations: [],
    contractTenant: {
      id: primaryRental.id,
      status: "ACTIVE",
      rentShareAmountInCents: tenant.contract.rentInCents,
      chargesShareAmountInCents: tenant.contract.chargesInCents,
      paymentMandates: [],
    },
    property: {
      name: tenant.property.name,
    },
  };
  const plannedPayment: TenantDashboardPayment = {
    ...confirmedPayment,
    id: "demo-payment-july",
    status: "PENDING",
    dueDate: new Date("2026-07-05T00:00:00.000Z"),
    paidAt: null,
    declarations: [
      {
        id: "demo-payment-declaration-july",
        declarationType: "NOT_PAID_YET",
        declaredAt: new Date("2026-07-03T00:00:00.000Z"),
      },
    ],
  };
  const availableReceipt: TenantDashboardReceipt = {
    id: "demo-receipt-may",
    type: "RENT_RECEIPT",
    status: "GENERATED",
    periodStart: new Date("2026-05-01T00:00:00.000Z"),
    periodEnd: new Date("2026-05-31T00:00:00.000Z"),
    totalAmountInCents: totalRentInCents,
    currency: tenant.contract.currency,
    property: {
      name: tenant.property.name,
    },
  };
  const requestedReceipt: TenantDashboardRequestedReceipt = {
    id: "demo-receipt-june-request",
    type: "RENT_RECEIPT",
    status: "REQUESTED",
    periodStart: new Date("2026-06-01T00:00:00.000Z"),
    periodEnd: new Date("2026-06-30T00:00:00.000Z"),
    totalAmountInCents: totalRentInCents,
    currency: tenant.contract.currency,
    requestedAt: new Date("2026-06-04T00:00:00.000Z"),
    property: {
      name: tenant.property.name,
    },
  };
  const resolvedTenantRequest: TenantDashboardTenantRequest = {
    id: "demo-request-doc",
    category: "DOCUMENT",
    title: "Attestation d'occupation",
    description: "Demande de document pour une demarche administrative.",
    status: "RESOLVED_BY_OWNER",
    ownerResponse: "Document transmis dans l'espace locataire.",
    createdAt: new Date("2026-05-28T00:00:00.000Z"),
    resolvedAt: new Date("2026-05-29T00:00:00.000Z"),
    refusedAt: null,
    acknowledgedAt: null,
    property: {
      name: tenant.property.name,
      city: tenant.property.city,
    },
  };
  const stats: TenantDashboardStats = {
    activeContractTenants: 1,
    currentMonthPayments: 2,
    currentMonthSucceededPayments: 1,
    currentMonthFailedPayments: 0,
    paidAmountInCents: totalRentInCents,
    acceptedMandates: 0,
    availableReceipts: 2,
    pendingInvitations: 0,
  };

  return (
    <TenantDashboardView
      contractHref={() => "/demo?mode=tenant&page=contract"}
      contractTenantsWithMandateState={[
        {
          contractTenant: primaryRental,
          latestMandate: null,
          hasAcceptedMandate: false,
          canAcceptMockMandate: false,
        },
      ]}
      firstAvailableReceipt={availableReceipt}
      firstDeclarablePayment={declarablePayment}
      firstReceivedInvitation={null}
      firstReceiptRequestPayment={null}
      firstRefusedTenantRequest={null}
      firstResolvedTenantRequest={resolvedTenantRequest}
      formerRentals={[formerRental]}
      notice={<DemoNotice />}
      paymentsWithState={[
        {
          payment: confirmedPayment,
          receiptRequestState: {
            canRequestReceipt: true,
            hasRequestedReceipt: false,
            hasGeneratedReceipt: true,
          },
          latestExternalPaymentDeclaration: null,
          canDeclarePayment: false,
          canPayWithMock: false,
        },
        {
          payment: plannedPayment,
          receiptRequestState: {
            canRequestReceipt: false,
            hasRequestedReceipt: false,
            hasGeneratedReceipt: false,
          },
          latestExternalPaymentDeclaration: plannedPayment.declarations[0],
          canDeclarePayment: false,
          canPayWithMock: false,
        },
      ]}
      primaryContractRental={primaryRental}
      priorityActions={[
        "tenant-request-resolved",
        "declare-payment",
        "available-receipt",
      ]}
      receiptPdfHref={() => "/sign-up"}
      receivedInvitations={[]}
      recentReceipts={[availableReceipt]}
      renderActions={{
        availableReceipt: () => (
          <DemoSimulatedAction
            doneLabel="Quittance marquee comme vue"
            label="Marquer comme vue"
          />
        ),
        contractTermination: () => (
          <DemoSimulatedAction
            confirmLabel="Simuler une demande de fin de contrat ?"
            doneLabel="Demande de fin envoyee dans la demo"
            label="Demander la fin du contrat"
            tone="warning"
          />
        ),
        declarablePayment: () => (
          <DemoSimulatedAction
            confirmLabel="Declarer fictivement ce loyer comme paye ?"
            doneLabel="Loyer declare paye"
            label="Declarer mon loyer paye"
            tone="warning"
          />
        ),
        paymentDeclaration: () => (
          <DemoSimulatedAction
            confirmLabel="Declarer fictivement ce paiement ?"
            doneLabel="Declaration simulee"
            label="J'ai paye"
            tone="warning"
          />
        ),
        paymentReceiptRequest: () => (
          <DemoSimulatedAction
            doneLabel="Demande de quittance envoyee"
            label="Demander une quittance"
            tone="success"
          />
        ),
        tenantRequestResolved: () => (
          <DemoSimulatedAction
            doneLabel="Reponse confirmee"
            label="Confirmer"
            tone="success"
          />
        ),
      }}
      requestedReceipts={[requestedReceipt]}
      requestsHref="/demo?mode=tenant&page=requests"
      stats={stats}
      terminationQuickRental={primaryRental}
    />
  );
}
function TenantPaymentsAndReceipts() {
  const { tenant } = demoAppData;

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <SectionHeader title="Paiements rÃ©cents" />
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
                {receipt.status === "Disponible" ? (
                  <div className="mt-4">
                    <DemoSimulatedAction
                      doneLabel="Quittance vue"
                      label="J'ai consultÃ© la quittance"
                    />
                  </div>
                ) : null}
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
        Cette page simule le dÃ©tail contrat locataire. Aucun bouton de
        modification n&apos;est disponible.
      </InfoAlert>
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="group overflow-hidden rounded-xl border bg-card">
          <PropertyImage
            alt={tenant.property.name}
            imageSrc={tenant.property.imageSrc}
          />
          <div className="space-y-3 p-5">
            <h2 className="text-2xl font-semibold">DÃ©tail du contrat</h2>
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
            label="DÃ©pÃ´t de garantie"
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
            Formulaire fictif : l&apos;envoi rÃ©el est disponible aprÃ¨s
            crÃ©ation du compte.
          </p>
          <div className="mt-5">
            <DemoTenantRequestComposer />
          </div>
        </article>
        <section className="space-y-4">
          <SectionHeader title="Demandes au propriÃ©taire" />
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
                <div className="mt-4 flex flex-wrap gap-2">
                  {request.status === "Traitée par le propriétaire" ? (
                    <DemoSimulatedAction
                      doneLabel="Demande confirmÃ©e"
                      label="Confirmer"
                      tone="success"
                    />
                  ) : request.status === "Refusée" ? (
                    <DemoSimulatedAction
                      doneLabel="Refus archivÃ©"
                      label="J'ai compris"
                    />
                  ) : null}
                </div>
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
        <article className="rounded-xl border bg-card p-5 shadow-sm">
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
          <div className="mt-5 grid gap-3">
            <DemoSimulatedAction
              doneLabel="Photo fictive mise Ã  jour"
              label="Ajouter/remplacer photo"
            />
            <DemoInlinePanel
              title="Espace sÃ©curisÃ© fictif"
              triggerLabel="GÃ©rer mes identifiants"
            >
              Dans l&apos;app rÃ©elle, email et mot de passe sont gÃ©rÃ©s par
              l&apos;espace d&apos;authentification sÃ©curisÃ©.
            </DemoInlinePanel>
          </div>
        </article>
        <article className="rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="font-semibold">Informations personnelles</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Facultatives dans l&apos;app rÃ©elle, modifiables localement dans la
            dÃ©mo.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatCard label="PrÃ©nom" value="LÃ©a" />
            <StatCard label="Nom" value="Martin" />
            <StatCard label="Espace" value="Locataire" />
            <StatCard label="PropriÃ©taire" value={tenant.ownerName} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <DemoSimulatedAction
              doneLabel="Informations enregistrÃ©es dans la dÃ©mo"
              label="Enregistrer les informations"
              tone="success"
            />
            <span className="inline-flex items-center rounded-lg border bg-muted/40 px-3 py-1.5 text-sm font-medium">
              Changer d&apos;espace
            </span>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/demo?mode=owner&page=dashboard"
            >
              Ouvrir l&apos;espace propriÃ©taire
            </Link>
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/support"
            >
              Contacter le support
            </Link>
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
  const usesSharedOwnerDashboard = mode === "owner" && page === "dashboard";

  return (
    <section className="space-y-10">
      {usesSharedOwnerDashboard ? null : <DemoHeader mode={mode} page={page} />}
      {mode === "owner"
        ? renderOwnerPage(page as OwnerDemoPage)
        : renderTenantPage(page as TenantDemoPage)}
    </section>
  );
}
