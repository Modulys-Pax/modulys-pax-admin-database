import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../../shared/dto/paginated-response.dto';

export class VehicleCostDetailDto {
  @ApiProperty({ example: 'uuid' })
  vehicleId: string;

  @ApiProperty({ example: 'ABC-1234' })
  plate: string;

  @ApiProperty({ example: 'Caminhão Volvo FH 440', required: false })
  model?: string;

  @ApiProperty({
    example: 15000.0,
    description: 'Custo total de manutenções (materiais + serviços)',
  })
  totalMaintenanceCost: number;

  @ApiProperty({ example: 5000.0, description: 'Custo total de materiais (produtos) usados' })
  totalMaterialsCost: number;

  @ApiProperty({ example: 10000.0, description: 'Custo total de serviços' })
  totalServicesCost: number;

  @ApiProperty({ example: 25, description: 'Número total de ordens de manutenção' })
  totalMaintenanceOrders: number;

  @ApiProperty({ example: 15000.0, description: 'Custo no período selecionado' })
  periodCost: number;

  @ApiProperty({ example: 10, description: 'Número de ordens no período' })
  periodOrders: number;
}

export class VehicleCostsSummaryDto {
  @ApiProperty({ example: 20, description: 'Total de veículos' })
  totalVehicles: number;

  @ApiProperty({ example: 300000.0, description: 'Custo total de manutenções' })
  totalMaintenanceCost: number;

  @ApiProperty({ example: 100000.0, description: 'Custo total de materiais' })
  totalMaterialsCost: number;

  @ApiProperty({ example: 200000.0, description: 'Custo total de serviços' })
  totalServicesCost: number;

  @ApiProperty({ example: 500, description: 'Total de ordens de manutenção' })
  totalMaintenanceOrders: number;

  @ApiProperty({ example: 15000.0, description: 'Custo médio por veículo' })
  averageCostPerVehicle: number;
}

export class VehicleCostsResponseDto {
  @ApiProperty({ type: VehicleCostsSummaryDto })
  summary: VehicleCostsSummaryDto;

  @ApiProperty({ type: PaginatedResponseDto })
  vehicles: PaginatedResponseDto<VehicleCostDetailDto>;
}
