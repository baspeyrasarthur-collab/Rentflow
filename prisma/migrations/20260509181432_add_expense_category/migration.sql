-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('LOAN_REPAYMENT', 'INSURANCE', 'CONDO_FEES', 'PROPERTY_TAX', 'WORKS', 'OTHER');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER';
