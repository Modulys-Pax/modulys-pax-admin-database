import { Module } from '@nestjs/common';
import { FinancialTransactionService } from './financial-transaction.service';
import { FinancialTransactionController } from './financial-transaction.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinancialTransactionController],
  providers: [FinancialTransactionService],
  exports: [FinancialTransactionService],
})
export class FinancialTransactionModule {}
