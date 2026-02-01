-- AlterTable
ALTER TABLE "products" ADD COLUMN     "replaceEveryKm" INTEGER;

-- CreateTable
CREATE TABLE "vehicle_markings" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "km" INTEGER NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "vehicle_markings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_labels" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_label_products" (
    "id" TEXT NOT NULL,
    "maintenanceLabelId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lastChangeKm" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "maintenance_label_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_markings_vehicleId_idx" ON "vehicle_markings"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_markings_companyId_branchId_idx" ON "vehicle_markings"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "vehicle_markings_createdAt_idx" ON "vehicle_markings"("createdAt");

-- CreateIndex
CREATE INDEX "maintenance_labels_vehicleId_idx" ON "maintenance_labels"("vehicleId");

-- CreateIndex
CREATE INDEX "maintenance_labels_companyId_branchId_idx" ON "maintenance_labels"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "maintenance_labels_createdAt_idx" ON "maintenance_labels"("createdAt");

-- CreateIndex
CREATE INDEX "maintenance_label_products_productId_idx" ON "maintenance_label_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_label_products_maintenanceLabelId_productId_key" ON "maintenance_label_products"("maintenanceLabelId", "productId");

-- AddForeignKey
ALTER TABLE "vehicle_markings" ADD CONSTRAINT "vehicle_markings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_markings" ADD CONSTRAINT "vehicle_markings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_markings" ADD CONSTRAINT "vehicle_markings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_labels" ADD CONSTRAINT "maintenance_labels_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_labels" ADD CONSTRAINT "maintenance_labels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_labels" ADD CONSTRAINT "maintenance_labels_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_label_products" ADD CONSTRAINT "maintenance_label_products_maintenanceLabelId_fkey" FOREIGN KEY ("maintenanceLabelId") REFERENCES "maintenance_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_label_products" ADD CONSTRAINT "maintenance_label_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
