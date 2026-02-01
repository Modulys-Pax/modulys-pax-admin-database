-- CreateTable: produtos por veículo para troca a cada X KM
CREATE TABLE "vehicle_replacement_items" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "replaceEveryKm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_replacement_items_pkey" PRIMARY KEY ("id")
);

-- Migrar: para cada (vehicleId, productId) que aparece em maintenance_label_products,
-- e o produto tinha replaceEveryKm, inserir em vehicle_replacement_items
INSERT INTO "vehicle_replacement_items" ("id", "vehicleId", "productId", "replaceEveryKm", "createdAt", "updatedAt")
SELECT DISTINCT ON (ml."vehicleId", mlp."productId")
  gen_random_uuid(),
  ml."vehicleId",
  mlp."productId",
  p."replaceEveryKm",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "maintenance_label_products" mlp
JOIN "maintenance_labels" ml ON ml.id = mlp."maintenanceLabelId"
JOIN "products" p ON p.id = mlp."productId"
WHERE p."replaceEveryKm" IS NOT NULL AND p."replaceEveryKm" > 0
ORDER BY ml."vehicleId", mlp."productId";

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_replacement_items_vehicleId_productId_key" ON "vehicle_replacement_items"("vehicleId", "productId");

-- AddForeignKey
ALTER TABLE "vehicle_replacement_items" ADD CONSTRAINT "vehicle_replacement_items_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vehicle_replacement_items" ADD CONSTRAINT "vehicle_replacement_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remover coluna replaceEveryKm da tabela products
ALTER TABLE "products" DROP COLUMN IF EXISTS "replaceEveryKm";
