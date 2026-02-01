-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "accounts_payable" DROP CONSTRAINT IF EXISTS "accounts_payable_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_documents" DROP CONSTRAINT IF EXISTS "fiscal_documents_supplierId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN IF EXISTS "supplierId";

-- AlterTable
ALTER TABLE "accounts_payable" DROP COLUMN IF EXISTS "supplierId";

-- AlterTable
ALTER TABLE "fiscal_documents" DROP COLUMN IF EXISTS "supplierId";

-- DropTable
DROP TABLE IF EXISTS "suppliers";
