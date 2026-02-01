import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBenefitDto {
  @ApiProperty({
    description: 'Nome do benefício',
    example: 'Vale Transporte',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Custo diário para a empresa (R$)',
    example: 6.0,
  })
  @IsNumber({}, { message: 'Custo diário deve ser um número' })
  @Min(0, { message: 'Custo diário não pode ser negativo' })
  @IsNotEmpty({ message: 'Custo diário é obrigatório' })
  @Type(() => Number)
  dailyCost: number;

  @ApiProperty({
    description: 'Valor que o funcionário recebe por dia (R$)',
    example: 5.0,
  })
  @IsNumber({}, { message: 'Valor do funcionário deve ser um número' })
  @Min(0, { message: 'Valor do funcionário não pode ser negativo' })
  @IsNotEmpty({ message: 'Valor do funcionário é obrigatório' })
  @Type(() => Number)
  employeeValue: number;

  @ApiProperty({
    description: 'Se conta sábados e domingos',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean({ message: 'Incluir fins de semana deve ser um booleano' })
  @IsOptional()
  includeWeekends?: boolean;

  @ApiProperty({
    description: 'Descrição/observações',
    example: 'Vale transporte diário',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Benefício ativo',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;

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
