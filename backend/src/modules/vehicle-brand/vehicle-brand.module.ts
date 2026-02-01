import { Module } from '@nestjs/common';
import { VehicleBrandService } from './vehicle-brand.service';
import { VehicleBrandController } from './vehicle-brand.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleBrandController],
  providers: [VehicleBrandService],
  exports: [VehicleBrandService],
})
export class VehicleBrandModule {}
