-- CreateEnum
CREATE TYPE "TenantRequestStatus" AS ENUM ('OPEN', 'RESOLVED_BY_OWNER', 'REFUSED_BY_OWNER', 'ACKNOWLEDGED_BY_TENANT', 'CANCELED');

-- CreateEnum
CREATE TYPE "TenantRequestCategory" AS ENUM ('GENERAL', 'REPAIR', 'DOCUMENT', 'PAYMENT', 'RECEIPT', 'OTHER');

-- CreateTable
CREATE TABLE "TenantRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalContractId" TEXT,
    "contractTenantId" TEXT,
    "tenantProfileId" TEXT NOT NULL,
    "ownerProfileId" TEXT NOT NULL,
    "category" "TenantRequestCategory" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TenantRequestStatus" NOT NULL DEFAULT 'OPEN',
    "ownerResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "refusedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "TenantRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantRequest_ownerProfileId_status_createdAt_idx" ON "TenantRequest"("ownerProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TenantRequest_tenantProfileId_status_createdAt_idx" ON "TenantRequest"("tenantProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TenantRequest_propertyId_status_idx" ON "TenantRequest"("propertyId", "status");

-- CreateIndex
CREATE INDEX "TenantRequest_rentalContractId_status_idx" ON "TenantRequest"("rentalContractId", "status");

-- CreateIndex
CREATE INDEX "TenantRequest_contractTenantId_status_idx" ON "TenantRequest"("contractTenantId", "status");

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_rentalContractId_fkey" FOREIGN KEY ("rentalContractId") REFERENCES "RentalContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantRequest" ADD CONSTRAINT "TenantRequest_ownerProfileId_fkey" FOREIGN KEY ("ownerProfileId") REFERENCES "OwnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
