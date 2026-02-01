import { ApiProperty } from '@nestjs/swagger';

export class VehicleStatusHistoryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  vehicleId: string;

  @ApiProperty({
    example: 'MAINTENANCE',
    enum: ['ACTIVE', 'MAINTENANCE', 'STOPPED'],
  })
  status: string;

  @ApiProperty({ example: 55000, required: false })
  km?: number;

  @ApiProperty({ example: 'Observações', required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({
    example: 'uuid',
    required: false,
    description: 'ID da ordem de manutenção vinculada',
  })
  maintenanceOrderId?: string;
}
