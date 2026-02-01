import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterProductChangeItemDto } from './register-product-change-item.dto';

export class RegisterProductChangeDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do veículo deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID do veículo é obrigatório' })
  vehicleId: string;

  @ApiProperty({
    description: 'Quilometragem em que os itens foram trocados',
    example: 60000,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(0, { message: 'Quilometragem não pode ser negativa' })
  @IsNotEmpty({ message: 'Quilometragem é obrigatória' })
  changeKm: number;

  @ApiProperty({
    description: 'Itens trocados na estrada (pelo menos um)',
    type: [RegisterProductChangeItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Informe pelo menos um item trocado' })
  @ValidateNested({ each: true })
  @Type(() => RegisterProductChangeItemDto)
  items: RegisterProductChangeItemDto[];

  @ApiProperty({
    description: 'Data em que o serviço foi realizado na estrada (ISO 8601)',
    example: '2026-01-28',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data do serviço deve ser uma data válida' })
  serviceDate?: string;

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
