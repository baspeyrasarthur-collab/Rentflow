-- CreateEnum
CREATE TYPE "OwnerPlan" AS ENUM ('FREE', 'PRO', 'SCALE');

-- AlterTable
ALTER TABLE "OwnerProfile" ADD COLUMN     "plan" "OwnerPlan" NOT NULL DEFAULT 'FREE';
