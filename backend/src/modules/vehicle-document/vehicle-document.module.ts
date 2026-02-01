import { Module } from '@nestjs/common';
import { VehicleDocumentService } from './vehicle-document.service';
import { VehicleDocumentController } from './vehicle-document.controller';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Module({
  controllers: [VehicleDocumentController],
  providers: [VehicleDocumentService, PrismaService],
  exports: [VehicleDocumentService],
})
export class VehicleDocumentModule {}
