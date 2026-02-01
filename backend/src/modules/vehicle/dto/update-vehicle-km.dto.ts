import { IsInt, Min, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleKmDto {
  @ApiProperty({
    description: 'Nova quilometragem do veículo',
    example: 55000,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(0, { message: 'Quilometragem não pode ser negativa' })
  currentKm: number;

  @ApiProperty({
    description: 'Observações sobre a atualização',
    example: 'Atualização após viagem',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  notes?: string;
}
