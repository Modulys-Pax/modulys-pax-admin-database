import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleModelDto {
  @ApiProperty({ description: 'ID da marca', example: 'uuid' })
  @IsUUID('4', { message: 'ID da marca deve ser um UUID válido' })
  @IsNotEmpty({ message: 'ID da marca é obrigatório' })
  brandId: string;

  @ApiProperty({ description: 'Nome do modelo', example: 'FH 540' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Modelo ativo', example: true, required: false })
  @IsBoolean({ message: 'Active deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
