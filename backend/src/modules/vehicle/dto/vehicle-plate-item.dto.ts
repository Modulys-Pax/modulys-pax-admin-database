import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehiclePlateType } from '@prisma/client';

export const VEHICLE_PLATE_TYPES: VehiclePlateType[] = [
  'CAVALO',
  'PRIMEIRA_CARRETA',
  'DOLLY',
  'SEGUNDA_CARRETA',
];

export class VehiclePlateItemDto {
  @ApiProperty({
    description: 'Tipo do componente',
    enum: VEHICLE_PLATE_TYPES,
    example: 'CAVALO',
  })
  @IsEnum(VEHICLE_PLATE_TYPES, {
    message: 'Tipo deve ser CAVALO, PRIMEIRA_CARRETA, DOLLY ou SEGUNDA_CARRETA',
  })
  type: VehiclePlateType;

  @ApiProperty({ description: 'Placa do componente', example: 'ABC1D23' })
  @IsString({ message: 'Placa deve ser uma string' })
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  plate: string;
}
