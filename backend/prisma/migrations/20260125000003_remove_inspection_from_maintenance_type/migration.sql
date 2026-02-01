-- Atualizar ordens com tipo INSPECTION para PREVENTIVE
UPDATE "maintenance_orders" SET type = 'PREVENTIVE' WHERE type = 'INSPECTION';

-- Criar novo enum sem INSPECTION
CREATE TYPE "MaintenanceType_new" AS ENUM ('PREVENTIVE', 'CORRECTIVE');

-- Alterar coluna para usar o novo enum
ALTER TABLE "maintenance_orders" ALTER COLUMN "type" TYPE "MaintenanceType_new" USING (type::text::"MaintenanceType_new");

-- Remover enum antigo e renomear o novo
DROP TYPE "MaintenanceType";
ALTER TYPE "MaintenanceType_new" RENAME TO "MaintenanceType";
