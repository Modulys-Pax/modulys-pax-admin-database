import { ApiProperty } from '@nestjs/swagger';

export enum VacationStatus {
  PLANNED = 'PLANNED',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class VacationResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  employeeId: string;

  @ApiProperty({ example: 'João Silva' })
  employeeName?: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-01-30T00:00:00.000Z' })
  endDate: Date;

  @ApiProperty({ example: 30 })
  days: number;

  @ApiProperty({ example: 10, description: 'Dias vendidos (abono pecuniário)' })
  soldDays: number;

  @ApiProperty({ example: false, description: 'Antecipação da 1ª parcela do 13º salário' })
  advance13thSalary: boolean;

  @ApiProperty({ enum: VacationStatus, example: VacationStatus.PLANNED })
  status: VacationStatus;

  @ApiProperty({ example: 'Férias aprovadas pelo gestor', required: false })
  observations?: string;

  // Campos financeiros
  @ApiProperty({ example: 5000, description: 'Salário mensal na época', required: false })
  monthlySalary?: number;

  @ApiProperty({ example: 5000, description: 'Valor base das férias', required: false })
  vacationBase?: number;

  @ApiProperty({ example: 1666.67, description: '1/3 constitucional', required: false })
  vacationThird?: number;

  @ApiProperty({ example: 6666.67, description: 'Total férias (base + 1/3)', required: false })
  vacationTotal?: number;

  @ApiProperty({ example: 0, description: 'Valor dos dias vendidos', required: false })
  soldDaysValue?: number;

  @ApiProperty({ example: 0, description: '1/3 sobre abono', required: false })
  soldDaysThird?: number;

  @ApiProperty({ example: 0, description: 'Total abono', required: false })
  soldDaysTotal?: number;

  @ApiProperty({ example: 2500, description: 'Adiantamento do 13º', required: false })
  advance13thValue?: number;

  @ApiProperty({ example: 9166.67, description: 'Total bruto', required: false })
  grossTotal?: number;

  @ApiProperty({ example: 916.67, description: 'Desconto INSS', required: false })
  inss?: number;

  @ApiProperty({ example: 500, description: 'Desconto IRRF', required: false })
  irrf?: number;

  @ApiProperty({ example: 1416.67, description: 'Total de descontos', required: false })
  totalDeductions?: number;

  @ApiProperty({ example: 7750, description: 'Valor líquido a receber', required: false })
  netTotal?: number;

  @ApiProperty({ example: 733.33, description: 'FGTS (custo empresa)', required: false })
  fgts?: number;

  @ApiProperty({ example: 9900, description: 'Custo total empresa', required: false })
  employerCost?: number;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}
