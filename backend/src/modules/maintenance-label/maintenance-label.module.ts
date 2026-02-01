import { Module, forwardRef } from '@nestjs/common';
import { MaintenanceLabelService } from './maintenance-label.service';
import { MaintenanceLabelController } from './maintenance-label.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AccountPayableModule } from '../account-payable/account-payable.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountPayableModule)],
  controllers: [MaintenanceLabelController],
  providers: [MaintenanceLabelService],
  exports: [MaintenanceLabelService],
})
export class MaintenanceLabelModule {}
