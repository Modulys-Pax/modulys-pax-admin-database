import { ApiProperty } from '@nestjs/swagger';

export class VehiclePlateResponseDto {
  @ApiProperty({ enum: ['CAVALO', 'PRIMEIRA_CARRETA', 'DOLLY', 'SEGUNDA_CARRETA'] })
  type: string;

  @ApiProperty({ example: 'ABC1D23' })
  plate: string;
}

export class VehicleResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  /** Placa principal (cavalo se existir, senão primeira da lista) - compatibilidade */
  @ApiProperty({ example: 'ABC1D23' })
  plate: string;

  @ApiProperty({
    description: 'Placas por tipo (cavalo, primeira carreta, dolly, segunda carreta)',
    type: [VehiclePlateResponseDto],
  })
  plates: VehiclePlateResponseDto[];

  @ApiProperty({
    description: 'Itens para troca a cada X KM neste veículo (nome + intervalo em KM)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        replaceEveryKm: { type: 'number' },
      },
    },
  })
  replacementItems: { id: string; name: string; replaceEveryKm: number }[];

  @ApiProperty({ example: 'uuid', required: false })
  brandId?: string;

  @ApiProperty({ example: 'Volvo', required: false })
  brandName?: string;

  @ApiProperty({ example: 'uuid', required: false })
  modelId?: string;

  @ApiProperty({ example: 'FH 540', required: false })
  modelName?: string;

  @ApiProperty({ example: 2020, required: false })
  year?: number;

  @ApiProperty({ example: 'Branco', required: false })
  color?: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', required: false })
  chassis?: string;

  @ApiProperty({ example: '12345678901', required: false })
  renavam?: string;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiProperty({ example: 50000, required: false })
  currentKm?: number;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'MAINTENANCE', 'STOPPED'],
  })
  status: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}
