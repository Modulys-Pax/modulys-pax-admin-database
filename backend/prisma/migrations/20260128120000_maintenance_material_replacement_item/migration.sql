-- AlterTable: vincular material da ordem ao item de troca por KM (opcional)
ALTER TABLE "maintenance_materials" ADD COLUMN IF NOT EXISTS "vehicleReplacementItemId" TEXT;

ALTER TABLE "maintenance_materials" ADD CONSTRAINT "maintenance_materials_vehicleReplacementItemId_fkey"
  FOREIGN KEY ("vehicleReplacementItemId") REFERENCES "vehicle_replacement_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "maintenance_materials_vehicleReplacementItemId_idx" ON "maintenance_materials"("vehicleReplacementItemId");
