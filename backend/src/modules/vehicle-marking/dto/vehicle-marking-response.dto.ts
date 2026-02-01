import { ApiProperty } from '@nestjs/swagger';

export class VehicleMarkingResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  vehicleId: string;

  @ApiProperty({ example: 'ABC-1234', required: false })
  vehiclePlate?: string;

  @ApiProperty({ example: 50000 })
  km: number;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;
}
