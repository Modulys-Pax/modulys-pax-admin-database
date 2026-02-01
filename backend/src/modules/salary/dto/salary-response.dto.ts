import { ApiProperty } from '@nestjs/swagger';

export class SalaryResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'uuid' })
  employeeId: string;

  @ApiProperty({ example: 'João Silva' })
  employeeName?: string;

  @ApiProperty({ example: 5000.0 })
  amount: number;

  @ApiProperty({ example: 1 })
  referenceMonth: number;

  @ApiProperty({ example: 2024 })
  referenceYear: number;

  @ApiProperty({ example: '2024-01-05T00:00:00.000Z', required: false })
  paymentDate?: Date;

  @ApiProperty({ example: 'Salário referente ao mês de janeiro', required: false })
  description?: string;

  @ApiProperty({ example: 'uuid' })
  companyId: string;

  @ApiProperty({ example: 'uuid' })
  branchId: string;

  @ApiProperty({ example: 'uuid', required: false })
  financialTransactionId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  deletedAt?: Date;
}
