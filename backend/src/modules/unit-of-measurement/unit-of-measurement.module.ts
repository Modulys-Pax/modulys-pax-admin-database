import { Module } from '@nestjs/common';
import { UnitOfMeasurementService } from './unit-of-measurement.service';
import { UnitOfMeasurementController } from './unit-of-measurement.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UnitOfMeasurementController],
  providers: [UnitOfMeasurementService],
  exports: [UnitOfMeasurementService],
})
export class UnitOfMeasurementModule {}
