import { IsString, IsInt, Min, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VehicleReplacementItemDto {
  @ApiProperty({
    description: 'Nome/descrição do item (ex: Óleo Motor 15W40, Filtro de óleo)',
    example: 'Óleo Motor 15W40',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do item é obrigatório' })
  @MaxLength(255, { message: 'Nome do item deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Trocar a cada X KM neste veículo',
    example: 10000,
  })
  @IsInt({ message: 'Troca em KM deve ser um número inteiro' })
  @Min(1, { message: 'Troca em KM deve ser pelo menos 1' })
  replaceEveryKm: number;
}
