import Link from "next/link";
import { notFound } from "next/navigation";

import {
  confirmOwnerContractTenantTerminationAction,
  terminateOwnerContractTenantAction,
} from "@/app/(owner)/owner/properties/[id]/contracts/[contractId]/actions";
import { markOwnerExternalPaymentReceivedAction } from "@/app/(owner)/owner/payments/actions";
import {
  generateOwnerRentReceiptAction,
  generateOwnerRequestedRentReceiptAction,
} from "@/app/(owner)/owner/receipts/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  EmptyState,
  InfoAlert,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { getOwnerPropertyContractById } from "@/server/owner/contracts";
import { buildReceiptPdfFilename } from "@/server/receipts/pdf-data";
import {
  canGenerateRentReceiptFromPayment,
  getMonthlyReceiptPeriodFromDueDate,
  hasExistingRentReceiptForPeriod,
  isFullRentPayment,
} from "@/server/receipts/receipt-data";

const contractTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  COLOCATION: "Colocation",
};

const colocationModeLabels: Record<string, string> = {
  NONE: "Aucun",
  LINKED_LEASES: "Baux lies",
  INDEPENDENT_LEASES: "Baux independants",
};

const contractStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Resiliation demandee",
  TERMINATED: "Termine",
  ARCHIVED: "Archive",
};

const propertyStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  ARCHIVED: "Archive",
  SUSPENDED: "Suspendu",
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

const paymentTypeLabels: Record<string, string> = {
  RENT: "Loyer et charges",
  CHARGES: "Charges",
  DEPOSIT: "Depot",
  ONE_OFF_EXPENSE: "Depense ponctuelle",
};

const contractTenantStatusLabels: Record<string, string> = {
  INVITED: "Invite",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Fin demandee",
  TERMINATED: "Termine",
};

const receiptStatusLabels: Record<string, string> = {
  REQUESTED: "Demandee",
  GENERATED: "Generee",
  SENT: "Envoyee",
  CANCELED: "Annulee",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "Non renseignee";
}

function getReceiptTenantLabel(receipt: {
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  const name = [
    receipt.tenantProfile.user.firstName,
    receipt.tenantProfile.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || receipt.tenantProfile.user.email;
}

function getPaymentDeclarationTenantLabel(declaration: {
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  const name = [
    declaration.tenantProfile.user.firstName,
    declaration.tenantProfile.user.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return name || declaration.tenantProfile.user.email;
}

function getContractTenantLabel(contractTenant: {
  invitedEmail: string | null;
  invitedFirstName: string | null;
  invitedLastName: string | null;
  roomLabel: string | null;
  tenantProfile?: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } | null;
}) {
  const profileUser = contractTenant.tenantProfile?.user;
  const profileName = profileUser
    ? [profileUser.firstName, profileUser.lastName].filter(Boolean).join(" ")
    : "";
  const invitedName = [
    contractTenant.invitedFirstName,
    contractTenant.invitedLastName,
  ]
    .filter(Boolean)
    .join(" ");
  const label =
    profileName ||
    profileUser?.email ||
    invitedName ||
    contractTenant.invitedEmail ||
    "Locataire rattache";

  return contractTenant.roomLabel
    ? `${label} - ${contractTenant.roomLabel}`
    : label;
}

function canMarkAsReceived(payment: {
  provider: string | null;
  providerPaymentId: string | null;
  status: string;
}) {
  return (
    payment.provider === null &&
    payment.providerPaymentId === null &&
    (payment.status === "PLANNED" || payment.status === "PENDING")
  );
}

function getRentReceiptState(
  payment: {
    type: "RENT" | "CHARGES" | "DEPOSIT" | "ONE_OFF_EXPENSE";
    status:
      | "PLANNED"
      | "PENDING"
      | "PROCESSING"
      | "SUCCEEDED"
      | "FAILED"
      | "CANCELED"
      | "REFUNDED"
      | "DISPUTED";
    amountInCents: number;
    dueDate: Date;
    tenantProfileId: string;
    rentalContractId: string;
    contractTenantId: string | null;
    contractTenant: {
      rentShareAmountInCents: number;
      chargesShareAmountInCents: number;
    } | null;
  },
  receipts: {
    type: "RECEIPT" | "RENT_RECEIPT";
    status: "REQUESTED" | "GENERATED" | "SENT" | "CANCELED";
    tenantProfileId: string;
    rentalContractId: string;
    contractTenantId: string | null;
    periodStart: Date;
    periodEnd: Date;
  }[],
) {
  if (!payment.contractTenant || !canGenerateRentReceiptFromPayment(payment)) {
    return {
      canGenerateReceipt: false,
      hasReceipt: false,
    };
  }

  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    payment.dueDate,
  );
  const hasReceipt = hasExistingRentReceiptForPeriod(receipts, {
    tenantProfileId: payment.tenantProfileId,
    rentalContractId: payment.rentalContractId,
    contractTenantId: payment.contractTenantId,
    periodStart,
    periodEnd,
  });
  const isFullPayment = isFullRentPayment(
    payment.amountInCents,
    payment.contractTenant.rentShareAmountInCents,
    payment.contractTenant.chargesShareAmountInCents,
  );

  return {
    canGenerateReceipt: isFullPayment && !hasReceipt,
    hasReceipt,
  };
}

function getStatusTone(status: string) {
  if (status === "ACTIVE" || status === "SUCCEEDED" || status === "GENERATED") {
    return "success" as const;
  }

  if (status === "FAILED" || status === "DISPUTED" || status === "SUSPENDED") {
    return "danger" as const;
  }

  if (status === "REQUESTED" || status === "PENDING") {
    return "warning" as const;
  }

  if (status === "ARCHIVED" || status === "TERMINATED") {
    return "muted" as const;
  }

  return "info" as const;
}

function getPaymentModeLabel(payment: {
  provider: string | null;
  providerPaymentId: string | null;
}) {
  if (payment.provider === null && payment.providerPaymentId === null) {
    return "Paiement externe suivi";
  }

  return payment.provider ?? "Provider externe";
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function getContractForPage(propertyId: string, contractId: string) {
  try {
    return await getOwnerPropertyContractById(propertyId, contractId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function OwnerContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contractId: string }>;
  searchParams?: Promise<{ focus?: string | string[] }>;
}) {
  const { id, contractId } = await params;
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams?.focus);
  const contract = await getContractForPage(id, contractId);

  if (!contract) {
    notFound();
  }

  const contractDetailPath = `/owner/properties/${contract.property.id}/contracts/${contract.id}`;
  const hasActiveContractTenant = contract.contractTenants.some(
    (contractTenant) =>
      contractTenant.status === "ACTIVE" && contractTenant.tenantProfileId,
  );
  const terminationRequestedContractTenants = contract.contractTenants.filter(
    (contractTenant) => contractTenant.status === "TERMINATION_REQUESTED",
  );
  const firstTerminationRequestedContractTenant =
    terminationRequestedContractTenants[0] ?? null;
  const requestedReceipts = contract.receipts.filter(
    (receipt) => receipt.status === "REQUESTED",
  );
  const firstRequestedReceipt = requestedReceipts[0] ?? null;
  const generatedReceipts = contract.receipts.filter(
    (receipt) => receipt.status === "GENERATED" || receipt.status === "SENT",
  );
  const paymentsWithState = contract.payments.map((payment) => ({
    payment,
    receiptState: getRentReceiptState(payment, contract.receipts),
    latestExternalPaymentDeclaration:
      payment.status === "SUCCEEDED" ? null : (payment.declarations[0] ?? null),
  }));
  const firstReceivablePayment = paymentsWithState.find(({ payment }) =>
    canMarkAsReceived(payment),
  );
  const firstGeneratableReceiptPayment = paymentsWithState.find(
    ({ receiptState }) => receiptState.canGenerateReceipt,
  );
  const showGeneratableReceiptAction =
    requestedReceipts.length === 0 && !!firstGeneratableReceiptPayment;
  const priorityActionCount = [
    contract.status === "DRAFT",
    terminationRequestedContractTenants.length > 0,
    hasActiveContractTenant,
    !!firstReceivablePayment,
    requestedReceipts.length > 0,
    showGeneratableReceiptAction,
  ].filter(Boolean).length;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Detail contrat"
        title={`Contrat ${contractTypeLabels[contract.contractType] ?? contract.contractType}`}
        description="Suivez le locataire, les paiements et les quittances lies a ce contrat."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/owner/properties/${contract.property.id}`}
            >
              Retour logement
            </Link>
            {contract.status === "DRAFT" ? (
              <Link
                className={buttonVariants()}
                href={`${contractDetailPath}/edit`}
              >
                Modifier
              </Link>
            ) : null}
          </>
        }
      />

      {contract.status === "DRAFT" ? (
        <InfoAlert title="Contrat en brouillon" tone="info">
          <p>
            Ce contrat reste en brouillon tant que l&apos;activation n&apos;est
            pas disponible dans le MVP. Vous pouvez encore le modifier et
            inviter le locataire selon le parcours existant.
          </p>
        </InfoAlert>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Synthese contrat"
          description="Les informations utiles avant de traiter les actions du contrat."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard
            label="Statut"
            value={contractStatusLabels[contract.status] ?? contract.status}
            hint={`${contractTypeLabels[contract.contractType] ?? contract.contractType} - ${
              colocationModeLabels[contract.colocationMode] ??
              contract.colocationMode
            }`}
          />
          <StatCard
            label="Loyer"
            value={formatMoney(contract.totalRentAmountInCents)}
          />
          <StatCard
            label="Charges"
            value={formatMoney(contract.totalChargesAmountInCents)}
          />
          <StatCard
            label="Jour de paiement"
            value={`Jour ${contract.paymentDayOfMonth}`}
          />
          <StatCard
            label="Date de debut"
            value={formatDate(contract.startDate)}
          />
          <StatCard
            label="Date de fin"
            value={formatOptionalDate(contract.endDate)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="A faire sur ce contrat"
          description="Les prochaines actions utiles selon l'etat actuel du dossier."
        />
        {priorityActionCount === 0 ? (
          <EmptyState
            title="Aucune action prioritaire"
            description="RentFlow affichera ici les actions importantes quand un paiement, une quittance ou une invitation demandera votre attention."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {firstTerminationRequestedContractTenant ? (
              <ActionCard
                title="Demande de fin de contrat"
                description="Le locataire souhaite mettre fin a son rattachement au contrat."
                value={getContractTenantLabel(
                  firstTerminationRequestedContractTenant,
                )}
                tone="warning"
              >
                <form action={confirmOwnerContractTenantTerminationAction}>
                  <input
                    name="contractTenantId"
                    type="hidden"
                    value={firstTerminationRequestedContractTenant.id}
                  />
                  <label className="mb-3 flex items-start gap-2 rounded-lg border border-chart-4/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                    <input
                      className="mt-1 size-4 shrink-0 accent-primary"
                      name="confirmTerminationRequest"
                      required
                      type="checkbox"
                    />
                    <span>
                      Je confirme valider la fin demandee par ce locataire.
                    </span>
                  </label>
                  <button
                    className={buttonVariants({ variant: "destructive" })}
                    type="submit"
                  >
                    Valider la fin
                  </button>
                </form>
                {terminationRequestedContractTenants.length > 1 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {terminationRequestedContractTenants.length - 1} autre(s)
                    demande(s) restent visibles dans la section Locataire.
                  </p>
                ) : null}
              </ActionCard>
            ) : null}

            {contract.status === "DRAFT" ? (
              <ActionCard
                title="Inviter un locataire"
                description="Rattachez un locataire au contrat pour avancer dans le bon ordre."
                href={`${contractDetailPath}/invitations/new`}
                actionLabel="Inviter un locataire"
                tone="info"
              />
            ) : null}

            {hasActiveContractTenant ? (
              <ActionCard
                title="Creer un paiement attendu"
                description="Ajoutez une echeance de loyer ou charges a suivre sur ce contrat."
                href={`${contractDetailPath}/payments/new`}
                actionLabel="Creer un paiement"
                tone="default"
              />
            ) : null}

            {firstReceivablePayment ? (
              <ActionCard
                title="Paiement externe a confirmer"
                description="Confirmez uniquement apres reception reelle hors RentFlow."
                value={formatMoney(
                  firstReceivablePayment.payment.amountInCents,
                  firstReceivablePayment.payment.currency,
                )}
                tone="warning"
              >
                <form action={markOwnerExternalPaymentReceivedAction}>
                  <input
                    name="paymentId"
                    type="hidden"
                    value={firstReceivablePayment.payment.id}
                  />
                  <button className={buttonVariants()} type="submit">
                    Marquer comme recu
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {requestedReceipts.length > 0 ? (
              <ActionCard
                title={`${requestedReceipts.length} demande(s) de quittance`}
                description="Des locataires attendent une quittance a generer."
                value={formatMoney(
                  requestedReceipts.reduce(
                    (total, receipt) => total + receipt.totalAmountInCents,
                    0,
                  ),
                )}
                tone="warning"
              >
                <form action={generateOwnerRequestedRentReceiptAction}>
                  <input
                    name="receiptId"
                    type="hidden"
                    value={firstRequestedReceipt?.id}
                  />
                  <button className={buttonVariants()} type="submit">
                    Generer la premiere demande
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {showGeneratableReceiptAction && firstGeneratableReceiptPayment ? (
              <ActionCard
                title="Quittance generable"
                description="Un paiement complet recu peut etre transforme en quittance."
                value={formatMoney(
                  firstGeneratableReceiptPayment.payment.amountInCents,
                  firstGeneratableReceiptPayment.payment.currency,
                )}
                tone="success"
              >
                <form action={generateOwnerRentReceiptAction}>
                  <input
                    name="paymentId"
                    type="hidden"
                    value={firstGeneratableReceiptPayment.payment.id}
                  />
                  <button className={buttonVariants()} type="submit">
                    Generer une quittance
                  </button>
                </form>
              </ActionCard>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Locataire"
          description="Locataires rattaches au contrat et parts de loyer suivies."
          action={
            contract.status === "DRAFT" ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`${contractDetailPath}/invitations/new`}
              >
                Inviter un locataire
              </Link>
            ) : null
          }
        />

        {contract.contractTenants.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {contract.contractTenants.map((contractTenant) => {
              const isFocusedTenant = focus === `tenant-${contractTenant.id}`;

              return (
                <article
                  className={cn(
                    "rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5 transition-all duration-300",
                    isFocusedTenant
                      ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
                      : "",
                  )}
                  id={`tenant-${contractTenant.id}`}
                  key={contractTenant.id}
                >
                  {isFocusedTenant ? (
                    <InfoAlert
                      className="mb-4"
                      title="Action ciblee"
                      tone="warning"
                    >
                      Action ciblee : ce locataire a une demande a traiter.
                    </InfoAlert>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold tracking-normal text-foreground">
                        {getContractTenantLabel(contractTenant)}
                      </h3>
                      <div className="mt-3">
                        <StatusBadge
                          tone={getStatusTone(contractTenant.status)}
                        >
                          {contractTenantStatusLabels[contractTenant.status] ??
                            contractTenant.status}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      <p>
                        Loyer{" "}
                        <span className="font-medium text-foreground">
                          {formatMoney(contractTenant.rentShareAmountInCents)}
                        </span>
                      </p>
                      <p>
                        Charges{" "}
                        <span className="font-medium text-foreground">
                          {formatMoney(
                            contractTenant.chargesShareAmountInCents,
                          )}
                        </span>
                      </p>
                      <p>
                        Fin{" "}
                        <span className="font-medium text-foreground">
                          {formatOptionalDate(contractTenant.endDate)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {contractTenant.status === "TERMINATION_REQUESTED" ? (
                    <InfoAlert
                      className="mt-5"
                      title="Demande de fin de contrat"
                      tone="warning"
                    >
                      <p>
                        Le locataire souhaite mettre fin a son rattachement au
                        contrat. Vous pouvez valider la fin ; aucune donnee ne
                        sera supprimee.
                      </p>
                      <form
                        action={confirmOwnerContractTenantTerminationAction}
                        className="mt-4 space-y-3"
                      >
                        <input
                          name="contractTenantId"
                          type="hidden"
                          value={contractTenant.id}
                        />
                        <label className="flex items-start gap-2 rounded-lg border border-chart-4/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                          <input
                            className="mt-1 size-4 shrink-0 accent-primary"
                            name="confirmTerminationRequest"
                            required
                            type="checkbox"
                          />
                          <span>
                            Je confirme valider la fin demandee par ce
                            locataire.
                          </span>
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            className={buttonVariants({
                              variant: "destructive",
                              size: "sm",
                            })}
                            type="submit"
                          >
                            Valider la fin
                          </button>
                          <span className="text-sm text-muted-foreground">
                            Laisser en attente : aucune action n&apos;est
                            necessaire.
                          </span>
                        </div>
                      </form>
                    </InfoAlert>
                  ) : null}

                  {contractTenant.status === "ACTIVE" &&
                  contractTenant.tenantProfileId ? (
                    <InfoAlert
                      className="mt-5"
                      title="Mettre fin au contrat pour ce locataire"
                      tone="danger"
                    >
                      <p>
                        Cette action mettra fin au rattachement de ce locataire.
                        Le locataire recevra une notification interne. Elle ne
                        supprime pas l&apos;historique.
                      </p>
                      <form
                        action={terminateOwnerContractTenantAction}
                        className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end"
                      >
                        <input
                          name="contractTenantId"
                          type="hidden"
                          value={contractTenant.id}
                        />
                        <label className="grid gap-2 text-sm text-muted-foreground">
                          <span>Tapez TERMINER pour confirmer.</span>
                          <input
                            autoComplete="off"
                            className="min-h-10 rounded-md border border-destructive/45 bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-destructive focus:ring-2 focus:ring-destructive/20"
                            name="confirmation"
                            placeholder="TERMINER"
                            required
                            type="text"
                          />
                        </label>
                        <button
                          className={buttonVariants({
                            variant: "destructive",
                            size: "sm",
                          })}
                          type="submit"
                        >
                          Mettre fin au contrat
                        </button>
                      </form>
                    </InfoAlert>
                  ) : null}

                  {contractTenant.status === "TERMINATED" ? (
                    <InfoAlert
                      className="mt-5"
                      title="Contrat termine"
                      tone="info"
                    >
                      <p>
                        Ce rattachement locataire est termine. L&apos;historique
                        reste consultable.
                      </p>
                    </InfoAlert>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Aucun locataire rattache"
            description="Une invitation pourra rattacher un locataire au contrat tant que le contrat respecte les conditions existantes."
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Paiements"
          description="Suivi des paiements attendus, declarations locataire et confirmations proprietaire."
          action={
            hasActiveContractTenant ? (
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`${contractDetailPath}/payments/new`}
              >
                Creer un paiement attendu
              </Link>
            ) : null
          }
        />

        {!hasActiveContractTenant ? (
          <InfoAlert title="Paiement attendu non disponible" tone="info">
            <p>
              Un paiement attendu pourra etre cree quand un locataire sera
              rattache au contrat avec un statut actif.
            </p>
          </InfoAlert>
        ) : null}

        {paymentsWithState.length > 0 ? (
          <div className="grid gap-4">
            {paymentsWithState.map(
              ({ latestExternalPaymentDeclaration, payment, receiptState }) => {
                const isFocusedPayment = focus === `payment-${payment.id}`;

                return (
                  <article
                    className={cn(
                      "rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5 transition-all duration-300",
                      isFocusedPayment
                        ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
                        : "",
                    )}
                    id={`payment-${payment.id}`}
                    key={payment.id}
                  >
                    {isFocusedPayment ? (
                      <InfoAlert
                        className="mb-4"
                        title="Action ciblee"
                        tone="warning"
                      >
                        Action ciblee : verifiez ce paiement puis confirmez
                        uniquement apres reception reelle.
                      </InfoAlert>
                    ) : null}

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 space-y-3">
                        <div>
                          <h3 className="font-semibold tracking-normal text-foreground">
                            {paymentTypeLabels[payment.type] ?? payment.type}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Echeance {formatDate(payment.dueDate)} -{" "}
                            {getPaymentModeLabel(payment)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={getStatusTone(payment.status)}>
                            {paymentStatusLabels[payment.status] ??
                              payment.status}
                          </StatusBadge>
                          {receiptState.hasReceipt ? (
                            <StatusBadge tone="muted">
                              Demande ou quittance existante
                            </StatusBadge>
                          ) : null}
                        </div>
                        {payment.paidAt ? (
                          <p className="text-sm text-muted-foreground">
                            Recu le {formatDate(payment.paidAt)}
                          </p>
                        ) : null}
                        {latestExternalPaymentDeclaration ? (
                          <InfoAlert
                            title={
                              latestExternalPaymentDeclaration.declarationType ===
                              "NOT_PAID_YET"
                                ? "Le locataire indique ne pas avoir encore paye."
                                : "Le locataire declare avoir paye ce loyer."
                            }
                            tone={
                              latestExternalPaymentDeclaration.declarationType ===
                              "NOT_PAID_YET"
                                ? "info"
                                : "warning"
                            }
                          >
                            <p>
                              Declare par{" "}
                              {getPaymentDeclarationTenantLabel(
                                latestExternalPaymentDeclaration,
                              )}{" "}
                              le{" "}
                              {formatDate(
                                latestExternalPaymentDeclaration.declaredAt,
                              )}
                              .{" "}
                              {latestExternalPaymentDeclaration.declarationType ===
                              "NOT_PAID_YET"
                                ? "Le paiement reste a suivre."
                                : "Confirmez uniquement apres reception reelle."}
                            </p>
                          </InfoAlert>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <p className="text-xl font-semibold tracking-normal text-foreground">
                          {formatMoney(payment.amountInCents, payment.currency)}
                        </p>
                        {receiptState.canGenerateReceipt ? (
                          <form action={generateOwnerRentReceiptAction}>
                            <input
                              name="paymentId"
                              type="hidden"
                              value={payment.id}
                            />
                            <button className={buttonVariants()} type="submit">
                              Generer une quittance
                            </button>
                          </form>
                        ) : null}

                        {canMarkAsReceived(payment) ? (
                          <form action={markOwnerExternalPaymentReceivedAction}>
                            <input
                              name="paymentId"
                              type="hidden"
                              value={payment.id}
                            />
                            <button className={buttonVariants()} type="submit">
                              Marquer comme recu
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    {canMarkAsReceived(payment) ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        A utiliser uniquement si le paiement a ete recu hors
                        RentFlow.
                      </p>
                    ) : null}

                    {receiptState.canGenerateReceipt ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        La quittance sera creee en statut genere. Le PDF reste
                        genere a la demande, sans stockage reel ni email pour
                        cette etape.
                      </p>
                    ) : null}
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <EmptyState
            title="Aucun paiement attendu"
            description="Aucun paiement attendu n'a encore ete cree pour ce contrat."
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Quittances"
          description="Demandes locataires, generation proprietaire et PDFs disponibles."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeader title="Demandes en attente" />
            {requestedReceipts.length > 0 ? (
              <div className="grid gap-3">
                {requestedReceipts.map((receipt) => {
                  const isFocusedReceipt = focus === `receipt-${receipt.id}`;

                  return (
                    <article
                      className={cn(
                        "rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5 transition-all duration-300",
                        isFocusedReceipt
                          ? "border-ring/75 bg-ring/10 shadow-lg shadow-ring/10"
                          : "",
                      )}
                      id={`receipt-${receipt.id}`}
                      key={receipt.id}
                    >
                      {isFocusedReceipt ? (
                        <InfoAlert
                          className="mb-4"
                          title="Action ciblee"
                          tone="info"
                        >
                          Action ciblee : cette demande de quittance attend
                          votre traitement.
                        </InfoAlert>
                      ) : null}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold tracking-normal text-foreground">
                            Demande de quittance
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDate(receipt.periodStart)} -{" "}
                            {formatDate(receipt.periodEnd)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Locataire : {getReceiptTenantLabel(receipt)}
                          </p>
                          <div className="mt-3">
                            <StatusBadge tone={getStatusTone(receipt.status)}>
                              {receiptStatusLabels[receipt.status] ??
                                receipt.status}
                            </StatusBadge>
                          </div>
                        </div>
                        <div className="space-y-3 sm:text-right">
                          <p className="font-semibold text-foreground">
                            {formatMoney(
                              receipt.totalAmountInCents,
                              receipt.currency,
                            )}
                          </p>
                          <form
                            action={generateOwnerRequestedRentReceiptAction}
                          >
                            <input
                              name="receiptId"
                              type="hidden"
                              value={receipt.id}
                            />
                            <button className={buttonVariants()} type="submit">
                              Generer la quittance
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Aucune demande en attente"
                description="Aucune demande de quittance n'est en attente pour ce contrat."
              />
            )}
          </div>

          <div className="space-y-4">
            <SectionHeader title="Quittances PDF" />
            {generatedReceipts.length > 0 ? (
              <div className="grid gap-3">
                {generatedReceipts.map((receipt) => {
                  const filename = buildReceiptPdfFilename({
                    propertyName: contract.property.name,
                    periodStart: receipt.periodStart,
                    totalAmountInCents: receipt.totalAmountInCents,
                    currency: receipt.currency,
                  });

                  return (
                    <Link
                      className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm shadow-black/5 transition-colors hover:bg-muted"
                      href={`/receipts/${receipt.id}/pdf`}
                      key={receipt.id}
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold tracking-normal text-foreground">
                          Quittance PDF disponible
                        </span>
                        <StatusBadge tone={getStatusTone(receipt.status)}>
                          {receiptStatusLabels[receipt.status] ??
                            receipt.status}
                        </StatusBadge>
                      </span>
                      <span className="mt-2 block text-sm text-muted-foreground">
                        {filename}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Aucune quittance generee"
                description="Aucune quittance PDF n'est encore disponible pour ce contrat."
              />
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Logement et historique"
          description="Contexte rattache au contrat, conserve en lecture compacte."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Logement" value={contract.property.name} />
          <StatCard label="Ville" value={contract.property.city} />
          <StatCard
            label="Statut logement"
            value={
              propertyStatusLabels[contract.property.status] ??
              contract.property.status
            }
            hint={
              contract.property.isColocation ? "Colocation" : "Hors colocation"
            }
          />
          <StatCard label="Cree le" value={formatDate(contract.createdAt)} />
          <StatCard
            label="Mis a jour le"
            value={formatDate(contract.updatedAt)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Locataires rattaches"
            value={contract._count.contractTenants}
          />
          <StatCard label="Invitations" value={contract._count.invitations} />
          <StatCard label="Mandats" value={contract._count.paymentMandates} />
          <StatCard label="Paiements" value={contract._count.payments} />
          <StatCard label="Quittances" value={contract._count.receipts} />
        </div>
      </section>
    </section>
  );
}
