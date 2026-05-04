import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

const dates = {
  now: new Date("2026-05-01T10:00:00.000Z"),
  leaseStart: new Date("2026-05-01T00:00:00.000Z"),
  periodStart: new Date("2026-05-01T00:00:00.000Z"),
  periodEnd: new Date("2026-05-31T23:59:59.000Z"),
  dueDate: new Date("2026-05-05T00:00:00.000Z"),
  paidAt: new Date("2026-05-05T09:30:00.000Z"),
  expiresAt: new Date("2026-06-01T00:00:00.000Z"),
};

async function seedUsers() {
  const admin = await prisma.user.upsert({
    where: { clerkUserId: "clerk_seed_admin" },
    update: {
      email: "admin@rentflow.test",
      firstName: "Admin",
      lastName: "RentFlow",
      role: "ADMIN",
      emailVerifiedAt: dates.now,
      disabledAt: null,
    },
    create: {
      id: "seed_user_admin",
      clerkUserId: "clerk_seed_admin",
      email: "admin@rentflow.test",
      firstName: "Admin",
      lastName: "RentFlow",
      role: "ADMIN",
      emailVerifiedAt: dates.now,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { clerkUserId: "clerk_seed_owner" },
    update: {
      email: "owner@rentflow.test",
      firstName: "Alice",
      lastName: "Martin",
      role: "OWNER",
      emailVerifiedAt: dates.now,
      disabledAt: null,
    },
    create: {
      id: "seed_user_owner",
      clerkUserId: "clerk_seed_owner",
      email: "owner@rentflow.test",
      firstName: "Alice",
      lastName: "Martin",
      role: "OWNER",
      emailVerifiedAt: dates.now,
    },
  });

  const tenantOneUser = await prisma.user.upsert({
    where: { clerkUserId: "clerk_seed_tenant_one" },
    update: {
      email: "tenant.one@rentflow.test",
      firstName: "Ben",
      lastName: "Durand",
      role: "TENANT",
      emailVerifiedAt: dates.now,
      disabledAt: null,
    },
    create: {
      id: "seed_user_tenant_one",
      clerkUserId: "clerk_seed_tenant_one",
      email: "tenant.one@rentflow.test",
      firstName: "Ben",
      lastName: "Durand",
      role: "TENANT",
      emailVerifiedAt: dates.now,
    },
  });

  const tenantTwoUser = await prisma.user.upsert({
    where: { clerkUserId: "clerk_seed_tenant_two" },
    update: {
      email: "tenant.two@rentflow.test",
      firstName: "Camille",
      lastName: "Moreau",
      role: "TENANT",
      emailVerifiedAt: dates.now,
      disabledAt: null,
    },
    create: {
      id: "seed_user_tenant_two",
      clerkUserId: "clerk_seed_tenant_two",
      email: "tenant.two@rentflow.test",
      firstName: "Camille",
      lastName: "Moreau",
      role: "TENANT",
      emailVerifiedAt: dates.now,
    },
  });

  const ownerProfile = await prisma.ownerProfile.upsert({
    where: { userId: ownerUser.id },
    update: {
      billingName: "Alice Martin",
      billingAddressLine1: "10 rue Exemple",
      billingPostalCode: "75010",
      billingCity: "Paris",
      billingCountry: "FR",
      paymentProviderCustomerId: "mock_customer_owner",
      paymentProviderAccountId: "mock_account_owner",
      identityVerificationStatus: "VERIFIED",
    },
    create: {
      id: "seed_owner_profile",
      userId: ownerUser.id,
      billingName: "Alice Martin",
      billingAddressLine1: "10 rue Exemple",
      billingPostalCode: "75010",
      billingCity: "Paris",
      billingCountry: "FR",
      paymentProviderCustomerId: "mock_customer_owner",
      paymentProviderAccountId: "mock_account_owner",
      identityVerificationStatus: "VERIFIED",
    },
  });

  const tenantOneProfile = await prisma.tenantProfile.upsert({
    where: { userId: tenantOneUser.id },
    update: { identityVerificationStatus: "VERIFIED" },
    create: {
      id: "seed_tenant_profile_one",
      userId: tenantOneUser.id,
      identityVerificationStatus: "VERIFIED",
    },
  });

  const tenantTwoProfile = await prisma.tenantProfile.upsert({
    where: { userId: tenantTwoUser.id },
    update: { identityVerificationStatus: "VERIFIED" },
    create: {
      id: "seed_tenant_profile_two",
      userId: tenantTwoUser.id,
      identityVerificationStatus: "VERIFIED",
    },
  });

  return {
    admin,
    ownerUser,
    ownerProfile,
    tenantOneUser,
    tenantTwoUser,
    tenantOneProfile,
    tenantTwoProfile,
  };
}

async function seedSimpleRental(input: {
  ownerProfileId: string;
  tenantProfileId: string;
  ownerUserId: string;
  tenantUserId: string;
}) {
  const property = await prisma.property.upsert({
    where: { id: "seed_property_simple" },
    update: {
      ownerProfileId: input.ownerProfileId,
      name: "Appartement Canal",
      addressLine1: "20 avenue Test",
      postalCode: "75011",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 42,
      furnished: true,
      isColocation: false,
      status: "ACTIVE",
    },
    create: {
      id: "seed_property_simple",
      ownerProfileId: input.ownerProfileId,
      name: "Appartement Canal",
      addressLine1: "20 avenue Test",
      postalCode: "75011",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 42,
      furnished: true,
      isColocation: false,
      status: "ACTIVE",
    },
  });

  const contract = await prisma.rentalContract.upsert({
    where: { id: "seed_contract_simple" },
    update: {
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 95000,
      totalChargesAmountInCents: 8000,
      depositAmountInCents: 95000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
    create: {
      id: "seed_contract_simple",
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "INDIVIDUAL",
      colocationMode: "NONE",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 95000,
      totalChargesAmountInCents: 8000,
      depositAmountInCents: 95000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
  });

  const contractTenant = await prisma.contractTenant.upsert({
    where: { id: "seed_contract_tenant_simple" },
    update: {
      rentalContractId: contract.id,
      tenantProfileId: input.tenantProfileId,
      roomLabel: null,
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 8000,
      depositShareAmountInCents: 95000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
    create: {
      id: "seed_contract_tenant_simple",
      rentalContractId: contract.id,
      tenantProfileId: input.tenantProfileId,
      rentShareAmountInCents: 95000,
      chargesShareAmountInCents: 8000,
      depositShareAmountInCents: 95000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
  });

  await prisma.paymentMandate.upsert({
    where: { id: "seed_mandate_simple" },
    update: {
      tenantProfileId: input.tenantProfileId,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_simple",
      status: "ACCEPTED",
      ibanLast4: "1234",
      acceptedAt: dates.now,
      revokedAt: null,
    },
    create: {
      id: "seed_mandate_simple",
      tenantProfileId: input.tenantProfileId,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_simple",
      status: "ACCEPTED",
      ibanLast4: "1234",
      acceptedAt: dates.now,
    },
  });

  const payment = await prisma.payment.upsert({
    where: { id: "seed_payment_simple_rent_may" },
    update: {
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      provider: "MOCK",
      providerPaymentId: "mock_payment_simple_rent_may",
      type: "RENT",
      status: "SUCCEEDED",
      amountInCents: 103000,
      currency: "EUR",
      dueDate: dates.dueDate,
      paidAt: dates.paidAt,
      failedAt: null,
      failureReason: null,
    },
    create: {
      id: "seed_payment_simple_rent_may",
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      provider: "MOCK",
      providerPaymentId: "mock_payment_simple_rent_may",
      type: "RENT",
      status: "SUCCEEDED",
      amountInCents: 103000,
      currency: "EUR",
      dueDate: dates.dueDate,
      paidAt: dates.paidAt,
    },
  });

  await prisma.platformCommission.upsert({
    where: { paymentId: payment.id },
    update: {
      ownerProfileId: input.ownerProfileId,
      amountInCents: 490,
      currency: "EUR",
      status: "CHARGED",
      chargedAt: dates.paidAt,
      refundedAt: null,
    },
    create: {
      id: "seed_commission_simple_rent_may",
      paymentId: payment.id,
      ownerProfileId: input.ownerProfileId,
      amountInCents: 490,
      currency: "EUR",
      status: "CHARGED",
      chargedAt: dates.paidAt,
    },
  });

  await prisma.receipt.upsert({
    where: { id: "seed_receipt_simple_may" },
    update: {
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      type: "RENT_RECEIPT",
      periodStart: dates.periodStart,
      periodEnd: dates.periodEnd,
      rentAmountInCents: 95000,
      chargesAmountInCents: 8000,
      totalAmountInCents: 103000,
      currency: "EUR",
      status: "SENT",
      storageKey: "receipts/seed/simple-may.pdf",
      generatedAt: dates.paidAt,
      sentAt: dates.paidAt,
    },
    create: {
      id: "seed_receipt_simple_may",
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      type: "RENT_RECEIPT",
      periodStart: dates.periodStart,
      periodEnd: dates.periodEnd,
      rentAmountInCents: 95000,
      chargesAmountInCents: 8000,
      totalAmountInCents: 103000,
      currency: "EUR",
      status: "SENT",
      storageKey: "receipts/seed/simple-may.pdf",
      generatedAt: dates.paidAt,
      sentAt: dates.paidAt,
    },
  });

  await prisma.expense.upsert({
    where: { id: "seed_expense_simple_keys" },
    update: {
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      createdByUserId: input.ownerUserId,
      label: "Double de cles",
      description: "Frais ponctuel fictif pour developpement.",
      amountInCents: 2500,
      currency: "EUR",
      dueDate: dates.dueDate,
      status: "PLANNED",
    },
    create: {
      id: "seed_expense_simple_keys",
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: contractTenant.id,
      tenantProfileId: input.tenantProfileId,
      createdByUserId: input.ownerUserId,
      label: "Double de cles",
      description: "Frais ponctuel fictif pour developpement.",
      amountInCents: 2500,
      currency: "EUR",
      dueDate: dates.dueDate,
      status: "PLANNED",
    },
  });

  await prisma.consentEvent.upsert({
    where: { id: "seed_consent_simple_mandate" },
    update: {
      userId: input.tenantUserId,
      type: "PAYMENT_MANDATE_ACCEPTED",
      entityType: "PaymentMandate",
      entityId: "seed_mandate_simple",
      ipAddress: "127.0.0.1",
      userAgent: "RentFlow seed",
      metadata: { provider: "MOCK" },
    },
    create: {
      id: "seed_consent_simple_mandate",
      userId: input.tenantUserId,
      type: "PAYMENT_MANDATE_ACCEPTED",
      entityType: "PaymentMandate",
      entityId: "seed_mandate_simple",
      ipAddress: "127.0.0.1",
      userAgent: "RentFlow seed",
      metadata: { provider: "MOCK" },
    },
  });
}

async function seedLinkedColocation(input: {
  ownerProfileId: string;
  tenantProfileId: string;
}) {
  const property = await prisma.property.upsert({
    where: { id: "seed_property_linked_colocation" },
    update: {
      ownerProfileId: input.ownerProfileId,
      name: "Colocation Republique",
      addressLine1: "30 boulevard Demo",
      postalCode: "75003",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 78,
      furnished: true,
      isColocation: true,
      status: "ACTIVE",
    },
    create: {
      id: "seed_property_linked_colocation",
      ownerProfileId: input.ownerProfileId,
      name: "Colocation Republique",
      addressLine1: "30 boulevard Demo",
      postalCode: "75003",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 78,
      furnished: true,
      isColocation: true,
      status: "ACTIVE",
    },
  });

  const contract = await prisma.rentalContract.upsert({
    where: { id: "seed_contract_linked_colocation" },
    update: {
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "LINKED_LEASES",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 150000,
      totalChargesAmountInCents: 15000,
      depositAmountInCents: 150000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
    create: {
      id: "seed_contract_linked_colocation",
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "LINKED_LEASES",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 150000,
      totalChargesAmountInCents: 15000,
      depositAmountInCents: 150000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
  });

  const activeTenant = await prisma.contractTenant.upsert({
    where: { id: "seed_contract_tenant_linked_active" },
    update: {
      rentalContractId: contract.id,
      tenantProfileId: input.tenantProfileId,
      roomLabel: "Chambre A",
      rentShareAmountInCents: 50000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 50000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
    create: {
      id: "seed_contract_tenant_linked_active",
      rentalContractId: contract.id,
      tenantProfileId: input.tenantProfileId,
      roomLabel: "Chambre A",
      rentShareAmountInCents: 50000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 50000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
  });

  await prisma.paymentMandate.upsert({
    where: { id: "seed_mandate_linked_active" },
    update: {
      tenantProfileId: input.tenantProfileId,
      rentalContractId: contract.id,
      contractTenantId: activeTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_linked_active",
      status: "ACCEPTED",
      ibanLast4: "5678",
      acceptedAt: dates.now,
      revokedAt: null,
    },
    create: {
      id: "seed_mandate_linked_active",
      tenantProfileId: input.tenantProfileId,
      rentalContractId: contract.id,
      contractTenantId: activeTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_linked_active",
      status: "ACCEPTED",
      ibanLast4: "5678",
      acceptedAt: dates.now,
    },
  });

  const invitedTenant = await prisma.contractTenant.upsert({
    where: { id: "seed_contract_tenant_linked_invited" },
    update: {
      rentalContractId: contract.id,
      tenantProfileId: null,
      invitedEmail: "future.tenant.linked@rentflow.test",
      invitedFirstName: "Dana",
      invitedLastName: "Invite",
      roomLabel: "Chambre B",
      rentShareAmountInCents: 50000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 50000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "INVITED",
    },
    create: {
      id: "seed_contract_tenant_linked_invited",
      rentalContractId: contract.id,
      invitedEmail: "future.tenant.linked@rentflow.test",
      invitedFirstName: "Dana",
      invitedLastName: "Invite",
      roomLabel: "Chambre B",
      rentShareAmountInCents: 50000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 50000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "INVITED",
    },
  });

  await prisma.invitation.upsert({
    where: { tokenHash: "seed_token_hash_linked_invitation" },
    update: {
      ownerProfileId: input.ownerProfileId,
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: invitedTenant.id,
      tenantEmail: "future.tenant.linked@rentflow.test",
      tenantFirstName: "Dana",
      tenantLastName: "Invite",
      status: "SENT",
      expiresAt: dates.expiresAt,
      acceptedAt: null,
      canceledAt: null,
    },
    create: {
      id: "seed_invitation_linked",
      ownerProfileId: input.ownerProfileId,
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: invitedTenant.id,
      tenantEmail: "future.tenant.linked@rentflow.test",
      tenantFirstName: "Dana",
      tenantLastName: "Invite",
      tokenHash: "seed_token_hash_linked_invitation",
      status: "SENT",
      expiresAt: dates.expiresAt,
    },
  });

  const linkedPayment = await prisma.payment.upsert({
    where: { id: "seed_payment_linked_paid_share" },
    update: {
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: activeTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      provider: "MOCK",
      providerPaymentId: "mock_payment_linked_paid_share",
      type: "RENT",
      status: "SUCCEEDED",
      amountInCents: 55000,
      currency: "EUR",
      dueDate: dates.dueDate,
      paidAt: dates.paidAt,
      failedAt: null,
      failureReason: null,
    },
    create: {
      id: "seed_payment_linked_paid_share",
      propertyId: property.id,
      rentalContractId: contract.id,
      contractTenantId: activeTenant.id,
      tenantProfileId: input.tenantProfileId,
      ownerProfileId: input.ownerProfileId,
      provider: "MOCK",
      providerPaymentId: "mock_payment_linked_paid_share",
      type: "RENT",
      status: "SUCCEEDED",
      amountInCents: 55000,
      currency: "EUR",
      dueDate: dates.dueDate,
      paidAt: dates.paidAt,
    },
  });

  await prisma.platformCommission.upsert({
    where: { paymentId: linkedPayment.id },
    update: {
      ownerProfileId: input.ownerProfileId,
      amountInCents: 490,
      currency: "EUR",
      status: "CHARGED",
      chargedAt: dates.paidAt,
      refundedAt: null,
    },
    create: {
      id: "seed_commission_linked_paid_share",
      paymentId: linkedPayment.id,
      ownerProfileId: input.ownerProfileId,
      amountInCents: 490,
      currency: "EUR",
      status: "CHARGED",
      chargedAt: dates.paidAt,
    },
  });
}

async function seedIndependentColocation(input: {
  ownerProfileId: string;
  tenantProfileId: string;
}) {
  const property = await prisma.property.upsert({
    where: { id: "seed_property_independent_colocation" },
    update: {
      ownerProfileId: input.ownerProfileId,
      name: "Colocation Bastille",
      addressLine1: "40 rue Locale",
      postalCode: "75012",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 90,
      furnished: true,
      isColocation: true,
      status: "ACTIVE",
    },
    create: {
      id: "seed_property_independent_colocation",
      ownerProfileId: input.ownerProfileId,
      name: "Colocation Bastille",
      addressLine1: "40 rue Locale",
      postalCode: "75012",
      city: "Paris",
      country: "FR",
      propertyType: "APARTMENT",
      surfaceAreaSqm: 90,
      furnished: true,
      isColocation: true,
      status: "ACTIVE",
    },
  });

  const activeContract = await prisma.rentalContract.upsert({
    where: { id: "seed_contract_independent_room_one" },
    update: {
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "INDEPENDENT_LEASES",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 62000,
      totalChargesAmountInCents: 5000,
      depositAmountInCents: 62000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
    create: {
      id: "seed_contract_independent_room_one",
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "INDEPENDENT_LEASES",
      startDate: dates.leaseStart,
      status: "ACTIVE",
      totalRentAmountInCents: 62000,
      totalChargesAmountInCents: 5000,
      depositAmountInCents: 62000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
  });

  const invitedContract = await prisma.rentalContract.upsert({
    where: { id: "seed_contract_independent_room_two" },
    update: {
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "INDEPENDENT_LEASES",
      startDate: dates.leaseStart,
      status: "DRAFT",
      totalRentAmountInCents: 70000,
      totalChargesAmountInCents: 6000,
      depositAmountInCents: 70000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
    create: {
      id: "seed_contract_independent_room_two",
      propertyId: property.id,
      ownerProfileId: input.ownerProfileId,
      contractType: "COLOCATION",
      colocationMode: "INDEPENDENT_LEASES",
      startDate: dates.leaseStart,
      status: "DRAFT",
      totalRentAmountInCents: 70000,
      totalChargesAmountInCents: 6000,
      depositAmountInCents: 70000,
      currency: "EUR",
      paymentDayOfMonth: 5,
    },
  });

  const activeTenant = await prisma.contractTenant.upsert({
    where: { id: "seed_contract_tenant_independent_active" },
    update: {
      rentalContractId: activeContract.id,
      tenantProfileId: input.tenantProfileId,
      roomLabel: "Chambre 1",
      rentShareAmountInCents: 62000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 62000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
    create: {
      id: "seed_contract_tenant_independent_active",
      rentalContractId: activeContract.id,
      tenantProfileId: input.tenantProfileId,
      roomLabel: "Chambre 1",
      rentShareAmountInCents: 62000,
      chargesShareAmountInCents: 5000,
      depositShareAmountInCents: 62000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "ACTIVE",
    },
  });

  await prisma.paymentMandate.upsert({
    where: { id: "seed_mandate_independent_active" },
    update: {
      tenantProfileId: input.tenantProfileId,
      rentalContractId: activeContract.id,
      contractTenantId: activeTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_independent_active",
      status: "ACCEPTED",
      ibanLast4: "9012",
      acceptedAt: dates.now,
      revokedAt: null,
    },
    create: {
      id: "seed_mandate_independent_active",
      tenantProfileId: input.tenantProfileId,
      rentalContractId: activeContract.id,
      contractTenantId: activeTenant.id,
      provider: "MOCK",
      providerMandateId: "mock_mandate_independent_active",
      status: "ACCEPTED",
      ibanLast4: "9012",
      acceptedAt: dates.now,
    },
  });

  const invitedTenant = await prisma.contractTenant.upsert({
    where: { id: "seed_contract_tenant_independent_invited" },
    update: {
      rentalContractId: invitedContract.id,
      tenantProfileId: null,
      invitedEmail: "future.tenant.independent@rentflow.test",
      invitedFirstName: "Eli",
      invitedLastName: "Invite",
      roomLabel: "Chambre 2",
      rentShareAmountInCents: 70000,
      chargesShareAmountInCents: 6000,
      depositShareAmountInCents: 70000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "INVITED",
    },
    create: {
      id: "seed_contract_tenant_independent_invited",
      rentalContractId: invitedContract.id,
      invitedEmail: "future.tenant.independent@rentflow.test",
      invitedFirstName: "Eli",
      invitedLastName: "Invite",
      roomLabel: "Chambre 2",
      rentShareAmountInCents: 70000,
      chargesShareAmountInCents: 6000,
      depositShareAmountInCents: 70000,
      currency: "EUR",
      startDate: dates.leaseStart,
      status: "INVITED",
    },
  });

  await prisma.invitation.upsert({
    where: { tokenHash: "seed_token_hash_independent_invitation" },
    update: {
      ownerProfileId: input.ownerProfileId,
      propertyId: property.id,
      rentalContractId: invitedContract.id,
      contractTenantId: invitedTenant.id,
      tenantEmail: "future.tenant.independent@rentflow.test",
      tenantFirstName: "Eli",
      tenantLastName: "Invite",
      status: "SENT",
      expiresAt: dates.expiresAt,
      acceptedAt: null,
      canceledAt: null,
    },
    create: {
      id: "seed_invitation_independent",
      ownerProfileId: input.ownerProfileId,
      propertyId: property.id,
      rentalContractId: invitedContract.id,
      contractTenantId: invitedTenant.id,
      tenantEmail: "future.tenant.independent@rentflow.test",
      tenantFirstName: "Eli",
      tenantLastName: "Invite",
      tokenHash: "seed_token_hash_independent_invitation",
      status: "SENT",
      expiresAt: dates.expiresAt,
    },
  });
}

async function seedTransverseData(input: {
  adminUserId: string;
  ownerUserId: string;
  tenantUserId: string;
}) {
  await prisma.platformSetting.upsert({
    where: { key: "default_rent_commission" },
    update: {
      amountInCents: 490,
      currency: "EUR",
      active: true,
      metadata: { appliesTo: "RENT" },
    },
    create: {
      id: "seed_platform_setting_commission",
      key: "default_rent_commission",
      amountInCents: 490,
      currency: "EUR",
      active: true,
      metadata: { appliesTo: "RENT" },
    },
  });

  await prisma.webhookEvent.upsert({
    where: { id: "seed_webhook_payment_succeeded" },
    update: {
      provider: "mock",
      eventId: "mock_event_payment_succeeded_seed",
      eventType: "payment.succeeded",
      payload: { paymentId: "seed_payment_simple_rent_may" },
      processedAt: dates.now,
      failedAt: null,
      failureReason: null,
    },
    create: {
      id: "seed_webhook_payment_succeeded",
      provider: "mock",
      eventId: "mock_event_payment_succeeded_seed",
      eventType: "payment.succeeded",
      payload: { paymentId: "seed_payment_simple_rent_may" },
      processedAt: dates.now,
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed_notification_owner_payment_succeeded" },
    update: {
      userId: input.ownerUserId,
      type: "PAYMENT_SUCCEEDED",
      title: "Paiement recu",
      body: "Un paiement fictif a ete marque comme reussi.",
      readAt: null,
    },
    create: {
      id: "seed_notification_owner_payment_succeeded",
      userId: input.ownerUserId,
      type: "PAYMENT_SUCCEEDED",
      title: "Paiement recu",
      body: "Un paiement fictif a ete marque comme reussi.",
    },
  });

  await prisma.notification.upsert({
    where: { id: "seed_notification_tenant_receipt" },
    update: {
      userId: input.tenantUserId,
      type: "RECEIPT_GENERATED",
      title: "Quittance disponible",
      body: "Une quittance fictive est disponible dans votre espace.",
      readAt: null,
    },
    create: {
      id: "seed_notification_tenant_receipt",
      userId: input.tenantUserId,
      type: "RECEIPT_GENERATED",
      title: "Quittance disponible",
      body: "Une quittance fictive est disponible dans votre espace.",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "seed_audit_admin_seed" },
    update: {
      userId: input.adminUserId,
      action: "seed.run",
      entityType: "Database",
      entityId: "local",
      metadata: { source: "prisma/seed.ts" },
      ipAddress: "127.0.0.1",
    },
    create: {
      id: "seed_audit_admin_seed",
      userId: input.adminUserId,
      action: "seed.run",
      entityType: "Database",
      entityId: "local",
      metadata: { source: "prisma/seed.ts" },
      ipAddress: "127.0.0.1",
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "seed_audit_owner_property" },
    update: {
      userId: input.ownerUserId,
      action: "property.created",
      entityType: "Property",
      entityId: "seed_property_simple",
      metadata: { seed: true },
      ipAddress: "127.0.0.1",
    },
    create: {
      id: "seed_audit_owner_property",
      userId: input.ownerUserId,
      action: "property.created",
      entityType: "Property",
      entityId: "seed_property_simple",
      metadata: { seed: true },
      ipAddress: "127.0.0.1",
    },
  });
}

async function main() {
  const users = await seedUsers();

  await seedSimpleRental({
    ownerProfileId: users.ownerProfile.id,
    tenantProfileId: users.tenantOneProfile.id,
    ownerUserId: users.ownerUser.id,
    tenantUserId: users.tenantOneUser.id,
  });

  await seedLinkedColocation({
    ownerProfileId: users.ownerProfile.id,
    tenantProfileId: users.tenantTwoProfile.id,
  });

  await seedIndependentColocation({
    ownerProfileId: users.ownerProfile.id,
    tenantProfileId: users.tenantTwoProfile.id,
  });

  await seedTransverseData({
    adminUserId: users.admin.id,
    ownerUserId: users.ownerUser.id,
    tenantUserId: users.tenantOneUser.id,
  });

  const summary = {
    users: await prisma.user.count(),
    properties: await prisma.property.count(),
    contracts: await prisma.rentalContract.count(),
    contractTenants: await prisma.contractTenant.count(),
    invitations: await prisma.invitation.count(),
    payments: await prisma.payment.count(),
    receipts: await prisma.receipt.count(),
    commissions: await prisma.platformCommission.count(),
  };

  console.info("RentFlow seed complete", summary);
}

main()
  .catch((error) => {
    console.error("RentFlow seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
