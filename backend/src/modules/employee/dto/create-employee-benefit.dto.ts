import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEmployeeBenefitDto {
  @ApiProperty({
    description: 'ID do funcionário',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do funcionário deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do funcionário é obrigatório' })
  employeeId: string;

  @ApiProperty({
    description: 'ID do benefício do catálogo',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do benefício deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do benefício é obrigatório' })
  benefitId: string;

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
    description: 'Data de início do benefício',
    example: '2024-01-01',
    required: false,
  })
  @IsDateString({}, { message: 'Data de início inválida' })
  @IsOptional()
  startDate?: string;

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
