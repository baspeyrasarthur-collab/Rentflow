import Link from "next/link";
import { FileText, LogOut, MessageSquare, WalletCards } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  CompactActionPill,
  EmptyState,
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { buildReceiptPdfFilename } from "@/server/receipts/pdf-data";
import {
  canRequestRentReceiptFromPayment,
  getMonthlyReceiptPeriodFromDueDate,
  hasExistingRentReceiptForPeriod,
  isFullRentPayment,
} from "@/server/receipts/receipt-data";
import { getTenantDashboardData } from "@/server/tenant/dashboard";

import { acceptMockMandateAction } from "./mandates/actions";
import { requestTenantContractTerminationAction } from "./contracts/actions";
import { acceptTenantDashboardInvitationAction } from "./invitations/actions";
import {
  declareTenantExternalPaymentNotPaidYetAction,
  declareTenantExternalPaymentPaidAction,
  payTenantPaymentWithMockProviderAction,
} from "./payments/actions";
import {
  markTenantReceiptAsSeenAction,
  requestTenantRentReceiptAction,
} from "./receipts/actions";
import {
  acknowledgeRefusedTenantRequestAction,
  acknowledgeResolvedTenantRequestAction,
} from "./requests/actions";

const contractTypeLabels: Record<string, string> = {
  INDIVIDUAL: "Individuel",
  COLOCATION: "Colocation",
};

const contractTenantStatusLabels: Record<string, string> = {
  INVITED: "Invite",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Fin demandee",
  TERMINATED: "Termine",
};

const rentalContractStatusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  ACTIVE: "Actif",
  SUSPENSION_REQUESTED: "Suspension demandee",
  SUSPENDED: "Suspendu",
  TERMINATION_REQUESTED: "Resiliation demandee",
  TERMINATED: "Termine",
  ARCHIVED: "Archive",
};

const propertyTypeLabels: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  ROOM: "Chambre",
  OTHER: "Autre",
};

const paymentTypeLabels: Record<string, string> = {
  RENT: "Loyer",
  CHARGES: "Charges",
  DEPOSIT: "Depot",
  ONE_OFF_EXPENSE: "Frais ponctuel",
};

const paymentStatusLabels: Record<string, string> = {
  PLANNED: "Prevu",
  PENDING: "En attente",
  PROCESSING: "En traitement",
  SUCCEEDED: "Reussi",
  FAILED: "Echoue",
  CANCELED: "Annule",
  REFUNDED: "Rembourse",
  DISPUTED: "Conteste",
};

const receiptTypeLabels: Record<string, string> = {
  RECEIPT: "Recu",
  RENT_RECEIPT: "Quittance",
};

const receiptStatusLabels: Record<string, string> = {
  REQUESTED: "Demandee",
  GENERATED: "Generee",
  SENT: "Envoyee",
  CANCELED: "Annulee",
};

const mandateStatusLabels: Record<string, string> = {
  CREATED: "Cree",
  ACCEPTED: "Accepte",
  REVOKED: "Revoque",
  EXPIRED: "Expire",
  FAILED: "Echoue",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "Non renseignee";
}

function labelFor(labels: Record<string, string>, value: string) {
  return labels[value] ?? value;
}

function getOwnerDisplayName(invitation: {
  ownerProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
}) {
  const ownerUser = invitation.ownerProfile.user;
  const name = [ownerUser.firstName, ownerUser.lastName]
    .filter(Boolean)
    .join(" ");

  return name || ownerUser.email;
}

function getStatusTone(status: string) {
  if (
    status === "ACTIVE" ||
    status === "ACCEPTED" ||
    status === "SUCCEEDED" ||
    status === "GENERATED" ||
    status === "SENT" ||
    status === "RESOLVED_BY_OWNER"
  ) {
    return "success" as const;
  }

  if (
    status === "FAILED" ||
    status === "DISPUTED" ||
    status === "SUSPENDED" ||
    status === "REFUSED_BY_OWNER"
  ) {
    return "danger" as const;
  }

  if (
    status === "PLANNED" ||
    status === "PENDING" ||
    status === "REQUESTED" ||
    status === "DRAFT" ||
    status === "OPEN"
  ) {
    return "warning" as const;
  }

  if (
    status === "CANCELED" ||
    status === "REFUNDED" ||
    status === "REVOKED" ||
    status === "EXPIRED" ||
    status === "TERMINATED" ||
    status === "ACKNOWLEDGED_BY_TENANT"
  ) {
    return "muted" as const;
  }

  return "info" as const;
}

function getSpotlightToneForStatus(status: string) {
  const tone = getStatusTone(status);

  return tone === "muted" ? "default" : tone;
}

function TenantPropertyImage({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="group relative h-32 overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/28 via-ring/12 to-background shadow-md shadow-black/10 sm:h-36 lg:h-40">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Photo du logement ${name}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={imageUrl}
        />
      ) : (
        <>
          <div className="absolute inset-x-8 bottom-0 h-20 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/25 transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute bottom-7 right-8 h-12 w-20 rounded-t-xl border border-white/10 bg-white/10 transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute bottom-4 left-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Photo du logement
          </div>
        </>
      )}
    </div>
  );
}

function canPayWithMockProvider(payment: {
  provider: string | null;
  providerPaymentId: string | null;
  type: string;
  status: string;
  contractTenant: {
    status: string;
    paymentMandates: { status: string }[];
  } | null;
}) {
  const paymentCanBeProcessed =
    payment.status === "PLANNED" || payment.status === "PENDING";
  const providerCanBeMocked =
    (payment.provider === null && payment.providerPaymentId === null) ||
    payment.provider === "MOCK";
  const hasAcceptedMandate =
    payment.contractTenant?.status === "ACTIVE" &&
    payment.contractTenant.paymentMandates.some(
      (mandate) => mandate.status === "ACCEPTED",
    );

  return (
    payment.type === "RENT" &&
    paymentCanBeProcessed &&
    providerCanBeMocked &&
    hasAcceptedMandate
  );
}

function canDeclareExternalPaymentPaid(payment: {
  provider: string | null;
  providerPaymentId: string | null;
  type: string;
  status: string;
}) {
  return (
    payment.provider === null &&
    payment.providerPaymentId === null &&
    payment.type === "RENT" &&
    (payment.status === "PLANNED" || payment.status === "PENDING")
  );
}

function isPaymentOverdue(dueDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dueDate < today;
}

function getOwnerNameFromRental(contractTenant: {
  rentalContract: {
    ownerProfile?: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    };
  };
}) {
  const ownerUser = contractTenant.rentalContract.ownerProfile?.user;

  if (!ownerUser) {
    return "Proprietaire";
  }

  const name = [ownerUser.firstName, ownerUser.lastName]
    .filter(Boolean)
    .join(" ");

  return name || ownerUser.email;
}

function getRentReceiptRequestState(
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
    rentalContractId: string;
    contractTenantId: string | null;
    tenantProfileId: string;
    contractTenant: {
      status: string;
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
  if (
    !payment.contractTenant ||
    payment.contractTenant.status === "TERMINATED" ||
    !canRequestRentReceiptFromPayment(payment)
  ) {
    return {
      canRequestReceipt: false,
      hasRequestedReceipt: false,
      hasGeneratedReceipt: false,
    };
  }

  const { periodStart, periodEnd } = getMonthlyReceiptPeriodFromDueDate(
    payment.dueDate,
  );
  const matchingReceipt = receipts.find(
    (receipt) =>
      receipt.type === "RENT_RECEIPT" &&
      receipt.tenantProfileId === payment.tenantProfileId &&
      receipt.rentalContractId === payment.rentalContractId &&
      receipt.contractTenantId === payment.contractTenantId &&
      receipt.periodStart.getTime() === periodStart.getTime() &&
      receipt.periodEnd.getTime() === periodEnd.getTime(),
  );
  const hasBlockingReceipt = hasExistingRentReceiptForPeriod(receipts, {
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
    canRequestReceipt: isFullPayment && !hasBlockingReceipt,
    hasRequestedReceipt: matchingReceipt?.status === "REQUESTED",
    hasGeneratedReceipt:
      matchingReceipt?.status === "GENERATED" ||
      matchingReceipt?.status === "SENT",
  };
}

export default async function TenantIndexPage() {
  const dashboard = await getTenantDashboardData();

  if (!dashboard.tenantProfile || !dashboard.stats) {
    return (
      <section className="max-w-3xl space-y-6">
        <PageHeader
          eyebrow="RentFlow"
          title="Profil locataire non initialise"
          description="Votre compte a acces a cet espace locataire, mais aucun profil locataire RentFlow reste rattache a cet utilisateur pour le moment."
        />
        <InfoAlert title="Invitation necessaire" tone="info">
          <p>
            Une invitation proprietaire permettra de rattacher votre compte a un
            logement, un contrat et vos futurs paiements.
          </p>
        </InfoAlert>
      </section>
    );
  }

  const {
    stats,
    currentRentals,
    formerRentals,
    recentPayments,
    externalPaymentsToDeclare,
    requestedReceipts,
    recentReceipts,
    unseenAvailableReceipts,
    receivedInvitations,
    rentReceiptPeriodStatuses,
    tenantRequests,
  } = dashboard;

  const contractTenantsWithMandateState = currentRentals.map(
    (contractTenant) => {
      const latestMandate = contractTenant.paymentMandates[0] ?? null;
      const hasAcceptedMandate = latestMandate?.status === "ACCEPTED";

      return {
        contractTenant,
        latestMandate,
        hasAcceptedMandate,
        canAcceptMockMandate:
          contractTenant.status === "ACTIVE" && !hasAcceptedMandate,
      };
    },
  );
  const paymentsWithState = recentPayments.map((payment) => {
    const receiptRequestState = getRentReceiptRequestState(
      payment,
      rentReceiptPeriodStatuses,
    );
    const latestExternalPaymentDeclaration =
      payment.status === "SUCCEEDED" ? null : (payment.declarations[0] ?? null);
    const hasDeclaredPaidExternally =
      latestExternalPaymentDeclaration?.declarationType === "PAID_EXTERNALLY";

    return {
      payment,
      receiptRequestState,
      latestExternalPaymentDeclaration,
      canDeclarePayment:
        payment.contractTenant?.status !== "TERMINATED" &&
        !hasDeclaredPaidExternally &&
        canDeclareExternalPaymentPaid(payment),
      canPayWithMock:
        !hasDeclaredPaidExternally && canPayWithMockProvider(payment),
    };
  });
  const firstMandateToAccept = contractTenantsWithMandateState.find(
    ({ canAcceptMockMandate }) => canAcceptMockMandate,
  );
  const firstDeclarablePayment = externalPaymentsToDeclare[0] ?? null;
  const firstMockPayablePayment = paymentsWithState.find(
    ({ canPayWithMock }) => canPayWithMock,
  );
  const firstReceiptRequestPayment = paymentsWithState.find(
    ({ receiptRequestState }) => receiptRequestState.canRequestReceipt,
  );
  const firstAvailableReceipt = unseenAvailableReceipts[0] ?? null;
  const firstReceivedInvitation = receivedInvitations[0] ?? null;
  const firstResolvedTenantRequest =
    tenantRequests.find(
      (tenantRequest) => tenantRequest.status === "RESOLVED_BY_OWNER",
    ) ?? null;
  const firstRefusedTenantRequest =
    tenantRequests.find(
      (tenantRequest) => tenantRequest.status === "REFUSED_BY_OWNER",
    ) ?? null;
  const priorityActions = [
    firstResolvedTenantRequest ? "tenant-request-resolved" : null,
    firstRefusedTenantRequest ? "tenant-request-refused" : null,
    firstReceivedInvitation ? "invitation" : null,
    firstDeclarablePayment ? "declare-payment" : null,
    firstReceiptRequestPayment ? "receipt-request" : null,
    firstAvailableReceipt ? "available-receipt" : null,
    firstMandateToAccept ? "mandate" : null,
    firstMockPayablePayment && !firstAvailableReceipt ? "mock-payment" : null,
  ]
    .filter(Boolean)
    .slice(0, 4);
  const showInvitationAction = priorityActions.includes("invitation");
  const showTenantRequestResolvedAction = priorityActions.includes(
    "tenant-request-resolved",
  );
  const showTenantRequestRefusedAction = priorityActions.includes(
    "tenant-request-refused",
  );
  const showDeclarablePaymentAction =
    priorityActions.includes("declare-payment");
  const showReceiptRequestAction = priorityActions.includes("receipt-request");
  const showAvailableReceiptAction =
    priorityActions.includes("available-receipt");
  const showMandateAction = priorityActions.includes("mandate");
  const showMockPaymentAction = priorityActions.includes("mock-payment");
  const primaryContractRental =
    currentRentals.find((rental) => rental.status === "ACTIVE") ??
    currentRentals[0] ??
    null;
  const terminationQuickRental =
    currentRentals.find((rental) => rental.status === "ACTIVE") ?? null;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="RentFlow"
        title="Espace locataire"
        description="Suivez votre logement, vos paiements et vos quittances en toute simplicite."
      />

      <InfoAlert title="Votre espace personnel" tone="info">
        <p>
          Votre espace locataire regroupe vos paiements, quittances et
          informations de logement.
        </p>
      </InfoAlert>

      <section className="space-y-4">
        <SectionHeader
          title="A faire maintenant"
          description="Les actions utiles pour votre situation actuelle, sans surcharge."
        />
        {priorityActions.length === 0 ? (
          <EmptyState
            title="Tout est a jour"
            description="Aucune action urgente pour le moment. RentFlow vous signalera ici les prochaines informations importantes."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {showTenantRequestResolvedAction && firstResolvedTenantRequest ? (
              <ActionCard
                title="Votre proprietaire indique avoir traite votre demande"
                description="Confirmez quand vous avez bien pris connaissance du traitement."
                value={firstResolvedTenantRequest.title}
                tone="success"
              >
                <form action={acknowledgeResolvedTenantRequestAction}>
                  <input
                    name="tenantRequestId"
                    type="hidden"
                    value={firstResolvedTenantRequest.id}
                  />
                  <label className="mb-3 flex items-start gap-2 rounded-lg border border-primary/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                    <input
                      className="mt-1 size-4 shrink-0 accent-primary"
                      name="confirmAcknowledge"
                      required
                      type="checkbox"
                    />
                    <span>Je confirme que cette demande est traitee.</span>
                  </label>
                  <button
                    className={buttonVariants({ size: "sm" })}
                    type="submit"
                  >
                    Confirmer
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {showTenantRequestRefusedAction && firstRefusedTenantRequest ? (
              <ActionCard
                title="Votre proprietaire a refuse votre demande"
                description="Vous pourrez le contacter autrement plus tard si necessaire."
                value={firstRefusedTenantRequest.title}
                tone="danger"
              >
                {firstRefusedTenantRequest.ownerResponse ? (
                  <p className="mb-3 text-sm leading-6 text-muted-foreground">
                    {firstRefusedTenantRequest.ownerResponse}
                  </p>
                ) : null}
                <form action={acknowledgeRefusedTenantRequestAction}>
                  <input
                    name="tenantRequestId"
                    type="hidden"
                    value={firstRefusedTenantRequest.id}
                  />
                  <label className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                    <input
                      className="mt-1 size-4 shrink-0 accent-primary"
                      name="confirmAcknowledge"
                      required
                      type="checkbox"
                    />
                    <span>J&apos;ai compris la reponse du proprietaire.</span>
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
              </ActionCard>
            ) : null}

            {showInvitationAction && firstReceivedInvitation ? (
              <ActionCard
                title="Invitation locataire a accepter"
                description="Un proprietaire vous invite a rejoindre un logement avec ce compte."
                value={firstReceivedInvitation.property.name}
                tone="info"
              >
                <form action={acceptTenantDashboardInvitationAction}>
                  <input
                    name="invitationId"
                    type="hidden"
                    value={firstReceivedInvitation.id}
                  />
                  <label className="mb-3 flex items-start gap-2 rounded-lg border border-ring/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                    <input
                      className="mt-1 size-4 shrink-0 accent-primary"
                      name="confirmAccept"
                      required
                      type="checkbox"
                    />
                    <span>
                      Je confirme vouloir rejoindre ce logement avec mon compte
                      locataire.
                    </span>
                  </label>
                  <button
                    className={buttonVariants({ size: "sm" })}
                    type="submit"
                  >
                    Accepter l&apos;invitation
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {showDeclarablePaymentAction && firstDeclarablePayment ? (
              <div id="declare-rent-paid">
                <ActionCard
                  title="Declarer mon loyer comme paye"
                  description="Si vous avez paye ce loyer hors RentFlow, indiquez-le ici. Le proprietaire devra ensuite confirmer la reception."
                  value={formatMoney(
                    firstDeclarablePayment.amountInCents,
                    firstDeclarablePayment.currency,
                  )}
                  tone="warning"
                >
                  <div className="mb-3 flex flex-wrap gap-2">
                    <StatusBadge tone="info">Paiement externe</StatusBadge>
                    {isPaymentOverdue(firstDeclarablePayment.dueDate) ? (
                      <StatusBadge tone="warning">En retard</StatusBadge>
                    ) : null}
                  </div>
                  <p className="mb-4 text-sm leading-6 text-muted-foreground">
                    Cette action apparait 1 jour avant l&apos;echeance prevue.{" "}
                    Cette declaration ne confirme pas la reception. Votre
                    proprietaire devra la valider.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <form action={declareTenantExternalPaymentPaidAction}>
                      <input
                        name="paymentId"
                        type="hidden"
                        value={firstDeclarablePayment.id}
                      />
                      <input
                        name="declarationType"
                        type="hidden"
                        value="PAID_EXTERNALLY"
                      />
                      <label className="mb-3 flex items-start gap-2 rounded-lg border border-chart-4/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                        <input
                          className="mt-1 size-4 shrink-0 accent-primary"
                          name="confirmPaid"
                          required
                          type="checkbox"
                        />
                        <span>
                          Je confirme avoir paye ce loyer hors RentFlow.
                        </span>
                      </label>
                      <button
                        className={buttonVariants({ size: "sm" })}
                        type="submit"
                      >
                        J&apos;ai paye
                      </button>
                    </form>
                    <form action={declareTenantExternalPaymentNotPaidYetAction}>
                      <input
                        name="paymentId"
                        type="hidden"
                        value={firstDeclarablePayment.id}
                      />
                      <input
                        name="declarationType"
                        type="hidden"
                        value="NOT_PAID_YET"
                      />
                      <button
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                        })}
                        type="submit"
                      >
                        Pas encore
                      </button>
                    </form>
                  </div>
                </ActionCard>
              </div>
            ) : null}

            {showMandateAction && firstMandateToAccept ? (
              <ActionCard
                title="Accepter le mandat mock"
                description="Simulation uniquement : aucun vrai prelevement ne sera effectue."
                tone="warning"
              >
                <form action={acceptMockMandateAction}>
                  <input
                    name="contractTenantId"
                    type="hidden"
                    value={firstMandateToAccept.contractTenant.id}
                  />
                  <button
                    className={buttonVariants({ size: "sm" })}
                    type="submit"
                  >
                    Accepter le mandat mock
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {showReceiptRequestAction && firstReceiptRequestPayment ? (
              <ActionCard
                title="Demander une quittance"
                description="Une quittance peut etre demandee pour un paiement de loyer confirme."
                value={formatMoney(
                  firstReceiptRequestPayment.payment.amountInCents,
                  firstReceiptRequestPayment.payment.currency,
                )}
                tone="success"
              >
                <form action={requestTenantRentReceiptAction}>
                  <input
                    name="paymentId"
                    type="hidden"
                    value={firstReceiptRequestPayment.payment.id}
                  />
                  <button
                    className={buttonVariants({ size: "sm" })}
                    type="submit"
                  >
                    Demander une quittance
                  </button>
                </form>
              </ActionCard>
            ) : null}

            {showAvailableReceiptAction && firstAvailableReceipt ? (
              <ActionCard
                title="Quittance disponible"
                description="Votre PDF est accessible depuis RentFlow. Marquez cette quittance comme vue pour la retirer des actions urgentes."
                value={formatMoney(
                  firstAvailableReceipt.totalAmountInCents,
                  firstAvailableReceipt.currency,
                )}
                tone="success"
              >
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={buttonVariants({ size: "sm" })}
                    href={`/receipts/${firstAvailableReceipt.id}/pdf`}
                  >
                    Ouvrir le PDF
                  </Link>
                  <form action={markTenantReceiptAsSeenAction}>
                    <input
                      name="receiptId"
                      type="hidden"
                      value={firstAvailableReceipt.id}
                    />
                    <button
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      type="submit"
                    >
                      Marquer comme vue
                    </button>
                  </form>
                </div>
              </ActionCard>
            ) : null}

            {showMockPaymentAction && firstMockPayablePayment ? (
              <ActionCard
                title="Paiement mock disponible"
                description="Paiement via RentFlow optionnel, en simulation uniquement."
                value={formatMoney(
                  firstMockPayablePayment.payment.amountInCents,
                  firstMockPayablePayment.payment.currency,
                )}
                tone="default"
              >
                <form action={payTenantPaymentWithMockProviderAction}>
                  <input
                    name="paymentId"
                    type="hidden"
                    value={firstMockPayablePayment.payment.id}
                  />
                  <button
                    className={buttonVariants({ size: "sm" })}
                    type="submit"
                  >
                    Payer avec le mandat mock
                  </button>
                </form>
              </ActionCard>
            ) : null}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Mon mois"
          description="Un apercu simple de votre situation actuelle."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Locations actives"
            value={stats.activeContractTenants}
            hint="Rattachements locataire"
          />
          <StatCard
            label="Paiements du mois"
            value={stats.currentMonthPayments}
            hint={`${stats.currentMonthSucceededPayments} reussi(s), ${stats.currentMonthFailedPayments} echoue(s)`}
          />
          <StatCard
            label="Paye ce mois"
            value={formatMoney(stats.paidAmountInCents)}
            hint="Paiements confirmes"
          />
          <StatCard
            label="Quittances"
            value={stats.availableReceipts}
            hint={`${stats.pendingInvitations} invitation(s) en attente`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Invitations recues"
          description="Les invitations envoyees a votre email par un proprietaire."
        />
        {receivedInvitations.length === 0 ? (
          <EmptyState
            title="Aucune invitation en attente"
            description="Votre logement apparaitra ici des qu'un proprietaire vous aura invite ou rattache a un contrat."
          />
        ) : (
          <div className="grid gap-4">
            {receivedInvitations.map((invitation) => (
              <SpotlightCard key={invitation.id} tone="info">
                <article className="rounded-xl border border-ring/45 bg-ring/12 p-5 text-card-foreground shadow-sm shadow-black/10">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold tracking-normal text-foreground">
                          {invitation.property.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {invitation.property.city} - invite par{" "}
                          {getOwnerDisplayName(invitation)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Expire le {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="info">Invitation recue</StatusBadge>
                        <StatusBadge
                          tone={getStatusTone(invitation.rentalContract.status)}
                        >
                          {labelFor(
                            rentalContractStatusLabels,
                            invitation.rentalContract.status,
                          )}
                        </StatusBadge>
                        <StatusBadge tone="muted">
                          {labelFor(
                            contractTypeLabels,
                            invitation.rentalContract.contractType,
                          )}
                        </StatusBadge>
                      </div>
                      <InfoAlert
                        title="Verifiez ces informations avant d'accepter l'invitation."
                        tone="info"
                      >
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-muted-foreground">Loyer</dt>
                            <dd className="font-medium text-foreground">
                              {formatMoney(
                                invitation.rentalContract
                                  .totalRentAmountInCents,
                                invitation.rentalContract.currency,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Charges</dt>
                            <dd className="font-medium text-foreground">
                              {formatMoney(
                                invitation.rentalContract
                                  .totalChargesAmountInCents,
                                invitation.rentalContract.currency,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Total mensuel
                            </dt>
                            <dd className="font-medium text-foreground">
                              {formatMoney(
                                invitation.rentalContract
                                  .totalRentAmountInCents +
                                  invitation.rentalContract
                                    .totalChargesAmountInCents,
                                invitation.rentalContract.currency,
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Jour de paiement
                            </dt>
                            <dd className="font-medium text-foreground">
                              Jour {invitation.rentalContract.paymentDayOfMonth}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Date de debut
                            </dt>
                            <dd className="font-medium text-foreground">
                              {formatDate(invitation.rentalContract.startDate)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">
                              Date de fin
                            </dt>
                            <dd className="font-medium text-foreground">
                              {formatOptionalDate(
                                invitation.rentalContract.endDate,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </InfoAlert>
                    </div>

                    <form
                      action={acceptTenantDashboardInvitationAction}
                      className="min-w-0 space-y-3 lg:max-w-xs"
                    >
                      <input
                        name="invitationId"
                        type="hidden"
                        value={invitation.id}
                      />
                      <label className="flex items-start gap-2 rounded-lg border border-ring/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                        <input
                          className="mt-1 size-4 shrink-0 accent-primary"
                          name="confirmAccept"
                          required
                          type="checkbox"
                        />
                        <span>
                          Je confirme vouloir rejoindre ce logement avec mon
                          compte locataire.
                        </span>
                      </label>
                      <button className={buttonVariants()} type="submit">
                        Accepter l&apos;invitation
                      </button>
                    </form>
                  </div>
                </article>
              </SpotlightCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Mon logement"
          description="Vos locations rattachees a votre profil locataire."
        />

        {contractTenantsWithMandateState.length === 0 ? (
          <EmptyState
            title="Votre espace locataire est pret."
            description="Vous verrez votre logement ici des qu'un proprietaire vous aura invite ou rattache a un contrat."
          />
        ) : (
          <div className="grid gap-4">
            {contractTenantsWithMandateState.map(
              ({
                canAcceptMockMandate,
                contractTenant,
                hasAcceptedMandate,
                latestMandate,
              }) => {
                const property = contractTenant.rentalContract.property;
                const contract = contractTenant.rentalContract;
                const hasTerminationRequest =
                  contractTenant.status === "TERMINATION_REQUESTED";

                return (
                  <article
                    className="rounded-xl border border-primary/35 bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/20"
                    key={contractTenant.id}
                  >
                    <TenantPropertyImage
                      imageUrl={property.imageUrl}
                      name={property.name}
                    />
                    <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold tracking-normal text-foreground">
                            {property.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {property.city} -{" "}
                            {labelFor(
                              propertyTypeLabels,
                              property.propertyType,
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge
                            tone={getStatusTone(contractTenant.status)}
                          >
                            {labelFor(
                              contractTenantStatusLabels,
                              contractTenant.status,
                            )}
                          </StatusBadge>
                          <StatusBadge tone={getStatusTone(contract.status)}>
                            {labelFor(
                              rentalContractStatusLabels,
                              contract.status,
                            )}
                          </StatusBadge>
                          <StatusBadge tone="muted">
                            {property.isColocation
                              ? "Colocation"
                              : "Hors colocation"}
                          </StatusBadge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground lg:text-right">
                        <p>
                          Paiement le{" "}
                          <span className="font-medium text-foreground">
                            {contract.paymentDayOfMonth}
                          </span>
                        </p>
                        <p>
                          Chambre{" "}
                          <span className="font-medium text-foreground">
                            {contractTenant.roomLabel ?? "Non renseignee"}
                          </span>
                        </p>
                        <Link
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className: "mt-3",
                          })}
                          href={`/tenant/contracts/${contract.id}`}
                        >
                          Voir le contrat
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        label="Loyer"
                        value={formatMoney(
                          contractTenant.rentShareAmountInCents,
                          contractTenant.currency,
                        )}
                        hint="Part mensuelle"
                      />
                      <StatCard
                        label="Charges"
                        value={formatMoney(
                          contractTenant.chargesShareAmountInCents,
                          contractTenant.currency,
                        )}
                        hint="Part mensuelle"
                      />
                      <StatCard
                        label="Depot"
                        value={formatMoney(
                          contractTenant.depositShareAmountInCents,
                          contractTenant.currency,
                        )}
                        hint="Depot de garantie"
                      />
                      <StatCard
                        label="Mandat"
                        value={
                          latestMandate
                            ? labelFor(
                                mandateStatusLabels,
                                latestMandate.status,
                              )
                            : "Aucun"
                        }
                        hint={
                          latestMandate
                            ? latestMandate.provider
                            : "Paiement externe possible"
                        }
                      />
                    </div>

                    <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">
                          Type de contrat
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {labelFor(contractTypeLabels, contract.contractType)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Date de debut</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {formatDate(contractTenant.startDate)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Date de fin</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {formatOptionalDate(contractTenant.endDate)}
                        </dd>
                      </div>
                    </dl>

                    {contract.status === "DRAFT" ? (
                      <InfoAlert
                        className="mt-5"
                        title="Contrat en brouillon"
                        tone="info"
                      >
                        <p>
                          Ce contrat est rattache a votre profil, mais il reste
                          en brouillon pour le moment.
                        </p>
                      </InfoAlert>
                    ) : null}

                    {hasTerminationRequest ? (
                      <InfoAlert
                        className="mt-5"
                        title="Demande de fin envoyee"
                        tone="warning"
                      >
                        <p>
                          Votre proprietaire doit encore traiter cette demande.
                          Le contrat n&apos;est pas resilie automatiquement.
                        </p>
                      </InfoAlert>
                    ) : null}

                    {contractTenant.status === "TERMINATED" ? (
                      <InfoAlert
                        className="mt-5"
                        title="Contrat termine"
                        tone="info"
                      >
                        <p>
                          Votre proprietaire a mis fin au contrat.
                          L&apos;historique reste consultable.
                        </p>
                      </InfoAlert>
                    ) : null}

                    {contractTenant.status === "ACTIVE" ? (
                      <div
                        id={
                          contractTenant.id === terminationQuickRental?.id
                            ? "tenant-contract-termination"
                            : undefined
                        }
                      >
                        <InfoAlert
                          className="mt-5"
                          title="Demander la fin du contrat"
                          tone="warning"
                        >
                          <p>
                            Cette demande ne met pas fin automatiquement au
                            contrat. Votre proprietaire devra la traiter.
                          </p>
                          <form
                            action={requestTenantContractTerminationAction}
                            className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end"
                          >
                            <input
                              name="contractTenantId"
                              type="hidden"
                              value={contractTenant.id}
                            />
                            <label className="grid gap-2 text-sm text-muted-foreground">
                              <span>
                                Tapez DEMANDER LA FIN pour confirmer cette
                                demande.
                              </span>
                              <input
                                autoComplete="off"
                                className="min-h-10 rounded-md border border-chart-4/45 bg-background px-3 text-sm font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chart-4 focus:ring-2 focus:ring-chart-4/20"
                                name="confirmation"
                                placeholder="DEMANDER LA FIN"
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
                              Demander la fin du contrat
                            </button>
                          </form>
                        </InfoAlert>
                      </div>
                    ) : null}

                    <InfoAlert
                      className="mt-5"
                      title="Mandat mock"
                      tone={hasAcceptedMandate ? "success" : "info"}
                    >
                      <p>
                        Aucun vrai prelevement ne sera effectue et aucun IBAN
                        complet ne sera stocke.
                      </p>

                      {hasAcceptedMandate ? (
                        <p className="mt-2 font-medium text-foreground">
                          Mandat mock accepte
                          {latestMandate?.acceptedAt
                            ? ` le ${formatDate(latestMandate.acceptedAt)}`
                            : ""}
                          .
                        </p>
                      ) : null}

                      {canAcceptMockMandate ? (
                        <form action={acceptMockMandateAction} className="mt-3">
                          <input
                            name="contractTenantId"
                            type="hidden"
                            value={contractTenant.id}
                          />
                          <button
                            className={buttonVariants({ size: "sm" })}
                            type="submit"
                          >
                            Accepter le mandat mock
                          </button>
                        </form>
                      ) : null}
                    </InfoAlert>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>

      {formerRentals.length > 0 ? (
        <section className="space-y-4">
          <SectionHeader
            title="Mes anciens contrats"
            description="Historique des contrats termines, conserve en lecture."
          />
          <InfoAlert
            title="Votre proprietaire a mis fin au contrat."
            tone="info"
          >
            <p>
              Ces logements ne sont plus affiches comme des locations actives.
              L&apos;historique reste consultable.
            </p>
          </InfoAlert>
          <div className="grid gap-4">
            {formerRentals.map((contractTenant) => {
              const property = contractTenant.rentalContract.property;
              const contract = contractTenant.rentalContract;

              return (
                <article
                  className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/55 hover:shadow-xl hover:shadow-black/20"
                  key={contractTenant.id}
                >
                  <TenantPropertyImage
                    imageUrl={property.imageUrl}
                    name={property.name}
                  />
                  <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold tracking-normal text-foreground">
                          {property.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {property.city} -{" "}
                          {getOwnerNameFromRental(contractTenant)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone="muted">Contrat termine</StatusBadge>
                        <StatusBadge tone={getStatusTone(contract.status)}>
                          {labelFor(
                            rentalContractStatusLabels,
                            contract.status,
                          )}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground lg:text-right">
                      <p>
                        Debut{" "}
                        <span className="font-medium text-foreground">
                          {formatDate(contractTenant.startDate)}
                        </span>
                      </p>
                      <p>
                        Fin{" "}
                        <span className="font-medium text-foreground">
                          {formatOptionalDate(contractTenant.endDate)}
                        </span>
                      </p>
                      <Link
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "mt-3",
                        })}
                        href={`/tenant/contracts/${contract.id}`}
                      >
                        Voir l&apos;historique du contrat
                      </Link>
                    </div>
                  </div>

                  <InfoAlert
                    className="mt-5"
                    title="Votre proprietaire a mis fin au contrat."
                    tone="info"
                  >
                    <p>L&apos;historique reste consultable.</p>
                  </InfoAlert>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Paiements recents"
          description="Vos derniers paiements, declarations et actions disponibles."
        />
        {paymentsWithState.length === 0 ? (
          <EmptyState
            title="Aucun paiement recent"
            description="Vos paiements attendus apparaitront ici lorsqu'ils seront crees."
          />
        ) : (
          <div className="grid gap-4">
            {paymentsWithState.map(
              ({
                canDeclarePayment,
                canPayWithMock,
                latestExternalPaymentDeclaration,
                payment,
                receiptRequestState,
              }) => (
                <SpotlightCard
                  key={payment.id}
                  tone={getSpotlightToneForStatus(payment.status)}
                >
                  <article className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-ring/55 hover:shadow-xl hover:shadow-black/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold tracking-normal text-foreground">
                            {payment.property.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {labelFor(paymentTypeLabels, payment.type)} -
                            echeance {formatDate(payment.dueDate)}
                            {payment.paidAt
                              ? ` - Paye le ${formatDate(payment.paidAt)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={getStatusTone(payment.status)}>
                            {labelFor(paymentStatusLabels, payment.status)}
                          </StatusBadge>
                          {payment.status === "SUCCEEDED" ? (
                            <StatusBadge tone="success">
                              Confirme par le proprietaire
                            </StatusBadge>
                          ) : null}
                          {latestExternalPaymentDeclaration?.declarationType ===
                          "PAID_EXTERNALLY" ? (
                            <StatusBadge tone="warning">
                              Declare paye
                            </StatusBadge>
                          ) : null}
                          {canDeclarePayment ? (
                            <StatusBadge
                              tone={
                                isPaymentOverdue(payment.dueDate)
                                  ? "danger"
                                  : "info"
                              }
                            >
                              {isPaymentOverdue(payment.dueDate)
                                ? "En retard"
                                : "A payer"}
                            </StatusBadge>
                          ) : null}
                          {receiptRequestState.hasRequestedReceipt ? (
                            <StatusBadge tone="warning">
                              Quittance demandee
                            </StatusBadge>
                          ) : null}
                          {receiptRequestState.hasGeneratedReceipt ? (
                            <StatusBadge tone="success">
                              Quittance disponible
                            </StatusBadge>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-xl font-semibold tracking-normal text-foreground">
                        {formatMoney(payment.amountInCents, payment.currency)}
                      </p>
                    </div>

                    {latestExternalPaymentDeclaration ? (
                      <InfoAlert
                        className="mt-5"
                        title={
                          latestExternalPaymentDeclaration.declarationType ===
                          "NOT_PAID_YET"
                            ? "Vous avez indique ne pas avoir encore paye."
                            : "Declare paye - en attente de confirmation proprietaire."
                        }
                        tone={
                          latestExternalPaymentDeclaration.declarationType ===
                          "NOT_PAID_YET"
                            ? "info"
                            : "success"
                        }
                      >
                        <p>
                          Declare le{" "}
                          {formatDate(
                            latestExternalPaymentDeclaration.declaredAt,
                          )}
                          .{" "}
                          {latestExternalPaymentDeclaration.declarationType ===
                          "NOT_PAID_YET"
                            ? "Ce paiement reste a suivre."
                            : "Votre proprietaire doit encore confirmer la reception."}
                        </p>
                      </InfoAlert>
                    ) : null}

                    {payment.status === "SUCCEEDED" ? (
                      <InfoAlert
                        className="mt-5"
                        title="Confirme par le proprietaire."
                        tone="success"
                      >
                        <p>Ce paiement est confirme comme recu.</p>
                      </InfoAlert>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      {receiptRequestState.canRequestReceipt ? (
                        <form action={requestTenantRentReceiptAction}>
                          <input
                            name="paymentId"
                            type="hidden"
                            value={payment.id}
                          />
                          <button
                            className={buttonVariants({ size: "sm" })}
                            type="submit"
                          >
                            Demander une quittance
                          </button>
                        </form>
                      ) : null}

                      {canDeclarePayment ? (
                        <>
                          <form action={declareTenantExternalPaymentPaidAction}>
                            <input
                              name="paymentId"
                              type="hidden"
                              value={payment.id}
                            />
                            <input
                              name="declarationType"
                              type="hidden"
                              value="PAID_EXTERNALLY"
                            />
                            <label className="mb-2 flex items-start gap-2 rounded-lg border border-chart-4/35 bg-background/40 p-3 text-sm leading-5 text-muted-foreground">
                              <input
                                className="mt-1 size-4 shrink-0 accent-primary"
                                name="confirmPaid"
                                required
                                type="checkbox"
                              />
                              <span>
                                Je confirme avoir paye ce loyer hors RentFlow.
                              </span>
                            </label>
                            <button
                              className={buttonVariants({ size: "sm" })}
                              type="submit"
                            >
                              J&apos;ai paye
                            </button>
                          </form>
                          <form
                            action={
                              declareTenantExternalPaymentNotPaidYetAction
                            }
                          >
                            <input
                              name="paymentId"
                              type="hidden"
                              value={payment.id}
                            />
                            <input
                              name="declarationType"
                              type="hidden"
                              value="NOT_PAID_YET"
                            />
                            <button
                              className={buttonVariants({
                                variant: "outline",
                                size: "sm",
                              })}
                              type="submit"
                            >
                              Pas encore
                            </button>
                          </form>
                        </>
                      ) : null}

                      {canPayWithMock ? (
                        <form action={payTenantPaymentWithMockProviderAction}>
                          <input
                            name="paymentId"
                            type="hidden"
                            value={payment.id}
                          />
                          <button
                            className={buttonVariants({ size: "sm" })}
                            type="submit"
                          >
                            Payer avec le mandat mock
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {canDeclarePayment ? (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        Ces declarations ne confirment pas la reception reelle
                        du paiement. Votre proprietaire garde la confirmation
                        finale.
                      </p>
                    ) : null}

                    {canPayWithMock ? (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        Paiement via RentFlow optionnel. Simulation uniquement :
                        aucun vrai prelevement ne sera effectue.
                      </p>
                    ) : null}
                  </article>
                </SpotlightCard>
              ),
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader title="Quittances" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <SectionHeader
              title="Demandes en attente"
              description="Demandes envoyees au proprietaire, en attente de generation."
            />
            {requestedReceipts.length === 0 ? (
              <EmptyState
                title="Aucune demande en attente"
                description="Les demandes de quittance envoyees apparaitront ici."
              />
            ) : (
              <div className="grid gap-3">
                {requestedReceipts.map((receipt) => (
                  <SpotlightCard key={receipt.id} tone="warning">
                    <article className="rounded-xl border border-chart-4/35 bg-chart-4/10 p-4 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-chart-4/60 hover:shadow-lg hover:shadow-black/15">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            Demande de quittance
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {receipt.property.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Periode {formatDate(receipt.periodStart)} -{" "}
                            {formatDate(receipt.periodEnd)}
                          </p>
                        </div>
                        <div className="space-y-2 sm:text-right">
                          <p className="font-semibold text-foreground">
                            {formatMoney(
                              receipt.totalAmountInCents,
                              receipt.currency,
                            )}
                          </p>
                          <StatusBadge tone={getStatusTone(receipt.status)}>
                            {labelFor(receiptStatusLabels, receipt.status)}
                          </StatusBadge>
                        </div>
                      </div>
                    </article>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <SectionHeader
              title="Quittances disponibles"
              description="Le PDF est genere a la demande depuis le lien."
            />
            {recentReceipts.length === 0 ? (
              <EmptyState
                title="Aucune quittance disponible"
                description="Les quittances generees par votre proprietaire apparaitront ici."
              />
            ) : (
              <div className="grid gap-3">
                {recentReceipts.map((receipt) => {
                  const filename = buildReceiptPdfFilename({
                    propertyName: receipt.property.name,
                    periodStart: receipt.periodStart,
                    totalAmountInCents: receipt.totalAmountInCents,
                    currency: receipt.currency,
                  });

                  return (
                    <Link
                      className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm shadow-black/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-muted hover:shadow-lg hover:shadow-black/15"
                      href={`/receipts/${receipt.id}/pdf`}
                      key={receipt.id}
                    >
                      <span className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <span>
                          <span className="block font-medium text-foreground">
                            Quittance PDF disponible
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            {filename}
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            Periode {formatDate(receipt.periodStart)} -{" "}
                            {formatDate(receipt.periodEnd)}
                          </span>
                        </span>
                        <span className="space-y-2 sm:text-right">
                          <span className="block font-semibold text-foreground">
                            {formatMoney(
                              receipt.totalAmountInCents,
                              receipt.currency,
                            )}
                          </span>
                          <StatusBadge tone={getStatusTone(receipt.status)}>
                            {labelFor(receiptTypeLabels, receipt.type)} -{" "}
                            {labelFor(receiptStatusLabels, receipt.status)}
                          </StatusBadge>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Actions rapides"
          description="Raccourcis vers les actions locataire utiles sans chercher."
        />
        <div className="flex flex-wrap gap-3">
          {primaryContractRental ? (
            <CompactActionPill
              href={`/tenant/contracts/${primaryContractRental.rentalContract.id}`}
              icon={<FileText className="size-4" />}
              label="Details contrat"
              tone="info"
            />
          ) : null}
          {terminationQuickRental ? (
            <CompactActionPill
              href="#tenant-contract-termination"
              icon={<LogOut className="size-4" />}
              label="Mettre fin a un contrat"
              tone="danger"
            />
          ) : null}
          {firstDeclarablePayment ? (
            <CompactActionPill
              href="#declare-rent-paid"
              icon={<WalletCards className="size-4" />}
              label="Declarer un loyer paye"
              tone="warning"
            />
          ) : null}
          <CompactActionPill
            href="/tenant/requests"
            icon={<MessageSquare className="size-4" />}
            label="Demande proprietaire"
            tone="success"
          />
        </div>
      </section>

      <InfoAlert title="Besoin d'aide ?" tone="info">
        <p>
          Une question sur votre logement ou votre paiement ? Contactez votre
          proprietaire. RentFlow garde ici vos informations utiles et les
          actions disponibles.
        </p>
      </InfoAlert>
    </section>
  );
}
