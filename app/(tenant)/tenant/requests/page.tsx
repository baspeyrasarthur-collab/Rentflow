import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getTenantRequestsPageData } from "@/server/tenant/requests";

import {
  acknowledgeRefusedTenantRequestAction,
  acknowledgeResolvedTenantRequestAction,
  createTenantRequestAction,
} from "./actions";

const tenantRequestCategoryLabels: Record<string, string> = {
  GENERAL: "General",
  REPAIR: "Travaux / reparation",
  DOCUMENT: "Document",
  PAYMENT: "Paiement",
  RECEIPT: "Quittance",
  OTHER: "Autre",
};

const tenantRequestStatusLabels: Record<string, string> = {
  OPEN: "Envoyee",
  RESOLVED_BY_OWNER: "Traitee par le proprietaire",
  REFUSED_BY_OWNER: "Refusee par le proprietaire",
  ACKNOWLEDGED_BY_TENANT: "Cloturee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusTone(status: string) {
  if (status === "RESOLVED_BY_OWNER") {
    return "success" as const;
  }

  if (status === "REFUSED_BY_OWNER") {
    return "danger" as const;
  }

  if (status === "OPEN") {
    return "warning" as const;
  }

  if (status === "ACKNOWLEDGED_BY_TENANT" || status === "CANCELED") {
    return "muted" as const;
  }

  return "info" as const;
}

function getSpotlightTone(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

function getInfoAlertTone(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "info" : tone;
}

export default async function TenantRequestsPage() {
  const { requestTargets, tenantRequests } = await getTenantRequestsPageData();

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/tenant"
            >
              <ArrowLeft className="mr-2 size-4" />
              Retour espace locataire
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/tenant/account"
            >
              <UserRound className="mr-2 size-4" />
              Mon compte
            </Link>
          </>
        }
        description="Envoyez une demande a votre proprietaire et suivez son traitement."
        eyebrow="Demandes"
        title="Demandes au proprietaire"
      />

      <InfoAlert title="Demandes visibles par votre proprietaire" tone="info">
        Les demandes envoyees ici sont visibles par votre proprietaire dans son
        espace RentFlow. Elles ne remplacent pas une urgence ou un contact
        direct si la situation le necessite.
      </InfoAlert>

      <section className="space-y-4">
        <SectionHeader
          description="Une demande simple, visible et sans messagerie."
          title="Nouvelle demande"
        />
        {requestTargets.length === 0 ? (
          <EmptyState
            description="Vous pourrez envoyer une demande des qu'un logement sera rattache a votre espace."
            title="Demande indisponible"
          />
        ) : (
          <SpotlightCard tone="info">
            <form
              action={createTenantRequestAction}
              className="rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10"
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2 text-sm text-muted-foreground">
                  <span>Logement concerne</span>
                  <select
                    className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    name="contractTenantId"
                    required
                  >
                    {requestTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.rentalContract.property.name} -{" "}
                        {target.rentalContract.property.city}
                        {target.roomLabel ? ` - ${target.roomLabel}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-muted-foreground">
                  <span>Categorie</span>
                  <select
                    className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    name="category"
                  >
                    {Object.entries(tenantRequestCategoryLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2 text-sm text-muted-foreground">
                  <span>Titre</span>
                  <input
                    className="min-h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={120}
                    name="title"
                    placeholder="Ex : Probleme de chauffage"
                    required
                    type="text"
                  />
                </label>
                <label className="grid gap-2 text-sm text-muted-foreground">
                  <span>Description</span>
                  <textarea
                    className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={1000}
                    name="description"
                    placeholder="Expliquez simplement votre demande."
                    required
                  />
                </label>
              </div>
              <button
                className={buttonVariants({ className: "mt-4" })}
                type="submit"
              >
                Envoyer la demande
              </button>
            </form>
          </SpotlightCard>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Demandes ouvertes, traitees, refusees ou cloturees."
          title="Mes demandes"
        />
        {tenantRequests.length === 0 ? (
          <EmptyState
            description="Vos demandes apparaitront ici avec leur statut et la reponse du proprietaire."
            title="Aucune demande envoyee"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tenantRequests.map((tenantRequest) => (
              <SpotlightCard
                key={tenantRequest.id}
                tone={getSpotlightTone(tenantRequest.status)}
              >
                <article className="h-full rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {tenantRequest.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tenantRequest.property.name} -{" "}
                        {tenantRequest.property.city} -{" "}
                        {formatDate(tenantRequest.createdAt)}
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
                        {tenantRequestCategoryLabels[tenantRequest.category] ??
                          tenantRequest.category}
                      </StatusBadge>
                    </div>
                  </div>

                  {tenantRequest.ownerResponse ? (
                    <InfoAlert
                      className="mt-4"
                      title="Reponse proprietaire"
                      tone={getInfoAlertTone(tenantRequest.status)}
                    >
                      {tenantRequest.ownerResponse}
                    </InfoAlert>
                  ) : null}

                  {tenantRequest.status === "RESOLVED_BY_OWNER" ? (
                    <form
                      action={acknowledgeResolvedTenantRequestAction}
                      className="mt-4 flex flex-wrap items-center gap-3"
                    >
                      <input
                        name="tenantRequestId"
                        type="hidden"
                        value={tenantRequest.id}
                      />
                      <input
                        name="returnTo"
                        type="hidden"
                        value="/tenant/requests"
                      />
                      <label className="flex items-start gap-2 text-sm text-muted-foreground">
                        <input
                          className="mt-1 size-4 shrink-0 accent-primary"
                          name="confirmAcknowledge"
                          required
                          type="checkbox"
                        />
                        <span>Je confirme que c&apos;est fait.</span>
                      </label>
                      <button
                        className={buttonVariants({ size: "sm" })}
                        type="submit"
                      >
                        Confirmer
                      </button>
                    </form>
                  ) : null}

                  {tenantRequest.status === "REFUSED_BY_OWNER" ? (
                    <form
                      action={acknowledgeRefusedTenantRequestAction}
                      className="mt-4 flex flex-wrap items-center gap-3"
                    >
                      <input
                        name="tenantRequestId"
                        type="hidden"
                        value={tenantRequest.id}
                      />
                      <input
                        name="returnTo"
                        type="hidden"
                        value="/tenant/requests"
                      />
                      <label className="flex items-start gap-2 text-sm text-muted-foreground">
                        <input
                          className="mt-1 size-4 shrink-0 accent-primary"
                          name="confirmAcknowledge"
                          required
                          type="checkbox"
                        />
                        <span>
                          J&apos;ai compris. Je pourrai contacter mon
                          proprietaire autrement si necessaire.
                        </span>
                      </label>
                      <button
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        type="submit"
                      >
                        J&apos;ai compris
                      </button>
                    </form>
                  ) : null}
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
