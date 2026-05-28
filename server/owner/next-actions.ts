import { prisma } from "@/server/db/prisma";
import {
  getMissingRequiredPropertyFields,
  getMissingSecondaryPropertyFields,
} from "@/server/owner/property-completeness";
import { getCurrentOwnerProfileForProperties } from "@/server/owner/properties";
import { getOwnerTenantRequestPrimaryHref } from "@/server/owner/tenant-request-routing";

export type OwnerNextActionStatus = "TODO" | "PARTIAL";

export type OwnerNextActionTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger";

export type OwnerNextActionType =
  | "PROPERTY_INCOMPLETE"
  | "CONTRACT_DRAFT"
  | "TENANT_TO_INVITE"
  | "CONTRACT_TERMINATION_REQUESTED"
  | "TENANT_REQUEST_OPEN"
  | "PAYMENT_DECLARED_PAID"
  | "PAYMENT_OVERDUE"
  | "RECEIPT_REQUESTED";

export type OwnerNextAction = {
  id: string;
  type: OwnerNextActionType;
  title: string;
  description: string;
  href: string;
  status: OwnerNextActionStatus;
  priority: number;
  tone: OwnerNextActionTone;
  relatedEntityType:
    | "Property"
    | "RentalContract"
    | "ContractTenant"
    | "TenantRequest"
    | "Payment"
    | "Receipt";
  relatedEntityId: string;
};

type SortableOwnerNextAction = OwnerNextAction & {
  sortDate: Date;
};

const OVERDUE_PAYMENT_STATUSES = [
  "PLANNED",
  "PENDING",
  "PROCESSING",
  "FAILED",
  "DISPUTED",
] as const;

const TENANT_INVITE_CONTRACT_STATUSES = ["DRAFT"] as const;

function getStartOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function sortOwnerNextActions(
  first: SortableOwnerNextAction,
  second: SortableOwnerNextAction,
) {
  if (first.priority !== second.priority) {
    return second.priority - first.priority;
  }

  return first.sortDate.getTime() - second.sortDate.getTime();
}

function isFilledText(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function withoutSortDate(action: SortableOwnerNextAction): OwnerNextAction {
  return {
    id: action.id,
    type: action.type,
    title: action.title,
    description: action.description,
    href: action.href,
    status: action.status,
    priority: action.priority,
    tone: action.tone,
    relatedEntityType: action.relatedEntityType,
    relatedEntityId: action.relatedEntityId,
  };
}

function isDraftContractComplete(contract: {
  contractType: string;
  startDate: Date;
  totalRentAmountInCents: number;
  totalChargesAmountInCents: number;
  depositAmountInCents: number;
  currency: string;
  paymentDayOfMonth: number;
}) {
  return (
    isFilledText(contract.contractType) &&
    contract.startDate instanceof Date &&
    contract.totalRentAmountInCents > 0 &&
    contract.totalChargesAmountInCents >= 0 &&
    contract.depositAmountInCents >= 0 &&
    isFilledText(contract.currency) &&
    contract.paymentDayOfMonth >= 1 &&
    contract.paymentDayOfMonth <= 28
  );
}

export async function getOwnerNextActions() {
  const { ownerProfile } = await getCurrentOwnerProfileForProperties();
  const ownerFilter = { ownerProfileId: ownerProfile.id };
  const today = getStartOfToday();

  const [
    draftProperties,
    draftContracts,
    contractsWithoutActiveTenant,
    terminationRequestedContractTenants,
    openTenantRequests,
    declaredExternalRentPayments,
    overdueExternalRentPayments,
    requestedReceipts,
  ] = await Promise.all([
    prisma.property.findMany({
      where: {
        ...ownerFilter,
        status: "DRAFT",
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        name: true,
        addressLine1: true,
        postalCode: true,
        city: true,
        country: true,
        propertyType: true,
        surfaceAreaSqm: true,
        updatedAt: true,
      },
    }),
    prisma.rentalContract.findMany({
      where: {
        ...ownerFilter,
        status: "DRAFT",
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        propertyId: true,
        contractType: true,
        startDate: true,
        totalRentAmountInCents: true,
        totalChargesAmountInCents: true,
        depositAmountInCents: true,
        currency: true,
        paymentDayOfMonth: true,
        updatedAt: true,
      },
    }),
    prisma.rentalContract.findMany({
      where: {
        ...ownerFilter,
        status: {
          in: [...TENANT_INVITE_CONTRACT_STATUSES],
        },
        contractTenants: {
          none: {
            status: "ACTIVE",
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        propertyId: true,
        invitations: {
          where: {
            status: "SENT",
            expiresAt: {
              gte: today,
            },
          },
          take: 1,
          select: {
            id: true,
            createdAt: true,
          },
        },
        updatedAt: true,
      },
    }),
    prisma.contractTenant.findMany({
      where: {
        status: "TERMINATION_REQUESTED",
        rentalContract: {
          ownerProfileId: ownerProfile.id,
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        updatedAt: true,
        rentalContract: {
          select: {
            id: true,
            propertyId: true,
          },
        },
      },
    }),
    prisma.tenantRequest.findMany({
      where: {
        ownerProfileId: ownerProfile.id,
        status: "OPEN",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        ...ownerFilter,
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: {
          notIn: ["SUCCEEDED", "CANCELED", "REFUNDED"],
        },
        declarations: {
          some: {
            declarationType: "PAID_EXTERNALLY",
          },
        },
      },
      orderBy: {
        updatedAt: "asc",
      },
      select: {
        id: true,
        propertyId: true,
        rentalContractId: true,
        updatedAt: true,
        declarations: {
          orderBy: [
            {
              declaredAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 1,
          select: {
            declarationType: true,
            declaredAt: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        ...ownerFilter,
        provider: null,
        providerPaymentId: null,
        type: "RENT",
        status: {
          in: [...OVERDUE_PAYMENT_STATUSES],
        },
        dueDate: {
          lt: today,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      select: {
        id: true,
        dueDate: true,
        declarations: {
          orderBy: [
            {
              declaredAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          take: 1,
          select: {
            declarationType: true,
          },
        },
      },
    }),
    prisma.receipt.findMany({
      where: {
        ...ownerFilter,
        status: "REQUESTED",
      },
      orderBy: {
        requestedAt: "asc",
      },
      select: {
        id: true,
        propertyId: true,
        rentalContractId: true,
        requestedAt: true,
      },
    }),
  ]);

  const actions: SortableOwnerNextAction[] = [
    ...draftProperties.flatMap<SortableOwnerNextAction>((property) => {
      const missingRequiredFields = getMissingRequiredPropertyFields(property);
      const missingSecondaryFields =
        getMissingSecondaryPropertyFields(property);

      if (missingRequiredFields.length > 0) {
        return [
          {
            id: `property-incomplete-${property.id}`,
            type: "PROPERTY_INCOMPLETE" as const,
            title: "Logement a completer",
            description:
              "Certaines informations obligatoires du logement doivent etre renseignees.",
            href: `/owner/properties/${property.id}/edit?focus=missing-fields`,
            status: "TODO" as const,
            priority: 40,
            tone: "warning" as const,
            relatedEntityType: "Property" as const,
            relatedEntityId: property.id,
            sortDate: property.updatedAt,
          },
        ];
      }

      if (missingSecondaryFields.length > 0) {
        return [
          {
            id: `property-incomplete-${property.id}`,
            type: "PROPERTY_INCOMPLETE" as const,
            title: "Caracteristiques a verifier",
            description:
              "Les informations principales sont presentes ; verifiez les caracteristiques du logement.",
            href: `/owner/properties/${property.id}/edit?focus=characteristics`,
            status: "PARTIAL" as const,
            priority: 40,
            tone: "warning" as const,
            relatedEntityType: "Property" as const,
            relatedEntityId: property.id,
            sortDate: property.updatedAt,
          },
        ];
      }

      return [];
    }),
    ...draftContracts.flatMap<SortableOwnerNextAction>((contract) => {
      if (isDraftContractComplete(contract)) {
        return [];
      }

      return [
        {
          id: `contract-draft-${contract.id}`,
          type: "CONTRACT_DRAFT" as const,
          title: "Contrat a completer",
          description:
            "Un contrat est en brouillon et ses informations necessaires doivent etre finalisees.",
          href: `/owner/properties/${contract.propertyId}/contracts/${contract.id}/edit?focus=required-fields`,
          status: "PARTIAL" as const,
          priority: 50,
          tone: "warning" as const,
          relatedEntityType: "RentalContract" as const,
          relatedEntityId: contract.id,
          sortDate: contract.updatedAt,
        },
      ];
    }),
    ...contractsWithoutActiveTenant.map((contract) => {
      const activeInvitation = contract.invitations[0] ?? null;

      return {
        id: activeInvitation
          ? `tenant-invitation-pending-${contract.id}`
          : `tenant-to-invite-${contract.id}`,
        type: "TENANT_TO_INVITE" as const,
        title: activeInvitation
          ? "Invitation en attente"
          : "Locataire a inviter",
        description: activeInvitation
          ? "Une invitation est deja envoyee ; le rattachement sera termine quand le locataire l'aura acceptee."
          : "Invitez un locataire pour rattacher le contrat et poursuivre le suivi.",
        href: activeInvitation
          ? `/owner/properties/${contract.propertyId}/contracts/${contract.id}`
          : `/owner/properties/${contract.propertyId}/contracts/${contract.id}/invitations/new`,
        status: activeInvitation ? ("PARTIAL" as const) : ("TODO" as const),
        priority: 60,
        tone: "info" as const,
        relatedEntityType: "RentalContract" as const,
        relatedEntityId: contract.id,
        sortDate: activeInvitation?.createdAt ?? contract.updatedAt,
      };
    }),
    ...terminationRequestedContractTenants.map((contractTenant) => ({
      id: `contract-termination-requested-${contractTenant.id}`,
      type: "CONTRACT_TERMINATION_REQUESTED" as const,
      title: "Demande de fin de contrat",
      description: "Un locataire souhaite mettre fin a son contrat.",
      href: `/owner/properties/${contractTenant.rentalContract.propertyId}/contracts/${contractTenant.rentalContract.id}?focus=tenant-${contractTenant.id}`,
      status: "TODO" as const,
      priority: 95,
      tone: "warning" as const,
      relatedEntityType: "ContractTenant" as const,
      relatedEntityId: contractTenant.id,
      sortDate: contractTenant.updatedAt,
    })),
    ...openTenantRequests.map((tenantRequest) => ({
      id: `tenant-request-open-${tenantRequest.id}`,
      type: "TENANT_REQUEST_OPEN" as const,
      title: "Nouvelle demande de votre locataire !",
      description:
        tenantRequest.title || "Un locataire a envoye une demande a traiter.",
      href: getOwnerTenantRequestPrimaryHref(tenantRequest.id),
      status: "TODO" as const,
      priority: 110,
      tone: "warning" as const,
      relatedEntityType: "TenantRequest" as const,
      relatedEntityId: tenantRequest.id,
      sortDate: tenantRequest.createdAt,
    })),
    ...declaredExternalRentPayments.flatMap((payment) => {
      const latestDeclaration = payment.declarations[0] ?? null;

      if (latestDeclaration?.declarationType !== "PAID_EXTERNALLY") {
        return [];
      }

      return [
        {
          id: `payment-declared-paid-${payment.id}`,
          type: "PAYMENT_DECLARED_PAID" as const,
          title: "Loyer declare paye",
          description:
            "Un locataire indique avoir paye. Confirmez uniquement apres reception reelle.",
          href: `/owner/properties/${payment.propertyId}/contracts/${payment.rentalContractId}?focus=payment-${payment.id}`,
          status: "PARTIAL" as const,
          priority: 100,
          tone: "warning" as const,
          relatedEntityType: "Payment" as const,
          relatedEntityId: payment.id,
          sortDate: latestDeclaration.declaredAt,
        },
      ];
    }),
    ...overdueExternalRentPayments.flatMap((payment) => {
      if (payment.declarations[0]?.declarationType === "PAID_EXTERNALLY") {
        return [];
      }

      return [
        {
          id: `payment-overdue-${payment.id}`,
          type: "PAYMENT_OVERDUE" as const,
          title: "Paiement a surveiller",
          description: "Un loyer attendu n'est pas encore confirme comme recu.",
          href: `/owner/payments?focus=payment-${payment.id}`,
          status: "TODO" as const,
          priority: 80,
          tone: "danger" as const,
          relatedEntityType: "Payment" as const,
          relatedEntityId: payment.id,
          sortDate: payment.dueDate,
        },
      ];
    }),
    ...requestedReceipts.map((receipt) => ({
      id: `receipt-requested-${receipt.id}`,
      type: "RECEIPT_REQUESTED" as const,
      title: "Quittance demandee",
      description: "Un locataire attend une quittance a generer.",
      href: `/owner/properties/${receipt.propertyId}/contracts/${receipt.rentalContractId}?focus=receipt-${receipt.id}`,
      status: "TODO" as const,
      priority: 90,
      tone: "info" as const,
      relatedEntityType: "Receipt" as const,
      relatedEntityId: receipt.id,
      sortDate: receipt.requestedAt,
    })),
  ];

  return actions.sort(sortOwnerNextActions).map(withoutSortDate);
}
