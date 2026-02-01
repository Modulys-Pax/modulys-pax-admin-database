import { Module, forwardRef } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AccountPayableModule } from '../account-payable/account-payable.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AccountPayableModule)],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
