import { ApiProperty } from '@nestjs/swagger';

export class BenefitInfoDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Vale Transporte' })
  name: string;

  @ApiProperty({ example: 6.0, description: 'Custo diário para a empresa' })
  dailyCost: number;

  @ApiProperty({ example: 5.0, description: 'Valor que o funcionário recebe por dia' })
  employeeValue: number;

  @ApiProperty({ example: false, description: 'Se conta sábados e domingos' })
  includeWeekends: boolean;

  @ApiProperty({ example: 'Vale transporte diário', required: false })
  description?: string;
}

export class EmployeeBenefitResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  employeeId: string;

  @ApiProperty({ example: 'uuid' })
  benefitId: string;

  @ApiProperty({ type: BenefitInfoDto })
  benefit: BenefitInfoDto;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2024-01-01', required: false })
  startDate?: Date;

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
