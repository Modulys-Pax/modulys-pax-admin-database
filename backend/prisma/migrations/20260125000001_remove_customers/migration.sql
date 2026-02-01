-- DropForeignKey
ALTER TABLE "accounts_receivable" DROP CONSTRAINT IF EXISTS "accounts_receivable_customerId_fkey";

-- DropForeignKey
ALTER TABLE "fiscal_documents" DROP CONSTRAINT IF EXISTS "fiscal_documents_customerId_fkey";

-- AlterTable
ALTER TABLE "accounts_receivable" DROP COLUMN IF EXISTS "customerId";

-- AlterTable
ALTER TABLE "fiscal_documents" DROP COLUMN IF EXISTS "customerId";

-- DropTable
DROP TABLE IF EXISTS "customers";
