-- AlterTable: vincular entrada do histórico de status à ordem de manutenção (quando aplicável)
ALTER TABLE "vehicle_status_history" ADD COLUMN IF NOT EXISTS "maintenanceOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_maintenanceOrderId_fkey"
  FOREIGN KEY ("maintenanceOrderId") REFERENCES "maintenance_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "vehicle_status_history_maintenanceOrderId_idx" ON "vehicle_status_history"("maintenanceOrderId");
