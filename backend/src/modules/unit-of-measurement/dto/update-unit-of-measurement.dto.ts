import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUnitOfMeasurementDto {
  @ApiProperty({
    description: 'Código da unidade de medida',
    example: 'UN',
    required: false,
  })
  @IsString({ message: 'Código deve ser uma string' })
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Nome da unidade de medida',
    example: 'Unidade',
    required: false,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descrição da unidade de medida',
    example: 'Unidade de medida padrão',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Unidade de medida ativa',
    example: true,
    required: false,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;
}
