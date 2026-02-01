import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class ProductUsageStatDto {
  @ApiProperty({ example: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Óleo Motor 15W40' })
  productName: string;

  @ApiProperty({ example: 'L', required: false })
  unit?: string;

  @ApiProperty({ example: 150.5, description: 'Quantidade total usada' })
  totalQuantityUsed: number;

  @ApiProperty({ example: 5000.0, description: 'Custo total gasto com este produto' })
  totalCost: number;

  @ApiProperty({ example: 33.22, description: 'Custo médio unitário' })
  averageUnitCost: number;

  @ApiProperty({ example: 25, description: 'Número de vezes que foi usado' })
  usageCount: number;

  @ApiProperty({ example: 150.5, description: 'Quantidade usada no período' })
  periodQuantityUsed: number;

  @ApiProperty({ example: 5000.0, description: 'Custo no período' })
  periodCost: number;
}

export class TotalByUnitDto {
  @ApiProperty({ example: 'L', description: 'Código da unidade (L, KG, UN, etc.)' })
  unit: string;

  @ApiProperty({ example: 150.5, description: 'Quantidade total nesta unidade' })
  totalQuantity: number;
}

export class ProductSummaryPeriodDto {
  @ApiProperty({ example: '2025-01', description: 'Período no formato YYYY-MM' })
  period: string;

  @ApiProperty({ example: 50000.0, description: 'Custo total no período' })
  totalCost: number;

  @ApiProperty({
    example: 500.5,
    description:
      'Quantidade total usada no período (soma bruta; use totalQuantityByUnit para totais por unidade)',
  })
  totalQuantity: number;

  @ApiProperty({
    type: [TotalByUnitDto],
    description: 'Quantidade total por unidade de medida no período',
  })
  totalQuantityByUnit: TotalByUnitDto[];

  @ApiProperty({ example: 50, description: 'Número de produtos diferentes usados' })
  productsCount: number;
}

export class ProductSummaryResponseDto {
  @ApiProperty({ example: 100000.0, description: 'Custo total de produtos usados' })
  totalCost: number;

  @ApiProperty({
    type: [TotalByUnitDto],
    description: 'Quantidade usada por unidade de medida (L, KG, UN, etc.)',
  })
  totalQuantityByUnit: TotalByUnitDto[];

  @ApiProperty({ example: 50, description: 'Número de produtos diferentes usados' })
  totalProducts: number;

  @ApiProperty({ example: 200, description: 'Número total de usos (ordens de manutenção)' })
  totalUsages: number;

  @ApiProperty({ type: PaginatedResponseDto, description: 'Estatísticas por produto (paginado)' })
  products: PaginatedResponseDto<ProductUsageStatDto>;

  @ApiProperty({ type: [ProductSummaryPeriodDto], description: 'Estatísticas por período' })
  periods: ProductSummaryPeriodDto[];
}
