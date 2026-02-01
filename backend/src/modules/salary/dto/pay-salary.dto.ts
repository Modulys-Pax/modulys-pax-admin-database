import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaySalaryDto {
  @ApiProperty({
    description: 'Data de pagamento',
    example: '2024-01-05T00:00:00.000Z',
    required: false,
  })
  @IsDateString({}, { message: 'Data de pagamento deve ser uma data válida' })
  @IsOptional()
  paymentDate?: string;

  @ApiProperty({
    description: 'Observações',
    example: 'Pagamento realizado via transferência bancária',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  notes?: string;
}
