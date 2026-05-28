-- CreateEnum
CREATE TYPE "RecurringExpenseRuleStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateTable
CREATE TABLE "RecurringExpenseRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "category" "ExpenseCategory" NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "startMonth" TIMESTAMP(3) NOT NULL,
    "endMonth" TIMESTAMP(3),
    "status" "RecurringExpenseRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpenseRule_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "recurringRuleId" TEXT,
ADD COLUMN     "occurrenceMonth" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "RecurringExpenseRule_propertyId_status_idx" ON "RecurringExpenseRule"("propertyId", "status");

-- CreateIndex
CREATE INDEX "RecurringExpenseRule_createdByUserId_status_idx" ON "RecurringExpenseRule"("createdByUserId", "status");

-- CreateIndex
CREATE INDEX "RecurringExpenseRule_startMonth_endMonth_idx" ON "RecurringExpenseRule"("startMonth", "endMonth");

-- CreateIndex
CREATE INDEX "Expense_recurringRuleId_idx" ON "Expense"("recurringRuleId");

-- CreateIndex
CREATE INDEX "Expense_occurrenceMonth_idx" ON "Expense"("occurrenceMonth");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_recurringRuleId_occurrenceMonth_key" ON "Expense"("recurringRuleId", "occurrenceMonth");

-- AddForeignKey
ALTER TABLE "RecurringExpenseRule" ADD CONSTRAINT "RecurringExpenseRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpenseRule" ADD CONSTRAINT "RecurringExpenseRule_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringExpenseRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
