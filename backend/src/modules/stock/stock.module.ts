import { Module, forwardRef } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AccountPayableModule } from '../account-payable/account-payable.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountPayableModule)],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
