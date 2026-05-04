-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'TENANT', 'ADMIN');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'HOUSE', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "RentalContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENSION_REQUESTED', 'SUSPENDED', 'TERMINATION_REQUESTED', 'TERMINATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RentalContractType" AS ENUM ('INDIVIDUAL', 'COLOCATION');

-- CreateEnum
CREATE TYPE "ColocationMode" AS ENUM ('NONE', 'LINKED_LEASES', 'INDEPENDENT_LEASES');

-- CreateEnum
CREATE TYPE "ContractTenantStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENSION_REQUESTED', 'SUSPENDED', 'TERMINATION_REQUESTED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('SENT', 'ACCEPTED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentProviderName" AS ENUM ('MOCK', 'STRIPE_CONNECT', 'GOCARDLESS');

-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('CREATED', 'ACCEPTED', 'REVOKED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('RENT', 'CHARGES', 'DEPOSIT', 'ONE_OFF_EXPENSE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PLANNED', 'PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PLANNED', 'PENDING', 'PAID', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReceiptType" AS ENUM ('RECEIPT', 'RENT_RECEIPT');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('REQUESTED', 'GENERATED', 'SENT', 'CANCELED');

-- CreateEnum
CREATE TYPE "PlatformCommissionStatus" AS ENUM ('PENDING', 'CHARGED', 'CANCELED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'FAILED', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "ConsentEventType" AS ENUM ('TERMS_ACCEPTED', 'PRIVACY_ACCEPTED', 'PAYMENT_MANDATE_ACCEPTED', 'PAYMENT_AUTHORIZATION_GRANTED', 'MANDATE_REVOKED', 'SUSPENSION_REQUESTED', 'TERMINATION_REQUESTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITATION_SENT', 'INVITATION_ACCEPTED', 'MANDATE_ACCEPTED', 'PAYMENT_PLANNED', 'PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'RECEIPT_REQUESTED', 'RECEIPT_GENERATED', 'MANAGEMENT_SUSPENDED', 'RENTAL_TERMINATED', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "billingName" TEXT,
    "billingAddressLine1" TEXT,
    "billingAddressLine2" TEXT,
    "billingPostalCode" TEXT,
    "billingCity" TEXT,
    "billingCountry" TEXT NOT NULL DEFAULT 'FR',
    "paymentProviderCustomerId" TEXT,
    "paymentProviderAccountId" TEXT,
    "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "identityVerificationStatus" "IdentityVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "propertyType" "PropertyType" NOT NULL,
    "surfaceAreaSqm" INTEGER,
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "isColocation" BOOLEAN NOT NULL DEFAULT false,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalContract" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "contractType" "RentalContractType" NOT NULL,
    "colocationMode" "ColocationMode" NOT NULL DEFAULT 'NONE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "RentalContractStatus" NOT NULL DEFAULT 'DRAFT',
    "totalRentAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "totalChargesAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "depositAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentDayOfMonth" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractTenant" (
    "id" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "tenantProfileId" TEXT,
    "invitedEmail" TEXT,
    "invitedFirstName" TEXT,
    "invitedLastName" TEXT,
    "roomLabel" TEXT,
    "rentShareAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "chargesShareAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "depositShareAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ContractTenantStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "contractTenantId" TEXT,
    "tenantEmail" TEXT NOT NULL,
    "tenantFirstName" TEXT NOT NULL,
    "tenantLastName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'SENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMandate" (
    "id" TEXT NOT NULL,
    "tenantProfileId" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "contractTenantId" TEXT,
    "provider" "PaymentProviderName" NOT NULL,
    "providerMandateId" TEXT NOT NULL,
    "status" "MandateStatus" NOT NULL DEFAULT 'CREATED',
    "ibanLast4" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMandate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "contractTenantId" TEXT,
    "tenantProfileId" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "provider" "PaymentProviderName",
    "providerPaymentId" TEXT,
    "type" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PLANNED',
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalContractId" TEXT,
    "contractTenantId" TEXT,
    "tenantProfileId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalContractId" TEXT NOT NULL,
    "contractTenantId" TEXT,
    "tenantProfileId" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "type" "ReceiptType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "rentAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "chargesAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountInCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "ReceiptStatus" NOT NULL DEFAULT 'REQUESTED',
    "storageKey" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCommission" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PlatformCommissionStatus" NOT NULL DEFAULT 'PENDING',
    "chargedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCommission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSessionId" TEXT NOT NULL,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentEventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_disabledAt_idx" ON "User"("disabledAt");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerProfile_userId_key" ON "OwnerProfile"("userId");

-- CreateIndex
CREATE INDEX "OwnerProfile_identityVerificationStatus_idx" ON "OwnerProfile"("identityVerificationStatus");

-- CreateIndex
CREATE INDEX "OwnerProfile_paymentProviderAccountId_idx" ON "OwnerProfile"("paymentProviderAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantProfile_userId_key" ON "TenantProfile"("userId");

-- CreateIndex
CREATE INDEX "TenantProfile_identityVerificationStatus_idx" ON "TenantProfile"("identityVerificationStatus");

-- CreateIndex
CREATE INDEX "Property_ownerProfileId_status_idx" ON "Property"("ownerProfileId", "status");

-- CreateIndex
CREATE INDEX "Property_city_country_idx" ON "Property"("city", "country");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "RentalContract_propertyId_status_idx" ON "RentalContract"("propertyId", "status");

-- CreateIndex
CREATE INDEX "RentalContract_ownerProfileId_status_idx" ON "RentalContract"("ownerProfileId", "status");

-- CreateIndex
CREATE INDEX "RentalContract_contractType_colocationMode_idx" ON "RentalContract"("contractType", "colocationMode");

-- CreateIndex
CREATE INDEX "RentalContract_startDate_endDate_idx" ON "RentalContract"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "ContractTenant_invitedEmail_idx" ON "ContractTenant"("invitedEmail");

-- CreateIndex
CREATE INDEX "ContractTenant_tenantProfileId_status_idx" ON "ContractTenant"("tenantProfileId", "status");

-- CreateIndex
CREATE INDEX "ContractTenant_rentalContractId_status_idx" ON "ContractTenant"("rentalContractId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTenant_rentalContractId_tenantProfileId_key" ON "ContractTenant"("rentalContractId", "tenantProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_tenantEmail_idx" ON "Invitation"("tenantEmail");

-- CreateIndex
CREATE INDEX "Invitation_status_expiresAt_idx" ON "Invitation"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Invitation_propertyId_status_idx" ON "Invitation"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Invitation_rentalContractId_status_idx" ON "Invitation"("rentalContractId", "status");

-- CreateIndex
CREATE INDEX "PaymentMandate_tenantProfileId_status_idx" ON "PaymentMandate"("tenantProfileId", "status");

-- CreateIndex
CREATE INDEX "PaymentMandate_rentalContractId_status_idx" ON "PaymentMandate"("rentalContractId", "status");

-- CreateIndex
CREATE INDEX "PaymentMandate_contractTenantId_idx" ON "PaymentMandate"("contractTenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMandate_provider_providerMandateId_key" ON "PaymentMandate"("provider", "providerMandateId");

-- CreateIndex
CREATE INDEX "Payment_status_dueDate_idx" ON "Payment"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Payment_propertyId_dueDate_idx" ON "Payment"("propertyId", "dueDate");

-- CreateIndex
CREATE INDEX "Payment_rentalContractId_dueDate_idx" ON "Payment"("rentalContractId", "dueDate");

-- CreateIndex
CREATE INDEX "Payment_tenantProfileId_status_idx" ON "Payment"("tenantProfileId", "status");

-- CreateIndex
CREATE INDEX "Payment_ownerProfileId_status_idx" ON "Payment"("ownerProfileId", "status");

-- CreateIndex
CREATE INDEX "Payment_type_status_idx" ON "Payment"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_providerPaymentId_key" ON "Payment"("provider", "providerPaymentId");

-- CreateIndex
CREATE INDEX "Expense_propertyId_status_idx" ON "Expense"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Expense_rentalContractId_status_idx" ON "Expense"("rentalContractId", "status");

-- CreateIndex
CREATE INDEX "Expense_tenantProfileId_status_idx" ON "Expense"("tenantProfileId", "status");

-- CreateIndex
CREATE INDEX "Expense_dueDate_status_idx" ON "Expense"("dueDate", "status");

-- CreateIndex
CREATE INDEX "Receipt_tenantProfileId_status_idx" ON "Receipt"("tenantProfileId", "status");

-- CreateIndex
CREATE INDEX "Receipt_ownerProfileId_status_idx" ON "Receipt"("ownerProfileId", "status");

-- CreateIndex
CREATE INDEX "Receipt_propertyId_periodStart_periodEnd_idx" ON "Receipt"("propertyId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "Receipt_rentalContractId_periodStart_periodEnd_idx" ON "Receipt"("rentalContractId", "periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformCommission_paymentId_key" ON "PlatformCommission"("paymentId");

-- CreateIndex
CREATE INDEX "PlatformCommission_ownerProfileId_status_idx" ON "PlatformCommission"("ownerProfileId", "status");

-- CreateIndex
CREATE INDEX "PlatformCommission_status_chargedAt_idx" ON "PlatformCommission"("status", "chargedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

-- CreateIndex
CREATE INDEX "IdentityVerification_userId_status_idx" ON "IdentityVerification"("userId", "status");

-- CreateIndex
CREATE INDEX "IdentityVerification_status_startedAt_idx" ON "IdentityVerification"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_provider_providerSessionId_key" ON "IdentityVerification"("provider", "providerSessionId");

-- CreateIndex
CREATE INDEX "ConsentEvent_userId_type_createdAt_idx" ON "ConsentEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentEvent_entityType_entityId_idx" ON "ConsentEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ConsentEvent_type_createdAt_idx" ON "ConsentEvent"("type", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_eventType_idx" ON "WebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_processedAt_idx" ON "WebhookEvent"("processedAt");

-- CreateIndex
CREATE INDEX "WebhookEvent_failedAt_idx" ON "WebhookEvent"("failedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSetting_key_key" ON "PlatformSetting"("key");

-- CreateIndex
CREATE INDEX "PlatformSetting_active_idx" ON "PlatformSetting"("active");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "OwnerProfile" ADD CONSTRAINT "OwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantProfile" ADD CONSTRAINT "TenantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalContract" ADD CONSTRAINT "RentalContract_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalContract" ADD CONSTRAINT "RentalContract_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTenant" ADD CONSTRAINT "ContractTenant_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractTenant" ADD CONSTRAINT "ContractTenant_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMandate" ADD CONSTRAINT "PaymentMandate_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCommission" ADD CONSTRAINT "PlatformCommission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformCommission" ADD CONSTRAINT "PlatformCommission_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
