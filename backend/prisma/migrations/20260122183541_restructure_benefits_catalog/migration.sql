/*
  Warnings:

  - You are about to drop the column `description` on the `employee_benefits` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyCost` on the `employee_benefits` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `employee_benefits` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `employee_benefits` table. All the data in the column will be lost.
  - Added the required column `benefitId` to the `employee_benefits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employee_benefits" DROP COLUMN "description",
DROP COLUMN "monthlyCost",
DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "benefitId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BenefitType" NOT NULL,
    "dailyCost" DECIMAL(65,30) NOT NULL,
    "employeeValue" DECIMAL(65,30) NOT NULL,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_benefits" ADD CONSTRAINT "employee_benefits_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
