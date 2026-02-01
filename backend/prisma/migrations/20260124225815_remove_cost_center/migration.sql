/*
  Warnings:

  - You are about to drop the `cost_centers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cost_centers" DROP CONSTRAINT "cost_centers_branchId_fkey";

-- DropForeignKey
ALTER TABLE "cost_centers" DROP CONSTRAINT "cost_centers_companyId_fkey";

-- DropTable
DROP TABLE "cost_centers";
