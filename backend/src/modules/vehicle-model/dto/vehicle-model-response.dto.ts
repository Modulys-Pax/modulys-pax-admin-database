import { ApiProperty } from '@nestjs/swagger';
import { VehicleBrandResponseDto } from '../../vehicle-brand/dto/vehicle-brand-response.dto';

export class VehicleModelResponseDto {
  @ApiProperty({ description: 'ID do modelo', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID da marca', example: 'uuid' })
  brandId: string;

  @ApiProperty({ description: 'Marca do veículo', type: VehicleBrandResponseDto })
  brand: VehicleBrandResponseDto;

  @ApiProperty({ description: 'Nome do modelo', example: 'FH 540' })
  name: string;

  @ApiProperty({ description: 'Modelo ativo', example: true })
  active: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
