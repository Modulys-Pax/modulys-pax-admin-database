import { ApiProperty } from '@nestjs/swagger';

export class VehicleBrandResponseDto {
  @ApiProperty({ description: 'ID da marca', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nome da marca', example: 'Volvo' })
  name: string;

  @ApiProperty({ description: 'Marca ativa', example: true })
  active: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
