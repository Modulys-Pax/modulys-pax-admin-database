-- Remove warehouseFromId and warehouseToId columns from stock_movements table
-- These fields are no longer needed as the system uses the default warehouse automatically

-- Drop foreign key constraints first
ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_warehouseFromId_fkey";
ALTER TABLE "stock_movements" DROP CONSTRAINT IF EXISTS "stock_movements_warehouseToId_fkey";

-- Drop the columns
ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "warehouseFromId";
ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "warehouseToId";
