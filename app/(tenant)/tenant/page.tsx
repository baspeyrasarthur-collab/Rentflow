import { TenantDashboardView } from "@/components/tenant/tenant-dashboard-view";
import { InfoAlert, PageHeader } from "@/components/ui/rentflow";
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
  const firstDeclarablePayment = externalPaymentsToDeclare[0] ?? null;
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
  ]
    .filter((action): action is string => action !== null)
    .slice(0, 4);
  const primaryContractRental =
    currentRentals.find((rental) => rental.status === "ACTIVE") ??
    currentRentals[0] ??
    null;
  const terminationQuickRental =
    currentRentals.find((rental) => rental.status === "ACTIVE") ?? null;

  return (
    <TenantDashboardView
      contractTenantsWithMandateState={contractTenantsWithMandateState}
      firstAvailableReceipt={firstAvailableReceipt}
      firstDeclarablePayment={firstDeclarablePayment}
      firstReceivedInvitation={firstReceivedInvitation}
      firstReceiptRequestPayment={firstReceiptRequestPayment ?? null}
      firstRefusedTenantRequest={firstRefusedTenantRequest}
      firstResolvedTenantRequest={firstResolvedTenantRequest}
      formerRentals={formerRentals}
      paymentsWithState={paymentsWithState}
      primaryContractRental={primaryContractRental}
      priorityActions={priorityActions}
      receivedInvitations={receivedInvitations}
      recentReceipts={recentReceipts}
      requestedReceipts={requestedReceipts}
      serverActions={{
        acceptInvitation: acceptTenantDashboardInvitationAction,
        acceptMockMandate: acceptMockMandateAction,
        acknowledgeRefusedTenantRequest: acknowledgeRefusedTenantRequestAction,
        acknowledgeResolvedTenantRequest:
          acknowledgeResolvedTenantRequestAction,
        declareExternalPaymentNotPaidYet:
          declareTenantExternalPaymentNotPaidYetAction,
        declareExternalPaymentPaid: declareTenantExternalPaymentPaidAction,
        markReceiptAsSeen: markTenantReceiptAsSeenAction,
        payWithMockProvider: payTenantPaymentWithMockProviderAction,
        requestContractTermination: requestTenantContractTerminationAction,
        requestRentReceipt: requestTenantRentReceiptAction,
      }}
      stats={stats}
      terminationQuickRental={terminationQuickRental}
    />
  );
}
