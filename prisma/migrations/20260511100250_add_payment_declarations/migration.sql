-- CreateEnum
CREATE TYPE "PaymentDeclarationType" AS ENUM ('PAID_EXTERNALLY');

-- CreateTable
CREATE TABLE "PaymentDeclaration" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "tenantProfileId" TEXT NOT NULL,
    "contractTenantId" TEXT,
    "declarationType" "PaymentDeclarationType" NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentDeclaration_paymentId_declaredAt_idx" ON "PaymentDeclaration"("paymentId", "declaredAt");

-- CreateIndex
CREATE INDEX "PaymentDeclaration_tenantProfileId_declaredAt_idx" ON "PaymentDeclaration"("tenantProfileId", "declaredAt");

-- CreateIndex
CREATE INDEX "PaymentDeclaration_contractTenantId_declaredAt_idx" ON "PaymentDeclaration"("contractTenantId", "declaredAt");

-- CreateIndex
CREATE INDEX "PaymentDeclaration_declarationType_declaredAt_idx" ON "PaymentDeclaration"("declarationType", "declaredAt");

-- AddForeignKey
ALTER TABLE "PaymentDeclaration" ADD CONSTRAINT "PaymentDeclaration_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDeclaration" ADD CONSTRAINT "PaymentDeclaration_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "TenantProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentDeclaration" ADD CONSTRAINT "PaymentDeclaration_contractTenantId_fkey" FOREIGN KEY ("contractTenantId") REFERENCES "ContractTenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
