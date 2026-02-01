-- AlterTable
ALTER TABLE "products" ADD COLUMN     "unitOfMeasurementId" TEXT;

-- CreateTable
CREATE TABLE "units_of_measurement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "units_of_measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measurement_code_key" ON "units_of_measurement"("code");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unitOfMeasurementId_fkey" FOREIGN KEY ("unitOfMeasurementId") REFERENCES "units_of_measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert initial units of measurement
-- Using fixed UUIDs for consistency
INSERT INTO "units_of_measurement" ("id", "code", "name", "description", "active", "createdAt", "updatedAt") VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'L', 'Litros', 'Unidade de medida para líquidos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440002', 'KG', 'Quilogramas', 'Unidade de medida para peso/massa', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('550e8400-e29b-41d4-a716-446655440003', 'UN', 'Unidade', 'Unidade de medida padrão para contagem', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
