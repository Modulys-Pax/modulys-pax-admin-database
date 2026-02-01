-- CreateEnum
CREATE TYPE "MaintenanceOrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION');

-- CreateEnum
CREATE TYPE "MaintenanceTimelineEvent" AS ENUM ('STARTED', 'PAUSED', 'RESUMED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "maintenance_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceOrderStatus" NOT NULL DEFAULT 'OPEN',
    "kmAtEntry" INTEGER,
    "description" TEXT,
    "observations" TEXT,
    "totalCost" DECIMAL(65,30) DEFAULT 0,
    "totalTimeMinutes" INTEGER DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "maintenance_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_workers" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "isResponsible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_services" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_materials" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitCost" DECIMAL(65,30) DEFAULT 0,
    "totalCost" DECIMAL(65,30) DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_timeline" (
    "id" TEXT NOT NULL,
    "maintenanceOrderId" TEXT NOT NULL,
    "event" "MaintenanceTimelineEvent" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_orders_companyId_branchId_orderNumber_key" ON "maintenance_orders"("companyId", "branchId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_workers_maintenanceOrderId_employeeId_key" ON "maintenance_workers"("maintenanceOrderId", "employeeId");

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_orders" ADD CONSTRAINT "maintenance_orders_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_workers" ADD CONSTRAINT "maintenance_workers_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_workers" ADD CONSTRAINT "maintenance_workers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_services" ADD CONSTRAINT "maintenance_services_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_materials" ADD CONSTRAINT "maintenance_materials_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_materials" ADD CONSTRAINT "maintenance_materials_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_timeline" ADD CONSTRAINT "maintenance_timeline_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "maintenance_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
