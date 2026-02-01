import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleStatusDto {
  @ApiProperty({
    description: 'Novo status do veículo',
    example: 'MAINTENANCE',
    enum: ['ACTIVE', 'MAINTENANCE', 'STOPPED'],
  })
  @IsString({ message: 'Status deve ser uma string' })
  @IsNotEmpty({ message: 'Status é obrigatório' })
  status: string;

  @ApiProperty({
    description: 'Quilometragem no momento da mudança',
    example: 55000,
    required: false,
  })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(0, { message: 'Quilometragem não pode ser negativa' })
  @IsOptional()
  km?: number;

  @ApiProperty({
    description: 'Observações sobre a mudança de status',
    example: 'Veículo entrando em manutenção preventiva',
    required: false,
  })
  @IsString({ message: 'Observações deve ser uma string' })
  @IsOptional()
  notes?: string;
}
