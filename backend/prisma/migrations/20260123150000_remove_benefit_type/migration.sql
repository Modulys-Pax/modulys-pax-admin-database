-- AlterTable
ALTER TABLE "benefits" DROP COLUMN "type";

-- DropEnum (se não houver mais referências ao enum)
-- Nota: O enum BenefitType pode ser usado em outros lugares, então vamos apenas comentar
-- Se não houver mais uso, pode ser removido manualmente depois
-- DROP TYPE "BenefitType";
