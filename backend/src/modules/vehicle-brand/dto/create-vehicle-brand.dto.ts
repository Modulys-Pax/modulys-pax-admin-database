import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleBrandDto {
  @ApiProperty({ description: 'Nome da marca', example: 'Volvo' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({ description: 'Marca ativa', example: true, required: false })
  @IsBoolean({ message: 'Active deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
