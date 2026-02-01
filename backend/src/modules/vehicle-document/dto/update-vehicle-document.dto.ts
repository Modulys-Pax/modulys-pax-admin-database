import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleDocumentDto {
  @ApiProperty({
    description: 'Descrição do documento',
    example: 'CRVL 2024',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data de validade',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString({}, { message: 'Data de validade deve ser uma data válida' })
  @IsOptional()
  expiryDate?: string;
}
