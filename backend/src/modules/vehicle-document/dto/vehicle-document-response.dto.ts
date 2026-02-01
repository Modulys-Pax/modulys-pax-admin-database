import { ApiProperty } from '@nestjs/swagger';
import { VehicleDocumentType } from './create-vehicle-document.dto';

export class VehicleDocumentResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  vehicleId: string;

  @ApiProperty({ enum: VehicleDocumentType, example: 'CRVL' })
  type: VehicleDocumentType;

  @ApiProperty({ example: 'crvl_2024.pdf' })
  fileName: string;

  @ApiProperty({ example: '/uploads/vehicles/ABC-1234/crvl_2024.pdf' })
  filePath: string;

  @ApiProperty({ example: 1024000, required: false })
  fileSize?: number;

  @ApiProperty({ example: 'application/pdf', required: false })
  mimeType?: string;

  @ApiProperty({ example: 'CRVL 2024', required: false })
  description?: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  expiryDate?: Date;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
