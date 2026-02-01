-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'STOPPED');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "currentKm" INTEGER,
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "vehicle_status_history" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL,
    "km" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "vehicle_status_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehicle_status_history" ADD CONSTRAINT "vehicle_status_history_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
