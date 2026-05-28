import Link from "next/link";
import {
  Building2,
  FileText,
  Mail,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
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

type BadgeTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted";

const tenantActionIcons: Record<string, ReactNode> = {
  "Inviter un locataire": <UserPlus className="size-5" />,
  "Voir les contrats": <FileText className="size-5" />,
  "Voir les logements": <Building2 className="size-5" />,
  "Suivre les paiements": <WalletCards className="size-5" />,
};

const tenantActionTones: Record<string, DemoActionPillTone> = {
  "Inviter un locataire": "success",
  "Voir les contrats": "info",
  "Voir les logements": "default",
  "Suivre les paiements": "warning",
};

export default function DemoTenantsPage() {
  const { tenants } = demoDashboardData;

  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="Demo publique - donnees fictives"
        title="Mes locataires"
        description="Retrouvez les locataires rattaches aux contrats fictifs et suivez les invitations en cours."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo/properties"
            >
              Voir les logements
            </Link>
            <Link className={buttonVariants()} href="/sign-up">
              Inviter un locataire
            </Link>
          </>
        }
      />

      <DemoSpotlightCard tone="info">
        <InfoAlert title="Demo locataires">
          Les locataires affiches ici sont fictifs. Dans l&apos;app connectee,
          ils sont rattaches aux contrats et aux paiements du proprietaire.
        </InfoAlert>
      </DemoSpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Resume locataires"
          description="Une vue courte des rattachements et invitations fictives."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DemoSpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<Users className="size-5" />}
              label="Locataires actifs"
              value={tenants.summary.activeTenants}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<Mail className="size-5" />}
              label="Invitations en attente"
              value={tenants.summary.pendingInvitations}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="default">
            <StatCard
              className="h-full border-border bg-muted/40"
              label="Anciens locataires"
              value={tenants.summary.formerTenants}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<FileText className="size-5" />}
              label="Contrats concernes"
              value={tenants.summary.contractCount}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Locataires actuels"
          description="Locataires fictifs actifs rattaches aux biens de demo."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.activeTenants.map((tenant) => (
            <DemoSpotlightCard key={tenant.id} tone="success">
              <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold tracking-normal text-foreground">
                      {tenant.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tenant.email}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {tenant.propertyName} - {tenant.city}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone={tenant.statusTone as BadgeTone}>
                        {tenant.status}
                      </StatusBadge>
                      {tenant.roomLabel ? (
                        <StatusBadge tone="info">
                          {tenant.roomLabel}
                        </StatusBadge>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href="/sign-up"
                  >
                    Voir le contrat
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Contrat</p>
                    <p className="font-medium text-foreground">
                      {tenant.contractLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Loyer</p>
                    <p className="font-medium text-foreground">
                      {formatMoney(tenant.rentShareAmountInCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Charges</p>
                    <p className="font-medium text-foreground">
                      {formatMoney(tenant.chargesShareAmountInCents)}
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
          title="Invitations en attente"
          description="Invitations fictives envoyees et non encore acceptees."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {tenants.pendingInvitations.map((invitation) => (
            <DemoSpotlightCard key={invitation.id} tone="warning">
              <article className="h-full rounded-xl border border-chart-4/55 bg-chart-4/14 p-5 text-card-foreground shadow-sm shadow-black/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-semibold tracking-normal text-foreground">
                      {invitation.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invitation.email}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invitation.propertyName} - {invitation.city} -{" "}
                      {invitation.expiresLabel}
                    </p>
                  </div>
                  <StatusBadge tone={invitation.statusTone as BadgeTone}>
                    {invitation.status}
                  </StatusBadge>
                </div>
              </article>
            </DemoSpotlightCard>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Anciens locataires"
          description="Historique fictif des rattachements termines."
        />
        {tenants.formerTenants.length === 0 ? (
          <EmptyState
            title="Aucun ancien locataire pour le moment"
            description="Les anciens locataires apparaitront ici quand un rattachement sera termine."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenants.formerTenants.map((tenant) => (
              <DemoSpotlightCard key={tenant.id}>
                <article className="h-full rounded-xl border border-border bg-muted/30 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {tenant.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenant.propertyName} - {tenant.city} -{" "}
                        {tenant.endLabel}
                      </p>
                    </div>
                    <StatusBadge tone={tenant.statusTone as BadgeTone}>
                      {tenant.status}
                    </StatusBadge>
                  </div>
                </article>
              </DemoSpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Raccourcis fictifs vers les actions cles."
          title="Actions rapides"
        />
        <div className="flex flex-wrap gap-3">
          {demoDashboardData.tenantActions.map((action) => (
            <DemoActionPill
              icon={tenantActionIcons[action]}
              key={action}
              label={action}
              tone={tenantActionTones[action] ?? "default"}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
