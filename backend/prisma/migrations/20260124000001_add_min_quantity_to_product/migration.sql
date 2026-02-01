-- Add minQuantity column to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "minQuantity" DECIMAL(65,30) DEFAULT 0;
