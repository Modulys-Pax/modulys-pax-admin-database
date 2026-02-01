import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty({ description: 'ID do estoque' })
  id: string;

  @ApiProperty({ description: 'ID do produto' })
  productId: string;

  @ApiProperty({ description: 'ID do almoxarifado' })
  warehouseId: string;

  @ApiProperty({ description: 'Quantidade atual em estoque' })
  quantity: number;

  @ApiProperty({ description: 'Custo médio ponderado' })
  averageCost: number;

  @ApiProperty({ description: 'ID da empresa' })
  companyId: string;

  @ApiProperty({ description: 'ID da filial' })
  branchId: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiProperty({ description: 'ID do usuário que criou', required: false })
  createdBy?: string;
}
