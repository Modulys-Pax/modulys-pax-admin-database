import { Module, forwardRef } from '@nestjs/common';
import { AccountPayableService } from './account-payable.service';
import { AccountPayableController } from './account-payable.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule)],
  controllers: [AccountPayableController],
  providers: [AccountPayableService],
  exports: [AccountPayableService],
})
export class AccountPayableModule {}
