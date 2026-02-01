-- Limpar enum StockMovementType, removendo valores não utilizados
-- Primeiro, atualizar todos os registros existentes para ENTRY (caso existam outros tipos)
UPDATE "stock_movements" SET "type" = 'ENTRY' WHERE "type" IN ('EXIT', 'TRANSFER', 'ADJUSTMENT');

-- Remover valores do enum (PostgreSQL)
ALTER TYPE "StockMovementType" RENAME TO "StockMovementType_old";
CREATE TYPE "StockMovementType" AS ENUM ('ENTRY');
ALTER TABLE "stock_movements" ALTER COLUMN "type" TYPE "StockMovementType" USING "type"::text::"StockMovementType";
DROP TYPE "StockMovementType_old";
