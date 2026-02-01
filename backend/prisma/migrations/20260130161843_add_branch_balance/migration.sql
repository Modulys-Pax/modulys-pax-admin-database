-- CreateEnum
CREATE TYPE "BalanceAdjustmentType" AS ENUM ('MANUAL_ADJUSTMENT', 'INITIAL_BALANCE', 'CORRECTION');

-- CreateTable
CREATE TABLE "branch_balances" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_adjustments" (
    "id" TEXT NOT NULL,
    "branchBalanceId" TEXT NOT NULL,
    "previousBalance" DECIMAL(65,30) NOT NULL,
    "newBalance" DECIMAL(65,30) NOT NULL,
    "adjustmentType" "BalanceAdjustmentType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "balance_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_balances_branchId_key" ON "branch_balances"("branchId");

-- AddForeignKey
ALTER TABLE "branch_balances" ADD CONSTRAINT "branch_balances_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_adjustments" ADD CONSTRAINT "balance_adjustments_branchBalanceId_fkey" FOREIGN KEY ("branchBalanceId") REFERENCES "branch_balances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
