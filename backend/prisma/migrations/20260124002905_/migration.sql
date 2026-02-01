/*
  Warnings:

  - You are about to drop the column `brand` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "brand",
DROP COLUMN "model";

-- DropEnum
DROP TYPE "BenefitType";
