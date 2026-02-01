import { ApiProperty } from '@nestjs/swagger';

export class UnitOfMeasurementResponseDto {
  @ApiProperty({ description: 'ID da unidade de medida', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Código da unidade de medida', example: 'UN' })
  code: string;

  @ApiProperty({ description: 'Nome da unidade de medida', example: 'Unidade' })
  name: string;

  @ApiProperty({
    description: 'Descrição da unidade de medida',
    example: 'Unidade de medida padrão',
    required: false,
  })
  description: string | null;

  @ApiProperty({ description: 'Unidade de medida ativa', example: true })
  active: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
