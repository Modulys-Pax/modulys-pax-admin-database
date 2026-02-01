import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto', example: 'Óleo Motor 15W40' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Código do produto',
    example: 'PROD-001',
    required: false,
  })
  @IsString({ message: 'Código deve ser uma string' })
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Óleo para motor diesel',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID da unidade de medida',
    example: 'uuid',
    required: false,
  })
  @Transform(({ value }) => {
    // Converter string vazia para undefined antes da validação
    if (value === '' || value === null) {
      return undefined;
    }
    return value;
  })
  @IsOptional()
  @ValidateIf((o) => o.unitOfMeasurementId !== undefined)
  @IsUUID('4', { message: 'ID da unidade de medida deve ser um UUID válido' })
  unitOfMeasurementId?: string;

  @ApiProperty({
    description: 'Unidade de medida (DEPRECATED: usar unitOfMeasurementId)',
    example: 'L',
    required: false,
  })
  @IsString({ message: 'Unidade deve ser uma string' })
  @IsOptional()
  unit?: string;

  @ApiProperty({
    description: 'Preço unitário padrão do produto (R$/unidade, R$/kg, R$/L, etc)',
    example: 25.5,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Preço unitário deve ser um número' })
  @Min(0, { message: 'Preço unitário não pode ser negativo' })
  @IsOptional()
  @Type(() => Number)
  unitPrice?: number;

  @ApiProperty({
    description: 'Quantidade mínima em estoque para alerta de estoque baixo',
    example: 10,
    required: false,
    default: 0,
  })
  @IsNumber({}, { message: 'Quantidade mínima deve ser um número' })
  @Min(0, { message: 'Quantidade mínima não pode ser negativa' })
  @IsOptional()
  @Type(() => Number)
  minQuantity?: number;

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

  @ApiProperty({
    description: 'Produto ativo',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
