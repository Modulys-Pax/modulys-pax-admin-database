-- AlterTable: data do serviço e anexo (nota de terceiro) na ordem de manutenção
ALTER TABLE "maintenance_orders" ADD COLUMN IF NOT EXISTS "serviceDate" TIMESTAMP(3);
ALTER TABLE "maintenance_orders" ADD COLUMN IF NOT EXISTS "attachmentFileName" TEXT;
ALTER TABLE "maintenance_orders" ADD COLUMN IF NOT EXISTS "attachmentFilePath" TEXT;
