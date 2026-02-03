-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "migrationsPath" TEXT,
ADD COLUMN     "repositoryUrl" TEXT;

-- AlterTable
ALTER TABLE "tenant_modules" ADD COLUMN     "migrationsApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "migrationsAppliedAt" TIMESTAMP(3),
ADD COLUMN     "schemaVersion" TEXT;
