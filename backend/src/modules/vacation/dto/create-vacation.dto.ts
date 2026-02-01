import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVacationDto {
  @ApiProperty({
    description: 'ID do funcionário',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do funcionário deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do funcionário é obrigatório' })
  employeeId: string;

  @ApiProperty({
    description: 'Data de início',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  startDate: string;

  @ApiProperty({
    description: 'Data de término',
    example: '2024-01-30T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'Data de término deve ser uma data válida' })
  @IsNotEmpty({ message: 'Data de término é obrigatória' })
  endDate: string;

  @ApiProperty({
    description: 'Quantidade de dias de férias',
    example: 30,
  })
  @IsInt({ message: 'Quantidade de dias deve ser um número inteiro' })
  @Min(1, { message: 'Quantidade de dias deve ser maior que zero' })
  @IsNotEmpty({ message: 'Quantidade de dias é obrigatória' })
  days: number;

  @ApiProperty({
    description: 'Dias vendidos (abono pecuniário) - máximo 10 dias',
    example: 10,
    required: false,
    default: 0,
  })
  @IsInt({ message: 'Dias vendidos deve ser um número inteiro' })
  @Min(0, { message: 'Dias vendidos não pode ser negativo' })
  @Max(10, { message: 'O máximo de dias que podem ser vendidos é 10' })
  @IsOptional()
  soldDays?: number;

  @ApiProperty({
    description: 'Antecipar 1ª parcela do 13º salário',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'Antecipação do 13º deve ser verdadeiro ou falso' })
  @IsOptional()
  advance13thSalary?: boolean;

  @ApiProperty({
    description: 'Observações',
    example: 'Férias aprovadas pelo gestor',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  observations?: string;

  // Campos financeiros calculados
  @ApiProperty({ description: 'Salário mensal na época', required: false })
  @IsNumber({}, { message: 'Salário mensal deve ser um número' })
  @IsOptional()
  monthlySalary?: number;

  @ApiProperty({ description: 'Valor base das férias (dias gozados)', required: false })
  @IsNumber({}, { message: 'Valor base das férias deve ser um número' })
  @IsOptional()
  vacationBase?: number;

  @ApiProperty({ description: '1/3 constitucional', required: false })
  @IsNumber({}, { message: '1/3 constitucional deve ser um número' })
  @IsOptional()
  vacationThird?: number;

  @ApiProperty({ description: 'Total férias (base + 1/3)', required: false })
  @IsNumber({}, { message: 'Total férias deve ser um número' })
  @IsOptional()
  vacationTotal?: number;

  @ApiProperty({ description: 'Valor dos dias vendidos (abono)', required: false })
  @IsNumber({}, { message: 'Valor dos dias vendidos deve ser um número' })
  @IsOptional()
  soldDaysValue?: number;

  @ApiProperty({ description: '1/3 sobre abono', required: false })
  @IsNumber({}, { message: '1/3 sobre abono deve ser um número' })
  @IsOptional()
  soldDaysThird?: number;

  @ApiProperty({ description: 'Total abono (valor + 1/3)', required: false })
  @IsNumber({}, { message: 'Total abono deve ser um número' })
  @IsOptional()
  soldDaysTotal?: number;

  @ApiProperty({ description: 'Valor do adiantamento do 13º', required: false })
  @IsNumber({}, { message: 'Adiantamento do 13º deve ser um número' })
  @IsOptional()
  advance13thValue?: number;

  @ApiProperty({ description: 'Total bruto', required: false })
  @IsNumber({}, { message: 'Total bruto deve ser um número' })
  @IsOptional()
  grossTotal?: number;

  @ApiProperty({ description: 'Desconto INSS', required: false })
  @IsNumber({}, { message: 'INSS deve ser um número' })
  @IsOptional()
  inss?: number;

  @ApiProperty({ description: 'Desconto IRRF', required: false })
  @IsNumber({}, { message: 'IRRF deve ser um número' })
  @IsOptional()
  irrf?: number;

  @ApiProperty({ description: 'Total de descontos', required: false })
  @IsNumber({}, { message: 'Total de descontos deve ser um número' })
  @IsOptional()
  totalDeductions?: number;

  @ApiProperty({ description: 'Valor líquido a receber', required: false })
  @IsNumber({}, { message: 'Valor líquido deve ser um número' })
  @IsOptional()
  netTotal?: number;

  @ApiProperty({ description: 'FGTS (custo empresa)', required: false })
  @IsNumber({}, { message: 'FGTS deve ser um número' })
  @IsOptional()
  fgts?: number;

  @ApiProperty({ description: 'Custo total empresa', required: false })
  @IsNumber({}, { message: 'Custo total empresa deve ser um número' })
  @IsOptional()
  employerCost?: number;

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
