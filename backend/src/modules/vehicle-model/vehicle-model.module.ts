import { Module } from '@nestjs/common';
import { VehicleModelService } from './vehicle-model.service';
import { VehicleModelController } from './vehicle-model.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleModelController],
  providers: [VehicleModelService],
  exports: [VehicleModelService],
})
export class VehicleModelModule {}
