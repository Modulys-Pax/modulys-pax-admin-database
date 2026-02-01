-- AlterTable: vehicle_replacement_items passa a usar name (texto) em vez de productId
-- 1. Adicionar coluna name e preencher a partir de products
ALTER TABLE "vehicle_replacement_items" ADD COLUMN IF NOT EXISTS "name" TEXT;

UPDATE "vehicle_replacement_items" vri
SET "name" = COALESCE(p."name", 'Item')
FROM "products" p
WHERE p.id = vri."productId";

ALTER TABLE "vehicle_replacement_items" ALTER COLUMN "name" SET NOT NULL;

-- 2. Criar tabela maintenance_label_replacement_items
CREATE TABLE IF NOT EXISTS "maintenance_label_replacement_items" (
    "id" TEXT NOT NULL,
    "maintenanceLabelId" TEXT NOT NULL,
    "vehicleReplacementItemId" TEXT NOT NULL,
    "lastChangeKm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_label_replacement_items_pkey" PRIMARY KEY ("id")
);

-- 3. Migrar dados: maintenance_label_products -> maintenance_label_replacement_items (via vehicle_replacement_items)
INSERT INTO "maintenance_label_replacement_items" ("id", "maintenanceLabelId", "vehicleReplacementItemId", "lastChangeKm", "createdAt", "createdBy")
SELECT
  gen_random_uuid(),
  mlp."maintenanceLabelId",
  vri.id,
  mlp."lastChangeKm",
  mlp."createdAt",
  mlp."createdBy"
FROM "maintenance_label_products" mlp
JOIN "maintenance_labels" ml ON ml.id = mlp."maintenanceLabelId"
JOIN "vehicle_replacement_items" vri ON vri."vehicleId" = ml."vehicleId" AND vri."productId" = mlp."productId";

CREATE UNIQUE INDEX "maintenance_label_replacement_items_maintenanceLabelId_vehicleReplacementItemId_key" ON "maintenance_label_replacement_items"("maintenanceLabelId", "vehicleReplacementItemId");
CREATE INDEX "maintenance_label_replacement_items_vehicleReplacementItemId_idx" ON "maintenance_label_replacement_items"("vehicleReplacementItemId");

ALTER TABLE "maintenance_label_replacement_items" ADD CONSTRAINT "maintenance_label_replacement_items_maintenanceLabelId_fkey" FOREIGN KEY ("maintenanceLabelId") REFERENCES "maintenance_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "maintenance_label_replacement_items" ADD CONSTRAINT "maintenance_label_replacement_items_vehicleReplacementItemId_fkey" FOREIGN KEY ("vehicleReplacementItemId") REFERENCES "vehicle_replacement_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Remover tabela antiga maintenance_label_products
DROP TABLE IF EXISTS "maintenance_label_products";

-- 5. Remover productId de vehicle_replacement_items
ALTER TABLE "vehicle_replacement_items" DROP CONSTRAINT IF EXISTS "vehicle_replacement_items_productId_fkey";
DROP INDEX IF EXISTS "vehicle_replacement_items_vehicleId_productId_key";

-- Desfazer duplicatas (vehicleId, name): deixar nomes únicos antes do unique
UPDATE "vehicle_replacement_items" vri
SET "name" = vri."name" || ' (' || vri."productId" || ')'
WHERE vri.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY "vehicleId", "name" ORDER BY id) AS rn
    FROM "vehicle_replacement_items"
  ) sub
  WHERE sub.rn > 1
);

ALTER TABLE "vehicle_replacement_items" DROP COLUMN IF EXISTS "productId";

-- 6. Índice único por (vehicleId, name)
CREATE UNIQUE INDEX "vehicle_replacement_items_vehicleId_name_key" ON "vehicle_replacement_items"("vehicleId", "name");
