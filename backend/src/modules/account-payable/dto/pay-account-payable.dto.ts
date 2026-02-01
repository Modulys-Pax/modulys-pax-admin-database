import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayAccountPayableDto {
  @ApiProperty({
    description: 'Data de pagamento',
    example: '2024-02-15T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida' })
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Observações sobre o pagamento',
    example: 'Pagamento realizado via PIX',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  notes?: string;
}
