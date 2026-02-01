import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReceiveAccountReceivableDto {
  @ApiProperty({
    description: 'Data de recebimento',
    example: '2024-02-15T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de recebimento deve ser uma data válida' })
  @IsOptional()
  receiptDate?: string;

  @ApiProperty({
    description: 'Observações sobre o recebimento',
    example: 'Recebimento realizado via PIX',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  notes?: string;
}
