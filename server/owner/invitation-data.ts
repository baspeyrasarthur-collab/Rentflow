import type { OwnerTenantInvitationCreateInput } from "@/server/validation";

type IndividualInvitationContract = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  totalRentAmountInCents: number;
  totalChargesAmountInCents: number;
  depositAmountInCents: number;
  currency: string;
};

type InvitedContractTenantData = {
  rentalContractId: string;
  tenantProfileId: null;
  invitedEmail: string;
  invitedFirstName: string;
  invitedLastName: string;
  rentShareAmountInCents: number;
  chargesShareAmountInCents: number;
  depositShareAmountInCents: number;
  currency: string;
  startDate: Date;
  endDate: Date | null;
  status: "INVITED";
};

type SentInvitationData = {
  ownerProfileId: string;
  propertyId: string;
  rentalContractId: string;
  contractTenantId: string;
  tenantEmail: string;
  tenantFirstName: string;
  tenantLastName: string;
  tokenHash: string;
  status: "SENT";
  expiresAt: Date;
};

type InvitationEmailInput = {
  tenantEmail: string;
  tenantFirstName: string;
  acceptUrl: string;
};

export function buildInvitedContractTenantData(
  input: OwnerTenantInvitationCreateInput,
  contract: IndividualInvitationContract,
): InvitedContractTenantData {
  return {
    rentalContractId: contract.id,
    tenantProfileId: null,
    invitedEmail: input.tenantEmail,
    invitedFirstName: input.tenantFirstName,
    invitedLastName: input.tenantLastName,
    rentShareAmountInCents: contract.totalRentAmountInCents,
    chargesShareAmountInCents: contract.totalChargesAmountInCents,
    depositShareAmountInCents: contract.depositAmountInCents,
    currency: contract.currency,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: "INVITED",
  };
}

export function buildSentInvitationData(
  input: OwnerTenantInvitationCreateInput,
  params: {
    ownerProfileId: string;
    propertyId: string;
    rentalContractId: string;
    contractTenantId: string;
    tokenHash: string;
    expiresAt: Date;
  },
): SentInvitationData {
  return {
    ownerProfileId: params.ownerProfileId,
    propertyId: params.propertyId,
    rentalContractId: params.rentalContractId,
    contractTenantId: params.contractTenantId,
    tenantEmail: input.tenantEmail,
    tenantFirstName: input.tenantFirstName,
    tenantLastName: input.tenantLastName,
    tokenHash: params.tokenHash,
    status: "SENT",
    expiresAt: params.expiresAt,
  };
}

export function isActiveTenantInvitation(
  invitation: { status: string; expiresAt: Date },
  referenceDate = new Date(),
) {
  return invitation.status === "SENT" && invitation.expiresAt >= referenceDate;
}

export function buildTenantInvitationEmail(input: InvitationEmailInput) {
  return {
    to: input.tenantEmail,
    subject: "Invitation RentFlow",
    text: `Bonjour ${input.tenantFirstName}, vous avez ete invite a rejoindre une location sur RentFlow. Ouvrez ce lien pour accepter l'invitation : ${input.acceptUrl}`,
    html: `<p>Bonjour ${input.tenantFirstName},</p><p>Vous avez ete invite a rejoindre une location sur RentFlow.</p><p><a href="${input.acceptUrl}">Accepter l'invitation</a></p>`,
  };
}
