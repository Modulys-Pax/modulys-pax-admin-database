-- CreateEnum: tipos de componente do veículo (cavalo, carretas, dolly)
CREATE TYPE "VehiclePlateType" AS ENUM ('CAVALO', 'PRIMEIRA_CARRETA', 'DOLLY', 'SEGUNDA_CARRETA');

-- CreateTable: placas por tipo (cavalo, primeira carreta, dolly, segunda carreta)
CREATE TABLE "vehicle_plates" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "VehiclePlateType" NOT NULL,
    "plate" TEXT NOT NULL,

    CONSTRAINT "vehicle_plates_pkey" PRIMARY KEY ("id")
);

-- Migrar placas existentes: cada veículo recebe uma placa do tipo CAVALO
INSERT INTO "vehicle_plates" ("id", "vehicleId", "type", "plate")
SELECT gen_random_uuid(), "id", 'CAVALO', "plate" FROM "vehicles" WHERE "plate" IS NOT NULL AND "plate" != '';

-- CreateIndex: único por veículo e tipo (um cavalo, uma primeira carreta, etc.)
CREATE UNIQUE INDEX "vehicle_plates_vehicleId_type_key" ON "vehicle_plates"("vehicleId", "type");

-- AddForeignKey
ALTER TABLE "vehicle_plates" ADD CONSTRAINT "vehicle_plates_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remover índice único antigo (companyId, branchId, plate)
DROP INDEX IF EXISTS "vehicles_companyId_branchId_plate_key";

-- Remover coluna plate da tabela vehicles
ALTER TABLE "vehicles" DROP COLUMN "plate";
