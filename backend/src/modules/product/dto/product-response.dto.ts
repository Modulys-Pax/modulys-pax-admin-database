import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Óleo Motor 15W40' })
  name: string;

  @ApiProperty({ example: 'PROD-001', required: false })
  code?: string;

  @ApiProperty({ example: 'Óleo para motor diesel', required: false })
  description?: string;

  @ApiProperty({ example: 'uuid', required: false, description: 'ID da unidade de medida' })
  unitOfMeasurementId?: string;

  @ApiProperty({ example: 'L', required: false, description: 'Unidade de medida (DEPRECATED)' })
  unit?: string;

  @ApiProperty({ example: 25.5, required: false, description: 'Preço unitário padrão do produto' })
  unitPrice?: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Quantidade mínima em estoque para alerta',
  })
  minQuantity?: number;

  @ApiProperty({
    example: 50,
    required: false,
    description: 'Quantidade total em estoque (soma de todos os warehouses)',
  })
  totalStock?: number;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

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
