import { Module } from '@nestjs/common';
import { VehicleMarkingService } from './vehicle-marking.service';
import { VehicleMarkingController } from './vehicle-marking.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleMarkingController],
  providers: [VehicleMarkingService],
  exports: [VehicleMarkingService],
})
export class VehicleMarkingModule {}
