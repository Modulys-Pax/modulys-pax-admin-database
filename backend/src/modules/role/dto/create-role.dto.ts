import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Nome do cargo', example: 'admin' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiProperty({
    description: 'Descrição do cargo',
    example: 'Administrador do sistema',
    required: false,
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cargo ativo',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser um booleano' })
  @IsOptional()
  active?: boolean;

  @ApiProperty({
    description: 'Lista de nomes de permissões do cargo',
    example: ['vehicles.view', 'vehicles.create', 'employees.view'],
    required: false,
  })
  @IsArray({ message: 'Permissões deve ser um array' })
  @IsString({ each: true, message: 'Cada permissão deve ser uma string' })
  @IsOptional()
  permissions?: string[];
}
