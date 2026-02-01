import { IsString, IsNotEmpty, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterProductChangeItemDto {
  @ApiProperty({
    description: 'ID do item de troca por KM do veículo (vehicleReplacementItemId)',
    example: 'uuid',
  })
  @IsUUID('4', { message: 'ID do item deve ser um UUID válido' })
  @IsNotEmpty({ message: 'Item é obrigatório' })
  vehicleReplacementItemId: string;

  @ApiProperty({
    description: 'Custo da troca deste item (R$). Opcional. Será somado ao total da ordem.',
    example: 350.5,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Custo deve ser um número' })
  @Min(0, { message: 'Custo não pode ser negativo' })
  cost?: number;
}
