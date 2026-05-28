import Link from "next/link";
import { FileText, Mail, Users } from "lucide-react";

import {
  refuseOwnerTenantRequestAction,
  resolveOwnerTenantRequestAction,
} from "@/app/(owner)/owner/tenants/requests/actions";
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
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerTenantsOverview } from "@/server/owner/tenants";
import { getOwnerTenantRequestSecondaryHref } from "@/server/owner/tenant-request-routing";

const contractTenantStatusLabels: Record<string, string> = {
  INVITED: "Invite",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Fin demandee",
  TERMINATED: "Termine",
};

const invitationStatusLabels: Record<string, string> = {
  SENT: "Envoyee",
  ACCEPTED: "Acceptee",
  EXPIRED: "Expiree",
  CANCELED: "Annulee",
};

const tenantRequestCategoryLabels: Record<string, string> = {
  GENERAL: "General",
  REPAIR: "Travaux / reparation",
  DOCUMENT: "Document",
  PAYMENT: "Paiement",
  RECEIPT: "Quittance",
  OTHER: "Autre",
};

const tenantRequestStatusLabels: Record<string, string> = {
  OPEN: "A traiter",
  RESOLVED_BY_OWNER: "Traitee",
  REFUSED_BY_OWNER: "Refusee",
  ACKNOWLEDGED_BY_TENANT: "Confirmee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTenantLabel(tenant: {
  invitedEmail: string | null;
  invitedFirstName: string | null;
  invitedLastName: string | null;
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } | null;
}) {
  const tenantName = tenant.tenantProfile
    ? [tenant.tenantProfile.user.firstName, tenant.tenantProfile.user.lastName]
        .filter(Boolean)
        .join(" ")
    : "";
  const invitedName = [tenant.invitedFirstName, tenant.invitedLastName]
    .filter(Boolean)
    .join(" ");

  return (
    tenantName ||
    invitedName ||
    tenant.tenantProfile?.user.email ||
    tenant.invitedEmail ||
    "Locataire"
  );
}

function getInvitationLabel(invitation: {
  tenantEmail: string;
  tenantFirstName: string;
  tenantLastName: string;
}) {
  return (
    [invitation.tenantFirstName, invitation.tenantLastName]
      .filter(Boolean)
      .join(" ") || invitation.tenantEmail
  );
}

function getRequestTenantLabel(tenantRequest: {
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  const name = [
    tenantRequest.tenantProfile.user.firstName,
    tenantRequest.tenantProfile.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || tenantRequest.tenantProfile.user.email;
}

function getStatusTone(status: string) {
  if (
    status === "ACTIVE" ||
    status === "ACCEPTED" ||
    status === "RESOLVED_BY_OWNER"
  ) {
    return "success" as const;
  }

  if (
    status === "SUSPENDED" ||
    status === "EXPIRED" ||
    status === "CANCELED" ||
    status === "REFUSED_BY_OWNER"
  ) {
    return "danger" as const;
  }

  if (status === "INVITED" || status === "SENT" || status === "OPEN") {
    return "warning" as const;
  }

  if (status === "TERMINATED") {
    return "muted" as const;
  }

  return "info" as const;
}

function getCardTone(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

async function getTenantsForPage() {
  try {
    return await getOwnerTenantsOverview();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OwnerTenantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ focus?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams?.focus);
  const tenants = await getTenantsForPage();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Locataires"
        title="Mes locataires"
        description="Retrouvez les locataires rattaches a vos contrats et suivez les invitations en cours."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Voir les biens
            </Link>
            <Link className={buttonVariants()} href="/owner/tenants/invite">
              Inviter un locataire
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Invitation depuis les contrats">
          Les locataires sont rattaches aux contrats. Pour l&apos;instant,
          l&apos;invitation se fait depuis le detail d&apos;un contrat.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Resume locataires"
          description="Une vue courte des rattachements et invitations en cours."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<Users className="size-5" />}
              label="Locataires actifs"
              value={tenants.summary.activeTenants}
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<Mail className="size-5" />}
              label="Invitations en attente"
              value={tenants.summary.pendingInvitations}
            />
          </SpotlightCard>
          <SpotlightCard tone="default">
            <StatCard
              className="h-full border-border bg-muted/40"
              label="Anciens locataires"
              value={tenants.summary.formerTenants}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<FileText className="size-5" />}
              label="Demandes ouvertes"
              value={tenants.summary.openTenantRequests}
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Demandes locataires"
          description="Demandes envoyees depuis l'espace locataire et a traiter sans messagerie."
        />
        {tenants.tenantRequests.length === 0 ? (
          <EmptyState
            title="Aucune demande locataire"
            description="Les demandes envoyees par vos locataires apparaitront ici."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenants.tenantRequests.map((tenantRequest) => {
              const isFocusedRequest = focus === `request-${tenantRequest.id}`;
              const secondaryHref = getOwnerTenantRequestSecondaryHref({
                category: tenantRequest.category,
                propertyId: tenantRequest.property.id,
                rentalContractId: tenantRequest.rentalContractId,
              });

              return (
                <SpotlightCard
                  key={tenantRequest.id}
                  tone={getCardTone(tenantRequest.status)}
                >
                  <article
                    className={[
                      "h-full rounded-xl border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300",
                      isFocusedRequest
                        ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
                        : "border-border",
                    ].join(" ")}
                    id={`request-${tenantRequest.id}`}
                  >
                    {isFocusedRequest ? (
                      <InfoAlert
                        className="mb-4"
                        title="Action ciblee"
                        tone="warning"
                      >
                        Action ciblee : repondez a cette demande locataire.
                      </InfoAlert>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold tracking-normal text-foreground">
                          {tenantRequest.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getRequestTenantLabel(tenantRequest)} -{" "}
                          {tenantRequest.property.name},{" "}
                          {tenantRequest.property.city}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {tenantRequest.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <StatusBadge tone={getStatusTone(tenantRequest.status)}>
                          {tenantRequestStatusLabels[tenantRequest.status] ??
                            tenantRequest.status}
                        </StatusBadge>
                        <StatusBadge tone="info">
                          {tenantRequestCategoryLabels[
                            tenantRequest.category
                          ] ?? tenantRequest.category}
                        </StatusBadge>
                      </div>
                    </div>

                    {secondaryHref ? (
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "mt-4",
                        })}
                        href={secondaryHref}
                      >
                        Ouvrir la page concernee
                      </Link>
                    ) : null}

                    {tenantRequest.ownerResponse ? (
                      <InfoAlert
                        className="mt-4"
                        title="Reponse proprietaire"
                        tone="info"
                      >
                        {tenantRequest.ownerResponse}
                      </InfoAlert>
                    ) : null}

                    {tenantRequest.status === "OPEN" ? (
                      <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        <form
                          action={resolveOwnerTenantRequestAction}
                          className="space-y-3 rounded-lg border border-primary/35 bg-primary/10 p-3"
                        >
                          <input
                            name="tenantRequestId"
                            type="hidden"
                            value={tenantRequest.id}
                          />
                          <textarea
                            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                            maxLength={500}
                            name="ownerResponse"
                            placeholder="Reponse optionnelle"
                          />
                          <label className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                            <input
                              className="mt-1 size-4 shrink-0 accent-primary"
                              name="confirmResolved"
                              required
                              type="checkbox"
                            />
                            <span>Je confirme avoir traite cette demande.</span>
                          </label>
                          <button
                            className={buttonVariants({ size: "sm" })}
                            type="submit"
                          >
                            Fait
                          </button>
                        </form>

                        <form
                          action={refuseOwnerTenantRequestAction}
                          className="space-y-3 rounded-lg border border-destructive/35 bg-destructive/10 p-3"
                        >
                          <input
                            name="tenantRequestId"
                            type="hidden"
                            value={tenantRequest.id}
                          />
                          <textarea
                            className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                            maxLength={500}
                            name="ownerResponse"
                            placeholder="Motif optionnel"
                          />
                          <label className="flex items-start gap-2 text-sm leading-5 text-muted-foreground">
                            <input
                              className="mt-1 size-4 shrink-0 accent-primary"
                              name="confirmRefused"
                              required
                              type="checkbox"
                            />
                            <span>Je confirme refuser cette demande.</span>
                          </label>
                          <button
                            className={buttonVariants({
                              variant: "destructive",
                              size: "sm",
                            })}
                            type="submit"
                          >
                            Refuse
                          </button>
                        </form>
                      </div>
                    ) : null}

                    <p className="mt-4 text-xs text-muted-foreground">
                      Envoyee le {formatDate(tenantRequest.createdAt)}
                    </p>
                  </article>
                </SpotlightCard>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Locataires actuels"
          description="Locataires actifs rattaches aux contrats du proprietaire."
        />
        {tenants.activeTenants.length === 0 ? (
          <EmptyState
            title="Aucun locataire actif"
            description="Les locataires actifs apparaitront ici une fois rattaches a un contrat."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenants.activeTenants.map((tenant) => (
              <SpotlightCard key={tenant.id} tone="success">
                <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {getTenantLabel(tenant)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenant.rentalContract.property.name} -{" "}
                        {tenant.rentalContract.property.city}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge tone={getStatusTone(tenant.status)}>
                          {contractTenantStatusLabels[tenant.status] ??
                            tenant.status}
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
                      href={`/owner/properties/${tenant.rentalContract.property.id}/contracts/${tenant.rentalContract.id}`}
                    >
                      Voir le contrat
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-lg border border-border/80 bg-background/45 p-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Loyer</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(
                          tenant.rentShareAmountInCents,
                          tenant.currency,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Charges</p>
                      <p className="font-medium text-foreground">
                        {formatMoney(
                          tenant.chargesShareAmountInCents,
                          tenant.currency,
                        )}
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
          title="Invitations en attente"
          description="Invitations envoyees et non encore acceptees."
        />
        {tenants.pendingInvitations.length === 0 ? (
          <EmptyState
            title="Aucune invitation en attente"
            description="Les invitations envoyees depuis les contrats apparaitront ici."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenants.pendingInvitations.map((invitation) => (
              <SpotlightCard key={invitation.id} tone="warning">
                <article className="h-full rounded-xl border border-chart-4/55 bg-chart-4/14 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {getInvitationLabel(invitation)}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invitation.tenantEmail}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {invitation.rentalContract.property.name} - expire le{" "}
                        {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                    <StatusBadge tone={getStatusTone(invitation.status)}>
                      {invitationStatusLabels[invitation.status] ??
                        invitation.status}
                    </StatusBadge>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Anciens locataires"
          description="Historique des locataires termines quand il existe."
        />
        {tenants.formerTenants.length === 0 ? (
          <EmptyState
            title="Aucun ancien locataire pour le moment"
            description="Les anciens locataires apparaitront ici quand un rattachement sera termine."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenants.formerTenants.map((tenant) => (
              <SpotlightCard key={tenant.id}>
                <article className="h-full rounded-xl border border-border bg-muted/30 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <h3 className="font-semibold tracking-normal text-foreground">
                    {getTenantLabel(tenant)}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tenant.rentalContract.property.name} -{" "}
                    {tenant.endDate
                      ? `fin le ${formatDate(tenant.endDate)}`
                      : "date de fin non renseignee"}
                  </p>
                </article>
              </SpotlightCard>
            ))}
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
