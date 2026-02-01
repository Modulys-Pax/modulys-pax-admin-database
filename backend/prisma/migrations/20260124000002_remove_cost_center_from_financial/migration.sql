-- Remove costCenterId from financial tables

-- Remove costCenterId from financial_transactions
ALTER TABLE "financial_transactions" DROP COLUMN IF EXISTS "costCenterId";

-- Remove costCenterId from accounts_payable
ALTER TABLE "accounts_payable" DROP COLUMN IF EXISTS "costCenterId";

-- Remove costCenterId from accounts_receivable
ALTER TABLE "accounts_receivable" DROP COLUMN IF EXISTS "costCenterId";

-- Remove costCenterId from salaries
ALTER TABLE "salaries" DROP COLUMN IF EXISTS "costCenterId";

-- Remove costCenterId from expenses
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "costCenterId";
