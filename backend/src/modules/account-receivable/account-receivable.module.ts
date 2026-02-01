import { Module, forwardRef } from '@nestjs/common';
import { AccountReceivableService } from './account-receivable.service';
import { AccountReceivableController } from './account-receivable.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [PrismaModule, forwardRef(() => WalletModule)],
  controllers: [AccountReceivableController],
  providers: [AccountReceivableService],
  exports: [AccountReceivableService],
})
export class AccountReceivableModule {}
