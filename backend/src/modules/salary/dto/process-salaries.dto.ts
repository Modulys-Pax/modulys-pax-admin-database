import { IsNotEmpty, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessSalariesDto {
  @ApiProperty({
    description: 'Mês de referência (1-12)',
    example: 1,
  })
  @IsInt({ message: 'Mês deve ser um número inteiro' })
  @Min(1, { message: 'Mês deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês deve ser entre 1 e 12' })
  @IsNotEmpty({ message: 'Mês de referência é obrigatório' })
  referenceMonth: number;

  @ApiProperty({
    description: 'Ano de referência',
    example: 2024,
  })
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(2000, { message: 'Ano inválido' })
  @IsNotEmpty({ message: 'Ano de referência é obrigatório' })
  referenceYear: number;

  @ApiProperty({
    description: 'ID da empresa',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID da empresa deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da empresa é obrigatório' })
  companyId: string;

  @ApiProperty({
    description: 'ID da filial',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID da filial deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da filial é obrigatório' })
  branchId: string;
}

export class ProcessSalariesResultDto {
  @ApiProperty({ description: 'Total de funcionários ativos' })
  totalEmployees: number;

  @ApiProperty({ description: 'Salários criados nesta apuração' })
  created: number;

  @ApiProperty({ description: 'Salários que já estavam pendentes' })
  alreadyPending: number;

  @ApiProperty({ description: 'Salários que já estavam pagos' })
  alreadyPaid: number;

  @ApiProperty({ description: 'Funcionários sem salário base definido (ignorados)' })
  skippedNoSalary: number;

  @ApiProperty({ description: 'Detalhes por funcionário' })
  details: ProcessSalaryEmployeeDetail[];
}

export class ProcessSalaryEmployeeDetail {
  @ApiProperty({ description: 'ID do funcionário' })
  employeeId: string;

  @ApiProperty({ description: 'Nome do funcionário' })
  employeeName: string;

  @ApiProperty({ description: 'Valor do salário' })
  amount: number;

  @ApiProperty({
    description: 'Status: created, already_pending, already_paid, skipped_no_salary',
  })
  status: 'created' | 'already_pending' | 'already_paid' | 'skipped_no_salary';

  @ApiProperty({ description: 'ID do salário (se existir)', required: false })
  salaryId?: string;

  @ApiProperty({ description: 'Data de pagamento (se pago)', required: false })
  paymentDate?: Date;
}
