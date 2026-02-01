/*
  Warnings:

  - You are about to drop the `employee_tax_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fiscal_document_taxes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fiscal_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `taxes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "employee_tax_configs" DROP CONSTRAINT "employee_tax_configs_branchId_fkey";

-- DropForeignKey
ALTER TABLE "employee_tax_configs" DROP CONSTRAINT "employee_tax_configs_companyId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_document_taxes" DROP CONSTRAINT "fiscal_document_taxes_fiscalDocumentId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_document_taxes" DROP CONSTRAINT "fiscal_document_taxes_taxId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_documents" DROP CONSTRAINT "fiscal_documents_branchId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_documents" DROP CONSTRAINT "fiscal_documents_companyId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_documents" DROP CONSTRAINT "fiscal_documents_financialTransactionId_fkey";

-- DropForeignKey
ALTER TABLE "taxes" DROP CONSTRAINT "taxes_branchId_fkey";

-- DropForeignKey
ALTER TABLE "taxes" DROP CONSTRAINT "taxes_companyId_fkey";

-- DropIndex
DROP INDEX "maintenance_materials_vehicleReplacementItemId_idx";

-- DropIndex
DROP INDEX "vehicle_status_history_maintenanceOrderId_idx";

-- AlterTable
ALTER TABLE "vacations" ADD COLUMN     "advance13thSalary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "soldDays" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "employee_tax_configs";

-- DropTable
DROP TABLE "fiscal_document_taxes";

-- DropTable
DROP TABLE "fiscal_documents";

-- DropTable
DROP TABLE "taxes";

-- DropEnum
DROP TYPE "EmployeeTaxType";

-- DropEnum
DROP TYPE "FiscalDocumentStatus";

-- DropEnum
DROP TYPE "FiscalDocumentType";

-- RenameForeignKey
ALTER TABLE "maintenance_label_replacement_items" RENAME CONSTRAINT "maintenance_label_replacement_items_vehicleReplacementItemId_fk" TO "maintenance_label_replacement_items_vehicleReplacementItem_fkey";

-- RenameIndex
ALTER INDEX "maintenance_label_replacement_items_maintenanceLabelId_vehicleR" RENAME TO "maintenance_label_replacement_items_maintenanceLabelId_vehi_key";

-- RenameIndex
ALTER INDEX "maintenance_label_replacement_items_vehicleReplacementItemId_id" RENAME TO "maintenance_label_replacement_items_vehicleReplacementItemI_idx";
