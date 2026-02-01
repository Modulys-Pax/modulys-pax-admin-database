import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalaryDto {
  @ApiProperty({
    description: 'ID do funcionário',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do funcionário deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do funcionário é obrigatório' })
  employeeId: string;

  @ApiProperty({
    description: 'Valor do salário (se não informado, usa monthlySalary do funcionário)',
    example: 5000.0,
    required: false,
  })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  @IsOptional()
  amount?: number;

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
    description: 'Data de pagamento',
    example: '2024-01-05T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida' })
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Descrição/observações',
    example: 'Salário referente ao mês de janeiro',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

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
