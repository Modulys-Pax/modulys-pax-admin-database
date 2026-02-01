-- Remove costCenterId from maintenance_orders table
ALTER TABLE "maintenance_orders" DROP COLUMN IF EXISTS "costCenterId";
