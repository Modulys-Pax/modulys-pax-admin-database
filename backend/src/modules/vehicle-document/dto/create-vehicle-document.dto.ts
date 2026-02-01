import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VehicleDocumentType {
  CRVL = 'CRVL',
  LICENSING = 'LICENSING',
}

export class CreateVehicleDocumentDto {
  @ApiProperty({
    description: 'Tipo do documento',
    enum: VehicleDocumentType,
    example: 'CRVL',
  })
  @IsEnum(VehicleDocumentType, { message: 'Tipo de documento inválido' })
  @IsNotEmpty({ message: 'Tipo do documento é obrigatório' })
  type: VehicleDocumentType;

  @ApiProperty({
    description: 'Descrição opcional do documento',
    example: 'CRVL 2024',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data de validade (para licenciamentos)',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString({}, { message: 'Data de validade deve ser uma data válida' })
  @IsOptional()
  expiryDate?: string;
}
