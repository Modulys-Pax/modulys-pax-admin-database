import { ApiProperty } from '@nestjs/swagger';

export type MaintenanceDueStatus = 'ok' | 'warning' | 'due';

export class MaintenanceDueItemDto {
  @ApiProperty({ example: 'uuid', description: 'ID do item de troca (vehicleReplacementItemId)' })
  id: string;

  @ApiProperty({ example: 'uuid', description: 'Compatibilidade: mesmo que id' })
  productId: string;

  @ApiProperty({ example: 'Óleo Motor 15W40' })
  productName: string;

  @ApiProperty({ example: 10000, required: false })
  replaceEveryKm?: number;

  @ApiProperty({ example: 50000 })
  lastChangeKm: number;

  @ApiProperty({ example: 60000 })
  nextChangeKm: number;

  @ApiProperty({
    example: 'warning',
    enum: ['ok', 'warning', 'due'],
    description:
      'ok = dentro do prazo; warning = próximo de trocar (~10% antes); due = vencido/na hora',
  })
  status: MaintenanceDueStatus;
}

export class MaintenanceDueByVehicleDto {
  @ApiProperty({
    example: 55000,
    description:
      'KM de referência (última marcação ou KM atual do veículo) usada para calcular o status',
  })
  referenceKm: number;

  @ApiProperty({ type: [MaintenanceDueItemDto] })
  items: MaintenanceDueItemDto[];
}
