-- AlterTable: Add modulePath field for custom modules
ALTER TABLE "modules" ADD COLUMN "modulePath" TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN "modules"."repositoryUrl" IS 'URL do repositório no GitHub (apenas referência/link)';
COMMENT ON COLUMN "modules"."modulePath" IS 'Nome da pasta do projeto no workspace (ex: grayskull-baileys-service)';
COMMENT ON COLUMN "modules"."migrationsPath" IS 'Subpasta das migrations dentro do projeto (padrão: prisma)';
